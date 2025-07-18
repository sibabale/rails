const express = require('express');
const { getPendingTransactions, settleTransactions } = require('../ledger/ledger');

const router = express.Router();

router.get('/ledger/pending', (req, res) => {
  const pending = getPendingTransactions();
  res.json({ pending });
});

router.post('/ledger/settle', (req, res) => {
  const settled = settleTransactions();
  res.json({ message: 'Settlement complete', settled });
});

module.exports = router; 