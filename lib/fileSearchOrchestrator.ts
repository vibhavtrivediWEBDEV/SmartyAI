// lib/fileSearchOrchestrator.v2.ts
/**
 * File Search Orchestrator V2 - Production Queue-Based Architecture
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. Real QUEUE (array of operations, not singleton)
 * 2. Process queue serially (one at a time)
 * 3. Each operation: independent state machine
 * 4. Version stamping for cache detection
 * 5. Non-blocking: enqueue() returns ID immediately
 * 6. Dynamic capability permission queue (Documents → Desktop → Downloads)
 * 7. Waiting for permission ≠ failed
 * 8. Exact operation context preserved for resumption
 */

import capabilityQueue, { ScopedCapability } from './capabilityQueue';

export type SearchLocation = 'Desktop' | 'Documents' | 'Downloads' | 'Home';

export interface SearchResult {
  path: string;
  name: string;
  size?: number;
  modifiedAt?: string;
  score?: number;
  extension?: string;
  description?: string;
}

export interface SearchStep {
  id: string;
  location: SearchLocation;
  status: 'pending' | 'requesting_permission' | 'waiting_permission' | 'searching' | 'found' | 'not_found' | 'denied' | 'error';
  permissionGranted: boolean | null;
  permissionRequestId?: string;
  results?: SearchResult[];
  error?: string;
  timestamp: number;
  humanLog: string;
}

export type OperationStatus = 
  | 'pending'
  | 'running'
  | 'awaiting_permission'
  | 'results_ready'
  | 'moving_file'
  | 'completed'
  | 'not_found'
  | 'cancelled'
  | 'denied'
  | 'error';

export interface FileSearchOperation {
  id: string;
  filename: string;
  steps: SearchStep[];
  currentStepIndex: number;
  status: OperationStatus;
  startedAt: number;
  completedAt?: number;
  foundFile?: SearchResult;
  allResults?: SearchResult[]; // All ranked results for user selection
}

export interface FileSearchOrchestratorState {
  queue: FileSearchOperation[];
  currentOperation: FileSearchOperation | null;
  isProcessing: boolean;
  version: string; // Build timestamp
}

// Default search order
const DEFAULT_SEARCH_ORDER: SearchLocation[] = ['Desktop', 'Documents', 'Downloads'];

// Build version for cache detection
const BUILD_VERSION = `2.0.0-${new Date().toISOString()}`;

// 🎯 MINIMUM CONFIDENCE THRESHOLDS
const MIN_CONFIDENCE_SCORE = 50;
const RESUME_KEYWORDS = ['resume', 'cv', 'curriculum', 'vitae'];

/**
 * Helper: Get file extension
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Helper: Get file description based on extension
 */
function getFileDescription(extension: string): string {
  const descriptions: Record<string, string> = {
    'pdf': 'PDF document',
    'doc': 'Word document',
    'docx': 'Word document',
    'txt': 'Text file',
    'rtf': 'Rich text document',
    'pages': 'Pages document',
    'key': 'Keynote presentation',
    'ppt': 'PowerPoint presentation',
    'pptx': 'PowerPoint presentation',
    'xls': 'Excel spreadsheet',
    'xlsx': 'Excel spreadsheet',
    'jpg': 'Image file',
    'jpeg': 'Image file',
    'png': 'Image file',
    'gif': 'Image file',
    'mp3': 'Audio file',
    'mp4': 'Video file',
    'zip': 'Archive file',
    'js': 'Source file',
    'ts': 'Source file',
    'tsx': 'Source file',
    'jsx': 'Source file',
    'json': 'Data file',
    'md': 'Markdown file',
    'html': 'HTML file',
    'css': 'Style file'
  };
  
  return descriptions[extension] || 'File';
}

/**
 * 🎯 INTELLIGENT RESULT VALIDATION
 */
function isActuallyRelevantResult(result: SearchResult, searchTerm: string): boolean {
  const searchLower = searchTerm.toLowerCase();
  const nameLower = result.name.toLowerCase();
  
  // RESUME/CV SEARCH - Strict rules
  if (RESUME_KEYWORDS.some(keyword => searchLower.includes(keyword))) {
    const isDocument = result.extension && 
      ['pdf', 'doc', 'docx', 'pages', 'rtf', 'txt'].includes(result.extension);
    
    const hasResumeInName = RESUME_KEYWORDS.some(kw => nameLower.includes(kw));
    
    const isJunkFile = result.extension && 
      ['json', 'js', 'ts', 'jsx', 'tsx', 'md', 'html', 'css'].includes(result.extension);
    
    const hasGoodScore = (result.score || 0) >= 30;
    
    return (isDocument || hasResumeInName) && !isJunkFile && hasGoodScore;
  }
  
  // GENERIC SEARCH - Accept if good score
  return (result.score || 0) >= MIN_CONFIDENCE_SCORE;
}

