// Minimal test to isolate the issue

require('dotenv').config();

console.log('1. Environment loaded');

const { validateConfig } = require('./src/config');
validateConfig();
console.log('2. Config validated');

const express = require('express');
const app = express();
console.log('3. Express app created');

app.get('/test', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
console.log('4. Routes added');

const PORT = 8002;
const server = app.listen(PORT, () => {
  console.log(`5. Server listening on port ${PORT}`);
  console.log(`Test with: curl http://localhost:${PORT}/test`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});