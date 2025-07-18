const express = require('express');
const { addToQueue } = require('../queue/queue');

const router = express.Router();

router.post('/webhook', (req, res) => {
  const txn = req.body;
  addToQueue(txn);
  res.status(200).json({ message: 'Transaction received', txn_ref: txn.txn_ref });
});

module.exports = router; 