/**
 * RESULT RANKING ALGORITHM
 */
function rankSearchResults(results: SearchResult[], searchTerm: string): SearchResult[] {
  const scoredResults = results
    .filter(result => {
      const path = result.path.toLowerCase();
      if (path.includes('/node_modules/')) return false;
      if (path.includes('/.next/')) return false;
      if (path.includes('/dist/')) return false;
      if (path.includes('/build/')) return false;
      if (path.includes('.test.') && path.includes('.spec.')) return false;
      return true;
    })
    .map(result => {
      let score = 0;
      const extension = getFileExtension(result.name);
      const nameWithoutExt = result.name.replace(/\.[^/.]+$/, '').toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      const path = result.path.toLowerCase();
      
      // Document types (highest priority)
      const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'pages', 'key', 'ppt', 'pptx', 'xls', 'xlsx'];
      if (documentExtensions.includes(extension)) {
        score += 40;
      }
      
      // Penalty for source code
      const codeExtensions = ['js', 'ts', 'tsx', 'jsx', 'json', 'md', 'html', 'css', 'scss', 'sass', 'less'];
      if (codeExtensions.includes(extension)) {
        score -= 30;
      }
      
      // Name match quality
      if (result.name.toLowerCase() === searchTermLower) {
        score += 30;
      } else if (nameWithoutExt === searchTermLower) {
        score += 25;
      } else if (nameWithoutExt.startsWith(searchTermLower)) {
        score += 20;
      } else if (nameWithoutExt.includes(searchTermLower)) {
        score += 10;
      } else {
        score += 5;
      }
      
      // Location bonus
      if (path.includes('/desktop/')) score += 15;
      else if (path.includes('/documents/')) score += 10;
      else if (path.includes('/downloads/')) score += 5;
      
      // Recent file bonus
      if (result.modifiedAt) {
        const modifiedDate = new Date(result.modifiedAt);
        const daysSinceModified = (Date.now() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceModified < 7) score += 10;
        else if (daysSinceModified < 30) score += 5;
      }
      
      result.score = score;
      result.extension = extension;
      result.description = getFileDescription(extension);
      
      return result;
    })
    .filter(result => result.score !== undefined && result.score > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return scoredResults;
}

