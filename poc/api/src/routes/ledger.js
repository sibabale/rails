const express = require('express');
const { getPendingTransactions, settleTransactions } = require('../ledger/ledger');

const router = express.Router();

// Get pending transactions
router.get('/pending', async (req, res) => {
  try {
    const pending = await getPendingTransactions();
    res.json({ 
      pending,
      count: pending.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to retrieve pending transactions:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve pending transactions'
    });
  }
});

// Settle transactions
router.post('/settle', async (req, res) => {
  try {
    const { authorized_by, force } = req.body;
    const result = await settleTransactions(authorized_by, force);
    
    res.json({
      message: 'Settlement completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Settlement failed:', error.message);
    res.status(500).json({
      error: 'Settlement processing failed'
    });
  }
});

module.exports = router; 