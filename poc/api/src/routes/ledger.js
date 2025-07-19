const express = require('express');
const { getPendingTransactions, settleTransactions } = require('../ledger/ledger');
const { 
  requireAuth, 
  requireAdminAuth, 
  validateSettlement,
  apiRateLimit,
  adminRateLimit,
  addSecurityHeaders 
} = require('../middleware/validation');

const router = express.Router();

// Apply security headers and general rate limiting
router.use(addSecurityHeaders);
router.use(apiRateLimit);

// All ledger operations require authentication
router.use(requireAuth);

router.get('/ledger/pending', (req, res) => {
  try {
    const pending = getPendingTransactions();
    
    // Log the access
    req.logger.audit('Pending transactions accessed', {
      user_id: req.user.userId || req.user.sub,
      pending_count: pending.length,
      event_type: 'data_access'
    });
    
    res.json({ 
      pending,
      count: pending.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    req.logger.error('Failed to retrieve pending transactions', {
      error_message: error.message,
      user_id: req.user.userId || req.user.sub,
      event_type: 'operation_failed'
    });
    
    res.status(500).json({
      error: 'Failed to retrieve pending transactions',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

// Settlement requires admin authentication and stricter rate limiting
router.post('/ledger/settle', adminRateLimit, requireAdminAuth, validateSettlement, async (req, res) => {
  try {
    const { authorized_by, force } = req.validatedBody;
    
    // Additional verification: ensure authorized_by matches authenticated user
    const authenticatedUserId = req.user.userId || req.user.sub;
    if (authorized_by !== authenticatedUserId) {
      req.logger.security('Settlement authorization mismatch', {
        authenticated_user: authenticatedUserId,
        claimed_authorizer: authorized_by,
        ip_address: req.ip,
        event_type: 'authorization_mismatch'
      });
      
      return res.status(400).json({
        error: 'Authorization mismatch',
        message: 'Authorized_by must match authenticated user',
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await settleTransactions(authorized_by, force);
    
    req.logger.audit('Settlement completed', {
      user_id: authenticatedUserId,
      transactions_settled: result.settled.length,
      force_settlement: force,
      settlement_timestamp: result.settlement_timestamp,
      event_type: 'settlement'
    });
    
    res.json({
      message: 'Settlement completed successfully',
      ...result,
      correlation_id: req.correlationId
    });
  } catch (error) {
    req.logger.error('Settlement failed', {
      error_message: error.message,
      user_id: req.user.userId || req.user.sub,
      event_type: 'settlement_failed'
    });
    
    res.status(500).json({
      error: 'Settlement processing failed',
      message: error.message,
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 