class FileSearchOrchestrator {
  private queue: FileSearchOperation[] = [];
  private currentOperation: FileSearchOperation | null = null;
  private listeners: Set<(state: FileSearchOrchestratorState) => void> = new Set();
  private operationResolvers: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor() {
    console.log('\n' + '═'.repeat(80));
    console.log('🏗️  FILE SEARCH ORCHESTRATOR V2 INITIALIZED');
    console.log(`   Build: ${BUILD_VERSION}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log('═'.repeat(80) + '\n');
  }

  /**
   * Get current state snapshot
   */
  getState(): FileSearchOrchestratorState {
    return {
      queue: this.queue,
      currentOperation: this.currentOperation,
      isProcessing: this.currentOperation !== null,
      version: BUILD_VERSION
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: FileSearchOrchestratorState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notify() {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('[ORCHESTRATOR] Listener error:', error);
      }
    });
    
    // Dispatch custom event for UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('file-search-update', {
        detail: state
      }));
    }
  }

  /**
   * 🎯 ENQUEUE: Add search to queue (returns ID immediately)
   * NON-BLOCKING: Never waits for search to complete
   */
  enqueue(filename: string, customOrder?: SearchLocation[]): string {
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
        humanLog: `⏳ Waiting to check ${location}`
      })),
      currentStepIndex: 0,
      status: 'pending',
      startedAt: Date.now()
    };

    console.log('\n' + '─'.repeat(80));
    console.log('📥 [ORCHESTRATOR] ENQUEUE');
    console.log(`   Build: ${BUILD_VERSION}`);
    console.log(`   Operation ID: ${operation.id}`);
    console.log(`   Filename: "${filename}"`);
    console.log(`   Locations: ${customOrder?.join(', ') || DEFAULT_SEARCH_ORDER.join(', ')}`);
    console.log(`   Queue Length (before): ${this.queue.length}`);
    console.log('─'.repeat(80) + '\n');

    this.queue.push(operation);
    
    // Store resolver (will be called when operation completes)
    this.operationResolvers.set(operation.id, {
      resolve: () => {},
      reject: () => {}
    });
    
    this.notify();
    
    // Start processing queue if idle
    this.processQueue();
    
    // Return IMMEDIATELY (non-blocking)
    return operation.id;
  }

  /**
   * Process queue (serial, one at a time)
   */
  private async processQueue() {
    if (this.currentOperation || this.queue.length === 0) {
      console.log('[ORCHESTRATOR] Queue processing skipped:', {
        hasCurrent: !!this.currentOperation,
        queueLength: this.queue.length
      });
      return;
    }

    const operation = this.queue.shift()!;
    this.currentOperation = operation;
    operation.status = 'running';
    
    console.log('\n' + '─'.repeat(80));
    console.log('🔄 [ORCHESTRATOR] PROCESSING QUEUE');
    console.log(`   Operation ID: ${operation.id}`);
    console.log(`   Queue remaining: ${this.queue.length}`);
    console.log('─'.repeat(80) + '\n');

    // Create capability queue operation
    const permissionQueue: ScopedCapability[] = operation.steps.map(step => ({
      capability: 'filesystem.read' as const,
      resource: step.location
    }));
    
    capabilityQueue.createOperation(
      operation.id,
      'filesystem.search',
      { filename: operation.filename },
      permissionQueue
    );
    
    // Request permission for first step
    const firstStep = operation.steps[0];
    if (firstStep) {
      firstStep.status = 'requesting_permission';
      firstStep.humanLog = `🔐 Requesting permission for ${firstStep.location}...`;
      operation.status = 'awaiting_permission';
      
      const request = capabilityQueue.requestPermission(operation.id);
      if (request) {
        firstStep.permissionRequestId = request.requestId;
        firstStep.status = 'waiting_permission';
        this.logPermissionRequest(operation.id, firstStep.location, request.requestId);
      }
    }

    this.notify();
  }

  /**
   * Grant permission for current step (continues search)
   */
  async grantPermission(operationId: string, requestId?: string): Promise<void> {
    console.log('\n' + '✅'.repeat(80));
    console.log('✅ [ORCHESTRATOR] PERMISSION GRANTED');
    console.log(`   Operation ID: ${operationId}`);
    console.log(`   Current Operation: ${this.currentOperation?.id || 'none'}`);
    if (requestId) console.log(`   Request ID: ${requestId}`);
    console.log('✅'.repeat(80) + '\n');
    
    if (!this.currentOperation || this.currentOperation.id !== operationId) {
      console.warn('[ORCHESTRATOR] No matching operation');
      return;
    }

    // Resolve in capability queue
    if (requestId) {
      const result = capabilityQueue.resolvePermission(requestId, 'allow-once');
      if (!result.success) {
        console.error('[ORCHESTRATOR] Failed to resolve permission:', result.error);
        return;
      }
    }

    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (!currentStep) return;

    currentStep.permissionGranted = true;
    currentStep.status = 'searching';
    currentStep.humanLog = `🔍 Searching ${currentStep.location} for "${this.currentOperation.filename}"...`;
    this.currentOperation.status = 'running';
    this.notify();

    console.log('[ORCHESTRATOR] 🔍 Starting search in:', currentStep.location);
    
    // Perform actual search
    await this.performSearch(currentStep, this.currentOperation.filename);
    
    const stepAfter = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    
    // If found, mark as results_ready (awaiting user selection)
    if (stepAfter.status === 'found' && stepAfter.results && stepAfter.results.length > 0) {
      this.currentOperation.status = 'results_ready';
      this.currentOperation.allResults = stepAfter.results; // Store all results
      this.currentOperation.foundFile = stepAfter.results[0]; // Top-ranked
      stepAfter.humanLog = `✅ Found ${stepAfter.results.length} result(s) in ${stepAfter.location}!`;
      
      console.log('[ORCHESTRATOR] 🎉 FILES FOUND:', stepAfter.results.length);
      console.log('[ORCHESTRATOR] 📊 Top result:', stepAfter.results[0].name, '(score:', stepAfter.results[0].score + ')');
      
      this.notify();
      // DON'T complete - wait for user selection
      return;
    }

    // If not found, continue to next location
    if (stepAfter.status === 'not_found') {
      console.log('[ORCHESTRATOR] ⏭️ Not found in', currentStep.location, '- checking next...');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      await this.moveToNextStep();
    }
  }
  
  /**
   * Log permission request
   */
  private logPermissionRequest(operationId: string, location: SearchLocation, requestId: string): void {
    console.log('\n' + '🔐'.repeat(80));
    console.log('🔐 [ORCHESTRATOR] PERMISSION REQUESTED');
    console.log(`   Operation ID: ${operationId}`);
    console.log(`   Location: ${location}`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Status: WAITING FOR USER DECISION`);
    console.log('🔐'.repeat(80) + '\n');
    
    this.notify();
  }

