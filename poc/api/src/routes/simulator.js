const express = require('express');
const { runSimulation } = require('../simulator/simulator');

const router = express.Router();

router.post('/simulator/start', (req, res) => {
  const { count = 10, interval = 1000 } = req.body || {};
  runSimulation(count, interval);
  res.json({ message: `Simulation started with ${count} transactions, interval ${interval}ms` });
});

module.exports = router; 