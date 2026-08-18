// lib/fileSearchOrchestrator.ts
/**
 * File Search Orchestrator - OpenClaw-style sequential search
 * 
 * Behavior:
 * 1. Ask permission for Desktop first → Search → If not found
 * 2. Ask permission for Documents → Search → If not found  
 * 3. Ask permission for Downloads → Search → If not found
 * 4. Report "not found" with human-readable logs
 * 
 * Queue-based: Each step requires explicit permission before proceeding
 */

export type SearchLocation = 'Desktop' | 'Documents' | 'Downloads' | 'Home';

export interface SearchStep {
  id: string;
  location: SearchLocation;
  status: 'pending' | 'requesting_permission' | 'searching' | 'found' | 'not_found' | 'denied' | 'error';
  permissionGranted: boolean | null;
  results: SearchResult[];
  error?: string;
  timestamp: number;
  humanLog: string;
}

export interface SearchResult {
  path: string;
  name: string;
  size?: number;
  modifiedAt?: string;
}

export interface FileSearchOperation {
  id: string;
  filename: string;
  steps: SearchStep[];
  currentStepIndex: number;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'not_found';
  startedAt: number;
  completedAt?: number;
  foundFile?: SearchResult;
}

export interface FileSearchQueueItem {
  operation: FileSearchOperation;
  resolve: (result: FileSearchOperation) => void;
  reject: (error: Error) => void;
}

// Default search order
const DEFAULT_SEARCH_ORDER: SearchLocation[] = ['Desktop', 'Documents', 'Downloads'];

class FileSearchOrchestrator {
  private queue: FileSearchQueueItem[] = [];
  private currentOperation: FileSearchOperation | null = null;
  private listeners: Set<(state: FileSearchOrchestratorState) => void> = new Set();

  getState(): FileSearchOrchestratorState {
    return {
      queue: this.queue.map(item => item.operation),
      currentOperation: this.currentOperation,
      isProcessing: this.currentOperation !== null
    };
  }