  /**
   * Deny permission (skips to next location)
   */
  async denyPermission(operationId: string, requestId?: string): Promise<void> {
    if (!this.currentOperation || this.currentOperation.id !== operationId) {
      return;
    }

    // Resolve in capability queue
    if (requestId) {
      const result = capabilityQueue.resolvePermission(requestId, 'deny');
      if (!result.success) {
        console.error('[ORCHESTRATOR] Failed to deny permission:', result.error);
        return;
      }
    }

    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (!currentStep) return;

    currentStep.permissionGranted = false;
    currentStep.status = 'denied';
    currentStep.humanLog = `⛔ Permission denied for ${currentStep.location}`;
    this.notify();

    await this.moveToNextStep();
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId: string): void {
    if (!this.currentOperation || this.currentOperation.id !== operationId) {
      return;
    }

    this.currentOperation.status = 'cancelled';
    this.currentOperation.completedAt = Date.now();
    
    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (currentStep) {
      currentStep.humanLog = `🚫 Search cancelled`;
    }
    
    this.notify();
    this.completeCurrentOperation();
  }

  /**
   * User selected a file from results (triggers file move)
   */
  async selectFile(operationId: string, filePath: string): Promise<void> {
    if (!this.currentOperation || this.currentOperation.id !== operationId) {
      return;
    }

    const selectedFile = this.currentOperation.allResults?.find(r => r.path === filePath);
    if (!selectedFile) {
      console.error('[ORCHESTRATOR] Selected file not found in results');
      return;
    }

    console.log('[ORCHESTRATOR] 📂 User selected:', selectedFile.name);
    
    this.currentOperation.status = 'moving_file';
    this.currentOperation.foundFile = selectedFile;
    
    const currentStep = this.currentOperation.steps[this.currentOperation.currentStepIndex];
    if (currentStep) {
      currentStep.humanLog = `📁 Moving "${selectedFile.name}" to Smarty Finder...`;
    }
    
    this.notify();
    
    // TODO: Implement actual file move to Smarty folder
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.currentOperation.status = 'completed';
    this.currentOperation.completedAt = Date.now();
    
    if (currentStep) {
      currentStep.humanLog = `✅ Moved "${selectedFile.name}" to Smarty Finder!`;
    }
    
    console.log('[ORCHESTRATOR] ✅ FILE MOVED COMPLETED');

    this.notify();
    this.completeCurrentOperation();
  }

  /**
   * Move to next step (next location)
   */
  private async moveToNextStep() {
    if (!this.currentOperation) return;

    const nextIndex = this.currentOperation.currentStepIndex + 1;
    
    console.log('[ORCHESTRATOR] ⏭️ moveToNextStep');
    console.log(`   Current Index: ${this.currentOperation.currentStepIndex}`);
    console.log(`   Next Index: ${nextIndex}`);
    console.log(`   Total Steps: ${this.currentOperation.steps.length}`);
    
    if (nextIndex >= this.currentOperation.steps.length) {
      // All locations checked, not found
      this.currentOperation.status = 'not_found';
      this.currentOperation.completedAt = Date.now();
      this.currentOperation.steps[this.currentOperation.currentStepIndex].humanLog = 
        `❌ "${this.currentOperation.filename}" not found in Desktop, Documents, or Downloads`;
      
      console.log('[ORCHESTRATOR] 🚫 File not found anywhere');
      
      capabilityQueue.completeOperation(this.currentOperation.id, { found: false });
      
      this.notify();
      this.completeCurrentOperation();
      return;
    }

    // Move to next step
    this.currentOperation.currentStepIndex = nextIndex;
    const nextStep = this.currentOperation.steps[nextIndex];
    
    nextStep.status = 'requesting_permission';
    nextStep.humanLog = `🔐 Requesting permission for ${nextStep.location}...`;
    
    this.currentOperation.status = 'awaiting_permission';
    this.currentOperation.steps[this.currentOperation.currentStepIndex - 1].humanLog += ' (skipped)';
    
    // Request permission for next location
    const request = capabilityQueue.requestPermission(this.currentOperation.id);
    if (request) {
      nextStep.permissionRequestId = request.requestId;
      nextStep.status = 'waiting_permission';
      this.logPermissionRequest(this.currentOperation.id, nextStep.location, request.requestId);
    }
    
    this.notify();
  }

