// lib/capabilityQueue.ts
/**
 * Dynamic Capability Permission Queue
 * 
 * Architecture:
 * - Operations wait for scoped permissions (filesystem.read + resource)
 * - Generic queue per operation (Documents, Desktop, Downloads are data)
 * - Exact operation context preserved for resumption
 * - State: waiting_permission ≠ failed
 */

export type OperationStatus = 
  | 'pending'
  | 'waiting_permission' 
  | 'running'
  | 'completed'
  | 'denied'
  | 'failed'
  | 'cancelled';

export type PermissionDecision = 'allow-once' | 'allow-always' | 'deny';

export interface ScopedCapability {
  capability: 'filesystem.read' | 'filesystem.write' | 'filesystem.search';
  resource: 'Documents' | 'Desktop' | 'Downloads' | 'Home' | string;
}

export interface PermissionRequest {
  requestId: string;
  operationId: string;
  capability: ScopedCapability;
  action: string;
  allowedDecisions: PermissionDecision[];
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  decision?: PermissionDecision;
}

export interface PendingOperation {
  operationId: string;
  intent: string;
  parameters: Record<string, any>;
  currentStep: {
    capability: ScopedCapability;
    stepIndex: number;
    stepId: string;
  };
  permissionQueue: ScopedCapability[];
  status: OperationStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  result?: any;
  error?: string;
}

class CapabilityQueueManager {
  private operations: Map<string, PendingOperation> = new Map();
  private permissionRequests: Map<string, PermissionRequest> = new Map();
  private listeners: Set<(type: string, data: any) => void> = new Set();
  
  // Permission request timeout (5 minutes)
  private readonly REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
  
  // Audit log
  private auditLog: Array<{
    timestamp: number;
    action: string;
    operationId?: string;
    requestId?: string;
    details: any;
  }> = [];

