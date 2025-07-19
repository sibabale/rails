const express = require('express');
const { getStorageStats } = require('../utils/fileStorage');
const { requireAuth, requireAdminAuth, apiRateLimit, addSecurityHeaders } = require('../middleware/validation');

const router = express.Router();

// Apply security headers and rate limiting
router.use(addSecurityHeaders);
router.use(apiRateLimit);

// All storage operations require authentication
router.use(requireAuth);

// Get storage statistics (admin only)
router.get('/storage/stats', requireAdminAuth, async (req, res) => {
  try {
    const stats = await getStorageStats();
    
    req.logger.audit('Storage stats accessed', {
      user_id: req.user.userId || req.user.sub,
      total_size_mb: stats.total_size_mb,
      files_count: Object.keys(stats.files).length,
      event_type: 'storage_access'
    });
    
    res.json({
      status: 'success',
      data: stats,
      timestamp: new Date().toISOString(),
      correlation_id: req.correlationId
    });
    
  } catch (error) {
    req.logger.error('Failed to retrieve storage stats', {
      error_message: error.message,
      user_id: req.user.userId || req.user.sub,
      event_type: 'storage_error'
    });
    
    res.status(500).json({
      error: 'Failed to retrieve storage statistics',
      message: error.message,
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;