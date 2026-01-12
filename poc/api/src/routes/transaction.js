const express = require('express');
const { getLedger } = require('../ledger/ledger');

const router = express.Router();

// Get a single transaction by reference
router.get('/transaction/:txn_ref', async (req, res) => {
  try {
    const { txn_ref } = req.params;
    const ledger = await getLedger();
    const txn = ledger.find(t => t.txnRef === txn_ref);
    if (txn) {
      res.json({ txn });
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Failed to get transaction:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
});

// Transaction processing log with filters, search, pagination, and summary
router.get('/transactions', async (req, res) => {
  try {
    const { search = '', status, bank, type, page = 1, pageSize = 5, userId } = req.query;
    
    // Build filters for database query
    const filters = {};
    if (userId) {
      filters.userId = userId;
    }
    if (status) {
      filters.status = status;
    }
    
    const ledger = await getLedger(filters);
    let filtered = ledger;
    
    // Apply additional filters that can't be done at database level
    if (search) {
      filtered = filtered.filter(t => t.txnRef.includes(search));
    }
    if (bank) {
      filtered = filtered.filter(t => t.senderBank === bank);
    }
    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }
    
    // Sort by timestamp descending
    filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const total = filtered.length;
    const pageNum = parseInt(page, 10);
    const size = parseInt(pageSize, 10);
    const start = (pageNum - 1) * size;
    const end = start + size;
    const paged = filtered.slice(start, end);
    
    // Summary
    const totalVolume = filtered.reduce((sum, t) => sum + t.amount, 0);
    const processingFees = filtered.reduce((sum, t) => sum + (t.amount * 0.01), 0);
    const completed = filtered.filter(t => t.status === 'completed').length;
    const successRate = total ? (completed / total) * 100 : 0;
    
    res.json({
      transactions: paged.map(t => ({
        txn_ref: t.txnRef,
        bank: t.senderBank,
        amount: t.amount,
        type: t.type || 'transfer',
        status: t.status,
        fee: +(t.amount * 0.01).toFixed(2),
        timestamp: t.timestamp,
        description: t.description
      })),
      summary: {
        totalTransactions: total,
        totalVolume,
        processingFees: +processingFees.toFixed(2),
        successRate: +successRate.toFixed(2)
      },
      pagination: {
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

module.exports = router; 