  /**
   * Create a new capability-gated operation
   */
  createOperation(
    operationId: string,
    intent: string,
    parameters: Record<string, any>,
    permissionQueue: ScopedCapability[]
  ): PendingOperation {
    const operation: PendingOperation = {
      operationId,
      intent,
      parameters,
      currentStep: {
        capability: permissionQueue[0],
        stepIndex: 0,
        stepId: `${permissionQueue[0].resource.toLowerCase()}-${Date.now()}-0`
      },
      permissionQueue: [...permissionQueue],
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.operations.set(operationId, operation);
    
    this.log('OPERATION_CREATED', operationId, { intent, permissionQueue });
    this.emit('operation:created', operation);
    
    return operation;
  }

  /**
   * Request permission for the next step in an operation
   */
  requestPermission(operationId: string): PermissionRequest | null {
    const operation = this.operations.get(operationId);
    if (!operation) {
      this.log('ERROR', undefined, { error: 'Operation not found', operationId });
      return null;
    }

    const currentCapability = operation.permissionQueue[operation.currentStep.stepIndex];
    if (!currentCapability) {
      this.log('ERROR', operationId, { error: 'No capability at current step' });
      return null;
    }

    // Create permission request
    const requestId = `perm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const request: PermissionRequest = {
      requestId,
      operationId,
      capability: currentCapability,
      action: operation.intent,
      allowedDecisions: ['allow-once', 'allow-always', 'deny'],
      createdAt: Date.now(),
      expiresAt: Date.now() + this.REQUEST_TIMEOUT_MS,
      status: 'pending'
    };

    this.permissionRequests.set(requestId, request);
    
    // Update operation status
    operation.status = 'waiting_permission';
    operation.currentStep.capability = currentCapability;
    operation.updatedAt = Date.now();
    
    this.log('PERMISSION_REQUESTED', operationId, { 
      requestId,
      capability: currentCapability,
      stepIndex: operation.currentStep.stepIndex
    });
    
    this.emit('permission:requested', request);
    
    return request;
  }

  /**
   * Resolve a permission request
   */
  resolvePermission(requestId: string, decision: PermissionDecision): {
    success: boolean;
    operation?: PendingOperation;
    error?: string;
  } {
    const request = this.permissionRequests.get(requestId);
    
    // Fail closed: validate request
    if (!request) {
      this.log('RESOLVE_FAILED', undefined, { 
        requestId, 
        error: 'Request not found' 
      });
      return { success: false, error: 'invalid_request' };
    }

    if (request.status !== 'pending') {
      this.log('RESOLVE_FAILED', request.operationId, { 
        requestId, 
        error: `Request already ${request.status}` 
      });
      return { success: false, error: 'request_already_resolved' };
    }

    if (Date.now() > request.expiresAt) {
      request.status = 'expired';
      this.log('RESOLVE_FAILED', request.operationId, { 
        requestId, 
        error: 'Request expired' 
      });
      return { success: false, error: 'request_expired' };
    }

    if (!request.allowedDecisions.includes(decision)) {
      this.log('RESOLVE_FAILED', request.operationId, { 
        requestId, 
        error: `Decision "${decision}" not allowed` 
      });
      return { success: false, error: 'invalid_decision' };
    }

    // Update request
    request.status = decision === 'deny' ? 'denied' : 'approved';
    request.decision = decision;

    // Find and update operation
    const operation = this.operations.get(request.operationId);
    if (!operation) {
      this.log('RESOLVE_FAILED', undefined, { 
        requestId, 
        error: 'Operation not found' 
      });
      return { success: false, error: 'operation_not_found' };
    }

    this.log('PERMISSION_RESOLVED', operation.operationId, {
      requestId,
      decision,
      capability: request.capability
    });

    if (decision === 'deny') {
      // Permission denied - skip to next step or fail
      const hasNextStep = this.moveToNextStep(operation);
      
      if (!hasNextStep) {
        operation.status = 'denied';
        operation.completedAt = Date.now();
        operation.updatedAt = Date.now();
        this.log('OPERATION_DENIED', operation.operationId, {});
        this.emit('operation:denied', operation);
      }
    } else {
      // Permission granted - operation can resume
      operation.status = 'running';
      operation.updatedAt = Date.now();
      
      this.log('PERMISSION_GRANTED', operation.operationId, {
        capability: request.capability,
        decision
      });
      
      this.emit('permission:granted', { operation, request, decision });
    }

    return { success: true, operation };
  }

  /**
   * Move operation to next step
   */
  private moveToNextStep(operation: PendingOperation): boolean {
    const nextIndex = operation.currentStep.stepIndex + 1;
    
    if (nextIndex >= operation.permissionQueue.length) {
      return false; // No more steps
    }

    operation.currentStep = {
      capability: operation.permissionQueue[nextIndex],
      stepIndex: nextIndex,
      stepId: `${operation.permissionQueue[nextIndex].resource.toLowerCase()}-${Date.now()}-${nextIndex}`
    };
    operation.status = 'pending';
    operation.updatedAt = Date.now();
    
    this.log('STEP_ADVANCED', operation.operationId, {
      stepIndex: nextIndex,
      capability: operation.permissionQueue[nextIndex]
    });
    
    this.emit('operation:step_changed', operation);
    
    return true;
  }

  /**
   * Mark operation as running (after permission granted, before execution)
   */
  startExecution(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation || operation.status === 'waiting_permission') {
      return false;
    }

    operation.status = 'running';
    operation.updatedAt = Date.now();
    
    this.log('EXECUTION_STARTED', operationId, {});
    this.emit('operation:started', operation);
    
    return true;
  }

  /**
   * Mark operation as completed
   */
  completeOperation(operationId: string, result?: any): boolean {
    const operation = this.operations.get(operationId);
    if (!operation) return false;

    operation.status = 'completed';
    operation.completedAt = Date.now();
    operation.updatedAt = Date.now();
    operation.result = result;

    this.log('OPERATION_COMPLETED', operationId, { 
      resultProvided: !!result 
    });
    this.emit('operation:completed', operation);
    
    return true;
  }

  /**
   * Fail operation
   */
  failOperation(operationId: string, error: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation) return false;

    operation.status = 'failed';
    operation.completedAt = Date.now();
    operation.updatedAt = Date.now();
    operation.error = error;

    this.log('OPERATION_FAILED', operationId, { error });
    this.emit('operation:failed', { operation, error });
    
    return true;
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId: string, reason?: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation) return false;

    operation.status = 'cancelled';
    operation.completedAt = Date.now();
    operation.updatedAt = Date.now();
    operation.error = reason;

    this.log('OPERATION_CANCELLED', operationId, { reason });
    this.emit('operation:cancelled', { operation, reason });
    
    return true;
  }

  /**
   * Get operation
   */
  getOperation(operationId: string): PendingOperation | undefined {
    return this.operations.get(operationId);
  }

  /**
   * Get permission request
   */
  getPermissionRequest(requestId: string): PermissionRequest | undefined {
    return this.permissionRequests.get(requestId);
  }

  /**
   * Get pending permission requests
   */
  getPendingRequests(): PermissionRequest[] {
    const now = Date.now();
    return Array.from(this.permissionRequests.values())
      .filter(r => r.status === 'pending' && r.expiresAt > now);
  }

  /**
   * Get all operations
   */
  getOperations(status?: OperationStatus): PendingOperation[] {
    const operations = Array.from(this.operations.values());
    if (status) {
      return operations.filter(o => o.status === status);
    }
    return operations;
  }

  /**
   * Subscribe to events
   */
  subscribe(listener: (type: string, data: any) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event
   */
  private emit(type: string, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(type, data);
      } catch (error) {
        console.error('[CapabilityQueue] Listener error:', error);
      }
    });

    // Also dispatch custom event for UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`capability-queue:${type}`, { 
        detail: { type, data, timestamp: Date.now() }
      }));
    }
  }

  /**
   * Log action (human-readable)
   */
  private log(action: string, operationId?: string, details?: any): void {
    const entry = {
      timestamp: Date.now(),
      action,
      operationId,
      details
    };
    
    this.auditLog.push(entry);
    
    // Console log with formatting
    const time = new Date(entry.timestamp).toISOString().split('T')[1].slice(0, 8);
    const opStr = operationId ? `[${operationId}]` : '';
    
    console.log(`\n📋 [CapabilityQueue] ${time} ${action} ${opStr}`);
    if (details && Object.keys(details).length > 0) {
      console.log('   ', JSON.stringify(details, null, 2).split('\n').join('\n    '));
    }
    console.log('');
  }

  /**
   * Get audit log
   */
  getAuditLog(): typeof this.auditLog {
    return [...this.auditLog].reverse();
  }

  /**
   * Clean up old operations and requests
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    // Clean old operations
    for (const [id, op] of this.operations.entries()) {
      if (op.completedAt && op.completedAt < cutoff) {
        this.operations.delete(id);
      }
    }
    
    // Clean old permission requests
    for (const [id, req] of this.permissionRequests.entries()) {
      if (req.status !== 'pending' && req.expiresAt < cutoff) {
        this.permissionRequests.delete(id);
      }
    }
    
    this.log('CLEANUP', undefined, { 
      operationsRemoved: this.operations.size,
      requestsRemoved: this.permissionRequests.size
    });
  }
}

// Singleton instance
export const capabilityQueue = new CapabilityQueueManager();

export default capabilityQueue;