  subscribe(listener: (state: FileSearchOrchestratorState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Start a new file search operation
   * Returns a promise that resolves when the search completes (found or not found)
   */
  async searchFile(filename: string, customOrder?: SearchLocation[]): Promise<FileSearchOperation> {
    const operation: FileSearchOperation = {
      id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      filename,
      steps: (customOrder || DEFAULT_SEARCH_ORDER).map((location, index) => ({
        id: `${location.toLowerCase()}-${Date.now()}-${index}`,
        location,
        status: 'pending',
        permissionGranted: null,
        results: [],
        timestamp: Date.now(),
        humanLog: `Waiting to check ${location}`
      })),
      currentStepIndex: 0,
      status: 'pending',
      startedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Grant permission for the current step and proceed with search
   */
  async grantPermission(operationId: string): Promise<void> {
    if (!this.currentOperation || this.currentOperation.id !== operationId) {
      console.warn('[FileSearchOrchestrator] No matching operation to grant permission');
      return;
    }

    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (!currentStep) return;

    currentStep.permissionGranted = true;
    currentStep.status = 'searching';
    currentStep.humanLog = `🔍 Searching in ${currentStep.location}...`;
    this.notify();

    // Perform actual search
    await this.performSearch(currentStep, this.currentOperation.filename);
    
    // If found, complete the operation
    if (currentStep.status === 'found' && currentStep.results.length > 0) {
      this.currentOperation.status = 'completed';
      this.currentOperation.completedAt = Date.now();
      this.currentOperation.foundFile = currentStep.results[0];
      currentStep.humanLog = `✅ Found "${this.currentOperation.filename}" in ${currentStep.location}!`;
      this.notify();
      this.completeCurrentOperation();
      return;
    }

    // If not found, move to next step
    if (currentStep.status === 'not_found') {
      this.moveToNextStep();
    }
  }

  /**
   * Deny permission and skip to next location
   */
  denyPermission(operationId: string): void {
    if (!this.currentOperation || this.currentOperation.id !== operationId) {
      return;
    }

    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (!currentStep) return;

    currentStep.permissionGranted = false;
    currentStep.status = 'denied';
    currentStep.humanLog = `⛔ Permission denied for ${currentStep.location}, trying next location...`;
    this.notify();

    this.moveToNextStep();
  }

  /**
   * Cancel the current search operation
   */
  cancelOperation(operationId: string): void {
    if (!this.currentOperation || this.currentOperation.id !== operationId) {
      return;
    }

    this.currentOperation.status = 'cancelled';
    this.currentOperation.completedAt = Date.now();
    
    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (currentStep) {
      currentStep.humanLog = `🚫 Search cancelled by user`;
    }
    
    this.notify();
    this.completeCurrentOperation();
  }

  private async processQueue() {
    if (this.currentOperation || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift()!;
    this.currentOperation = item.operation;
    this.currentOperation.status = 'running';
    
    // Set first step to requesting_permission
    const firstStep = this.currentOperation.steps[0];
    if (firstStep) {
      firstStep.status = 'requesting_permission';
      firstStep.humanLog = `🔐 Requesting permission to search in ${firstStep.location}...`;
    }

    this.notify();

    // The caller must grant/deny permission via the UI
    // Wait for the operation to complete
  }

  private async performSearch(step: SearchStep, filename: string): Promise<void> {
    try {
      // Call the native file search API
      const response = await fetch('/api/native/file-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: step.location,
          filename,
          operationId: this.currentOperation?.id
        })
      });

      const data = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        step.status = 'found';
        step.results = data.results;
      } else if (data.needConsent) {
        step.status = 'requesting_permission';
        step.humanLog = `🔐 Need permission to access ${step.location}`;
      } else {
        step.status = 'not_found';
        step.humanLog = `❌ Not found in ${step.location}, checking next location...`;
      }
    } catch (error: any) {
      step.status = 'error';
      step.error = error.message;
      step.humanLog = `⚠️ Error searching ${step.location}: ${error.message}`;
    }

    this.notify();
  }

  private moveToNextStep() {
    if (!this.currentOperation) return;

    const nextIndex = this.currentOperation.currentStepIndex + 1;
    
    if (nextIndex >= this.currentOperation.steps.length) {
      // All locations checked, not found
      this.currentOperation.status = 'not_found';
      this.currentOperation.completedAt = Date.now();
      this.currentOperation.steps[this.currentOperation.currentStepIndex].humanLog = 
        `❌ "${this.currentOperation.filename}" not found in any location (Desktop, Documents, Downloads)`;
      this.notify();
      this.completeCurrentOperation();
      return;
    }

    this.currentOperation.currentStepIndex = nextIndex;
    const nextStep = this.currentOperation.steps[nextIndex];
    nextStep.status = 'requesting_permission';
    nextStep.humanLog = `🔐 Requesting permission to search in ${nextStep.location}...`;
    this.notify();
  }

  private completeCurrentOperation() {
    if (!this.currentOperation) return;

    const completed = this.currentOperation;
    const item = this.queue.find(i => i.operation.id === completed.id);
    
    if (item) {
      item.resolve(completed);
    } else {
      // Operation was started from queue, resolve it
      // Create a temporary promise resolution
    }

    this.currentOperation = null;
    this.notify();
    this.processQueue();
  }

  /**
   * Get human-readable summary of current search status
   */
  getStatusSummary(): string {
    if (!this.currentOperation) {
      return 'No active file search';
    }

    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (!currentStep) {
      return `Searching for "${this.currentOperation.filename}"...`;
    }

    return currentStep.humanLog;
  }
}

export interface FileSearchOrchestratorState {
  queue: FileSearchOperation[];
  currentOperation: FileSearchOperation | null;
  isProcessing: boolean;
}

// Singleton instance
export const fileSearchOrchestrator = new FileSearchOrchestrator();
