const express = require('express');
const { getLedger } = require('../ledger/ledger');

const router = express.Router();

// Get a single transaction by reference (legacy)
router.get('/transaction/:txn_ref', (req, res) => {
  const { txn_ref } = req.params;
  const ledger = getLedger();
  const txn = ledger.find(t => t.txn_ref === txn_ref);
  if (txn) {
    res.json({ txn });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// Transaction processing log with filters, search, pagination, and summary
router.get('/transactions', (req, res) => {
  const { search = '', status, bank, type, page = 1, pageSize = 5 } = req.query;
  const ledger = getLedger();
  let filtered = ledger;
  if (search) {
    filtered = filtered.filter(t => t.txn_ref.includes(search));
  }
  if (status) {
    filtered = filtered.filter(t => t.status === status);
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
      txn_ref: t.txn_ref,
      bank: t.senderBank,
      amount: t.amount,
      type: t.type || 'transfer',
      status: t.status,
      fee: +(t.amount * 0.01).toFixed(2),
      timestamp: t.timestamp
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
});

module.exports = router; 