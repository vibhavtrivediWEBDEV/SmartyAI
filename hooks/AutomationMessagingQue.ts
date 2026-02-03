/**
 * Message Queue System for Cursor Automation
 * Handles command queuing, prioritization, and batch execution
 */

export interface QueuedMessage {
  id: string;
  command: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  params?: any;
  onComplete?: (success: boolean) => void;
}

export class AutomationMessageQueue {
  private queue: QueuedMessage[] = [];
  private isProcessing: boolean = false;
  private currentMessage: QueuedMessage | null = null;
  private history: QueuedMessage[] = [];
  private automationAPI: any;

  constructor(automationAPI: any) {
    this.automationAPI = automationAPI;
  }

  /**
   * Add command to queue
   */
  enqueue(
    command: string,
    priority: QueuedMessage['priority'] = 'medium',
    params?: any,
    onComplete?: (success: boolean) => void
  ): string {
    const message: QueuedMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      command,
      priority,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
      status: 'pending',
      params,
      onComplete
    };

    this.queue.push(message);
    this.sortQueue();
    
    console.log(`[Queue] Added: ${command} (Priority: ${priority})`);
    
    // Auto-process if not already processing
    if (!this.isProcessing) {
      this.processNext();
    }

    return message.id;
  }

  /**
   * Add multiple commands as a batch
   */
  enqueueBatch(
    commands: Array<{ command: string; priority?: QueuedMessage['priority']; params?: any }>,
    onBatchComplete?: (results: boolean[]) => void
  ): string[] {
    const ids: string[] = [];
    const results: boolean[] = [];
    let completed = 0;

    commands.forEach((cmd, index) => {
      const id = this.enqueue(
        cmd.command,
        cmd.priority || 'medium',
        cmd.params,
        (success) => {
          results[index] = success;
          completed++;
          
          if (completed === commands.length && onBatchComplete) {
            onBatchComplete(results);
          }
        }
      );
      ids.push(id);
    });

    return ids;
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    
    this.queue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by timestamp (FIFO)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Process next message in queue
   */
  async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const message = this.queue.shift();

    if (!message) {
      this.isProcessing = false;
      return;
    }

    this.currentMessage = message;
    message.status = 'executing';

    console.log(`[Queue] Processing: ${message.command}`);

    try {
      const success = await this.executeMessage(message);
      
      if (success) {
        message.status = 'completed';
        console.log(`[Queue] ✓ Completed: ${message.command}`);
        
        if (message.onComplete) {
          message.onComplete(true);
        }
      } else {
        throw new Error('Command execution failed');
      }
    } catch (error) {
      console.error(`[Queue] ✗ Failed: ${message.command}`, error);
      
      // Retry logic
      if (message.retries < message.maxRetries) {
        message.retries++;
        message.status = 'pending';
        console.log(`[Queue] Retrying (${message.retries}/${message.maxRetries}): ${message.command}`);
        
        // Re-add to queue
        this.queue.push(message);
        this.sortQueue();
      } else {
        message.status = 'failed';
        console.log(`[Queue] ✗ Max retries reached: ${message.command}`);
        
        if (message.onComplete) {
          message.onComplete(false);
        }
      }
    } finally {
      // Add to history
      this.history.push({ ...message });
      
      // Keep history limited
      if (this.history.length > 100) {
        this.history.shift();
      }

      this.currentMessage = null;
      this.isProcessing = false;

      // Process next in queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 100);
      }
    }
  }

  /**
   * Execute a single message
   */
  private async executeMessage(message: QueuedMessage): Promise<boolean> {
    // Parse and execute the command
    const result = await this.automationAPI.executeTextCommand(message.command);
    
    // Add delay if specified in params
    if (message.params?.delay) {
      await new Promise(resolve => setTimeout(resolve, message.params.delay));
    }

    return result;
  }

  /**
   * Cancel a message by ID
   */
  cancel(messageId: string): boolean {
    const index = this.queue.findIndex(m => m.id === messageId);
    
    if (index !== -1) {
      const message = this.queue.splice(index, 1)[0];
      message.status = 'failed';
      this.history.push(message);
      console.log(`[Queue] Cancelled: ${message.command}`);
      return true;
    }

    return false;
  }

  /**
   * Clear all pending messages
   */
  clearQueue(): void {
    this.queue.forEach(m => {
      m.status = 'failed';
      this.history.push(m);
    });
    
    this.queue = [];
    console.log('[Queue] Cleared all pending messages');
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.isProcessing = true;
    console.log('[Queue] Paused');
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    if (this.isProcessing && !this.currentMessage) {
      this.isProcessing = false;
      console.log('[Queue] Resumed');
      this.processNext();
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      currentMessage: this.currentMessage,
      pendingCount: this.queue.filter(m => m.status === 'pending').length,
      completedCount: this.history.filter(m => m.status === 'completed').length,
      failedCount: this.history.filter(m => m.status === 'failed').length
    };
  }

  /**
   * Get queue contents
   */
  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  /**
   * Get history
   */
  getHistory(limit: number = 20): QueuedMessage[] {
    return this.history.slice(-limit);
  }

  /**
   * Schedule command for future execution
   */
  schedule(
    command: string,
    delayMs: number,
    priority: QueuedMessage['priority'] = 'medium'
  ): string {
    const scheduleId = setTimeout(() => {
      this.enqueue(command, priority);
    }, delayMs);

    console.log(`[Queue] Scheduled: ${command} (in ${delayMs}ms)`);
    
    return `schedule-${scheduleId}`;
  }

  /**
   * Create a repeating command
   */
  repeat(
    command: string,
    intervalMs: number,
    maxRepeats: number = Infinity,
    priority: QueuedMessage['priority'] = 'medium'
  ): () => void {
    let count = 0;
    
    const intervalId = setInterval(() => {
      if (count >= maxRepeats) {
        clearInterval(intervalId);
        console.log(`[Queue] Repeat completed: ${command}`);
        return;
      }

      this.enqueue(command, priority);
      count++;
    }, intervalMs);

    console.log(`[Queue] Repeating: ${command} (every ${intervalMs}ms, max ${maxRepeats})`);

    // Return cancel function
    return () => {
      clearInterval(intervalId);
      console.log(`[Queue] Repeat cancelled: ${command}`);
    };
  }
}

/**
 * Usage Examples:
 * 
 * 1. Basic Queue:
 *    ```javascript
 *    const queue = new AutomationMessageQueue(automationAPI);
 *    queue.enqueue('open Terminal', 'high');
 *    queue.enqueue('open Settings', 'medium');
 *    ```
 * 
 * 2. Batch Commands:
 *    ```javascript
 *    queue.enqueueBatch([
 *      { command: 'open Terminal', priority: 'high' },
 *      { command: 'open Settings', priority: 'medium' },
 *      { command: 'close window-123', priority: 'low' }
 *    ], (results) => {
 *      console.log('Batch completed:', results);
 *    });
 *    ```
 * 
 * 3. Scheduled Commands:
 *    ```javascript
 *    queue.schedule('open Terminal', 5000, 'high'); // Opens in 5 seconds
 *    ```
 * 
 * 4. Repeating Commands:
 *    ```javascript
 *    const cancel = queue.repeat('focus window-123', 2000, 10);
 *    // Cancel after some time
 *    setTimeout(cancel, 15000);
 *    ```
 * 
 * 5. With Callbacks:
 *    ```javascript
 *    queue.enqueue('open Terminal', 'high', null, (success) => {
 *      if (success) {
 *        console.log('Terminal opened successfully');
 *      }
 *    });
 *    ```
 */