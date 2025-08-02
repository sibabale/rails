// Simple Rails API Server
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { postTransaction } = require("./src/ledger/ledger.js");
const { addToQueue, transactionQueue } = require("./src/queue/queue");
const routes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Routes
app.use("/api", routes);

// Start queue
transactionQueue.startProcessing(postTransaction);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Rails API running on port ${PORT}`);
});

// Simple shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  transactionQueue.stopProcessing();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});