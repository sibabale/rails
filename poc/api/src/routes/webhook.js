const express = require('express');
const { addToQueue } = require('../queue/queue');
const { 
  validateTransaction, 
  addSecurityHeaders, 
  webhookRateLimit,
  validateTransactionAmount 
} = require('../middleware/validation');

const router = express.Router();

// Apply security headers and rate limiting to all routes
router.use(addSecurityHeaders);
router.use(webhookRateLimit);

router.post('/webhook', validateTransaction, validateTransactionAmount, (req, res) => {
  try {
    // Use validatedBody if available, otherwise fallback to body
    const txn = req.validatedBody || req.body;
    
    // Ensure txn is an object before setting properties
    if (!txn || typeof txn !== 'object') {
      throw new Error('Invalid transaction data');
    }
    
    // Create a copy to avoid mutating the original object
    const processedTxn = { ...txn };
    
    // Add audit fields
    processedTxn.received_at = new Date().toISOString();
    processedTxn.status = 'pending';
    processedTxn.validation_passed = true;
    
    addToQueue(processedTxn);
    
    res.status(200).json({ 
      message: 'Transaction received and validated',
      txn_ref: processedTxn.txn_ref,
      status: 'queued',
      timestamp: processedTxn.received_at
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process transaction',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 