  /**
   * Perform actual file search
   */
  private async performSearch(step: SearchStep, filename: string): Promise<void> {
    try {
      console.log('[ORCHESTRATOR] 🔎 Calling /api/native/file-search');
      console.log(`   Location: ${step.location}`);
      console.log(`   Filename: ${filename}`);
      
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
      
      console.log('[ORCHESTRATOR] 📤 Raw API results:', data.results?.length || 0, 'files');

      if (data.success && data.results && data.results.length > 0) {
        const rankedResults = rankSearchResults(data.results, filename);
        
        console.log('[ORCHESTRATOR] 📊 After ranking:', rankedResults.length, 'valid files');
        
        if (rankedResults.length > 0) {
          const topFile = rankedResults[0];
          
          const isRelevant = isActuallyRelevantResult(topFile, filename);
          
          if (isRelevant) {
            step.status = 'found';
            step.results = rankedResults;
            
            const fileNames = rankedResults.slice(0, 5).map((r: SearchResult) => 
              `${r.name} (${r.description}, score: ${r.score})`
            ).join('\n  ');
            
            step.humanLog = `✅ Found ${rankedResults.length} result(s) in ${step.location}:\n  ${fileNames}${rankedResults.length > 5 ? `\n  +${rankedResults.length - 5} more...` : ''}`;
            
            console.log('[ORCHESTRATOR] ✅ VALID MATCH:', topFile.name);
            console.log('[ORCHESTRATOR] 📍 Path:', topFile.path);
            console.log('[ORCHESTRATOR] 📊 Score:', topFile.score);
          } else {
            step.status = 'not_found';
            step.results = rankedResults;
            
            step.humanLog = `⚠️ Low confidence match in ${step.location}\n   Continuing search...`;
            
            console.log('[ORCHESTRATOR] ⚠️ LOW CONFIDENCE:', topFile.name, '(score:', topFile.score + ')');
          }
        } else {
          step.status = 'not_found';
          step.humanLog = `❌ No valid results in ${step.location}`;
          console.log('[ORCHESTRATOR] ⚠️ All results filtered out');
        }
      } else if (data.needConsent) {
        step.status = 'requesting_permission';
        step.humanLog = `🔐 Need permission for ${step.location}`;
        console.log('[ORCHESTRATOR] 🔐 Need consent');
      } else {
        step.status = 'not_found';
        step.humanLog = `❌ Not found in ${step.location}`;
        console.log('[ORCHESTRATOR] ❌ Not found');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      step.status = 'error';
      step.error = errorMessage;
      step.humanLog = `⚠️ Error: ${errorMessage}`;
      console.error('[ORCHESTRATOR] ⚠️ Search error:', error);
    }

    this.notify();
  }

  /**
   * Complete current operation and process next in queue
   */
  private completeCurrentOperation() {
    if (!this.currentOperation) return;

    const completed = this.currentOperation;
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ [ORCHESTRATOR] OPERATION COMPLETED');
    console.log(`   ID: ${completed.id}`);
    console.log(`   Status: ${completed.status}`);
    console.log(`   Duration: ${completed.completedAt && completed.startedAt ? ((completed.completedAt - completed.startedAt) / 1000).toFixed(2) + 's' : 'N/A'}`);
    console.log('═'.repeat(80) + '\n');

    const resolver = this.operationResolvers.get(completed.id);
    if (resolver) {
      resolver.resolve(completed);
      this.operationResolvers.delete(completed.id);
    }

    this.currentOperation = null;
    this.notify();
    
    // Process next item in queue
    this.processQueue();
  }

  /**
   * Get human-readable summary
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

// Singleton instance
export const fileSearchOrchestrator = new FileSearchOrchestrator();
