// queue.js - Thread-safe queue implementation
const { posthogClient } = require('../posthog/posthog');

class SafeTransactionQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.processingInterval = null;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Thread-safe add operation
  addToQueue(txn) {
    try {
      // Validate transaction before adding
      if (!txn || !txn.txn_ref) {
        throw new Error('Invalid transaction: missing txn_ref');
      }

      // Check for duplicates
      const duplicate = this.queue.find(item => item.txn_ref === txn.txn_ref);
      if (duplicate) {
        console.warn(`⚠️ Duplicate transaction ignored: ${txn.txn_ref}`);
        return false;
      }

      // Add metadata for queue processing
      const queueItem = {
        ...txn,
        queued_at: new Date().toISOString(),
        attempts: 0,
        last_error: null
      };

      this.queue.push(queueItem);
      console.log(`📥 Queued: ${txn.txn_ref} | Amount: R${txn.amount} | Queue size: ${this.queue.length}`);
      
      // Safe telemetry capture
      try {
        posthogClient.capture({
          distinctId: txn.userId || 'unknown',
          event: 'queue_item_added',
          properties: {
            txn_ref: txn.txn_ref,
            amount: txn.amount,
            queue_size: this.queue.length
          }
        });
      } catch (posthogError) {
        console.warn('PostHog capture failed for queue add:', posthogError.message);
      }

      return true;
    } catch (error) {
      console.error('Failed to add transaction to queue:', error);
      
      // Safe telemetry capture for errors
      try {
        posthogClient.capture({
          distinctId: txn?.userId || 'unknown',
          event: 'queue_add_failed',
          properties: {
            txn_ref: txn?.txn_ref,
            error: error.message
          }
        });
      } catch (posthogError) {
        console.warn('PostHog capture failed for queue error:', posthogError.message);
      }

      return false;
    }
  }

  // Process queue with concurrency safety
  async processQueue(callback) {
    if (this.processing) {
      return; // Prevent concurrent processing
    }

    this.processing = true;
    
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift(); // Atomic operation
        
        if (!item) continue; // Skip if somehow undefined
        
        try {
          await this.processItem(item, callback);
        } catch (error) {
          await this.handleProcessingError(item, error);
        }
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  // Process individual item with retry logic
  async processItem(item, callback) {
    try {
      item.attempts++;
      item.processing_started = new Date().toISOString();
      
      // Execute the callback (usually postTransaction)
      await callback(item);
      
      // Success telemetry
      try {
        posthogClient.capture({
          distinctId: item.userId || 'unknown',
          event: 'queue_item_processed',
          properties: {
            txn_ref: item.txn_ref,
            amount: item.amount,
            attempts: item.attempts,
            processing_time: Date.now() - new Date(item.queued_at).getTime()
          }
        });
      } catch (posthogError) {
        console.warn('PostHog capture failed for queue processing:', posthogError.message);
      }

      console.log(`✅ Processed: ${item.txn_ref} (${item.attempts} attempts)`);
    } catch (error) {
      item.last_error = error.message;
      throw error; // Re-throw for error handling
    }
  }

  // Handle processing errors with retry logic
  async handleProcessingError(item, error) {
    console.error(`❌ Processing failed for ${item.txn_ref}:`, error.message);
    
    if (item.attempts < this.maxRetries) {
      // Add back to queue for retry
      console.log(`🔄 Retrying ${item.txn_ref} (attempt ${item.attempts + 1}/${this.maxRetries})`);
      
      // Add delay for retry
      setTimeout(() => {
        this.queue.push(item);
      }, this.retryDelay);
    } else {
      // Max retries exceeded - move to dead letter queue
      console.error(`💀 Max retries exceeded for ${item.txn_ref}, moving to dead letter queue`);
      
      // Safe telemetry for failed items
      try {
        posthogClient.capture({
          distinctId: item.userId || 'unknown',
          event: 'queue_item_dead_letter',
          properties: {
            txn_ref: item.txn_ref,
            attempts: item.attempts,
            last_error: item.last_error,
            total_processing_time: Date.now() - new Date(item.queued_at).getTime()
          }
        });
      } catch (posthogError) {
        console.warn('PostHog capture failed for dead letter:', posthogError.message);
      }

      // In a production system, you'd save this to a dead letter file/queue
      // For POC, we'll just log it
      console.log(`Dead letter item: ${JSON.stringify(item, null, 2)}`);
    }
  }

  // Start automatic processing
  startProcessing(callback, intervalMs = 1000) {
    if (this.processingInterval) {
      console.warn('Queue processing already started');
      return;
    }

    console.log(`🚀 Starting queue processing with ${intervalMs}ms interval`);
    
    this.processingInterval = setInterval(async () => {
      await this.processQueue(callback);
    }, intervalMs);

    return this.processingInterval;
  }

  // Stop processing
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('🛑 Queue processing stopped');
    }
  }

  // Get queue stats
  getStats() {
    return {
      queue_size: this.queue.length,
      is_processing: this.processing,
      max_retries: this.maxRetries,
      retry_delay: this.retryDelay
    };
  }

  // Clear queue (for testing/admin)
  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue.length = 0;
    console.log(`🗑️ Cleared ${clearedCount} items from queue`);
    return clearedCount;
  }
}

// Create singleton instance
const transactionQueue = new SafeTransactionQueue();

// Export functions for backward compatibility
function addToQueue(txn) {
  return transactionQueue.addToQueue(txn);
}

function processQueue(callback) {
  return transactionQueue.processQueue(callback);
}

function clearQueue() {
  return transactionQueue.clearQueue();
}

function getQueueStats() {
  return transactionQueue.getStats();
}

module.exports = {
  addToQueue,
  processQueue,
  clearQueue,
  getQueueStats,
  transactionQueue, // Export instance for advanced usage
  SafeTransactionQueue // Export class for testing
};
