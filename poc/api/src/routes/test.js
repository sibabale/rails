const express = require('express');
const router = express.Router();

// Simple test endpoint - no middleware at all
router.get('/test-simple', (req, res) => {
  res.json({ 
    message: 'Simple test working - no auth required', 
    timestamp: new Date().toISOString() 
  });
});

router.post('/test-post', (req, res) => {
  res.json({ 
    message: 'POST test working - no auth required', 
    body: req.body,
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;