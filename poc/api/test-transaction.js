// Test transaction processing without clustering

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
// Use simple logger for testing
const simpleLogger = require('./src/utils/logger-simple');

const { validateTransaction, addCorrelationId, addSecurityHeaders, webhookRateLimit } = require('./src/middleware/validation');

const app = express();

app.use(bodyParser.json());
app.use(addCorrelationId);
app.use(addSecurityHeaders);

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId 
  });
});

// Test transaction endpoint
app.post('/api/webhook', webhookRateLimit, validateTransaction, (req, res) => {
  const txn = req.validatedBody;
  console.log('Received transaction:', txn.txn_ref, 'Amount:', txn.amount);
  
  res.json({
    message: 'Transaction received and validated',
    txn_ref: txn.txn_ref,
    status: 'queued',
    correlation_id: req.correlationId,
    timestamp: new Date().toISOString()
  });
});

const PORT = 8003;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('Test with:');
  console.log(`curl http://localhost:${PORT}/test`);
  console.log(`curl -X POST http://localhost:${PORT}/api/webhook -H "Content-Type: application/json" -d '{"txn_ref":"TEST001","amount":100,"userId":"user123","type":"debit","description":"Test transaction","source_account":"ACC001","metadata":{"ip_address":"127.0.0.1","session_id":"sess123"}}'`);
});