// Debug server startup
console.log('=== Starting Debug ===');

try {
  console.log('1. Loading dotenv...');
  require('dotenv').config();
  
  console.log('2. Testing config...');
  const config = require('./src/config');
  console.log('Config OK');
  
  console.log('3. Testing routes...');
  const routes = require('./src/routes');
  console.log('Routes OK');
  
  console.log('4. Testing queue...');
  const { transactionQueue } = require('./src/queue/queue');
  console.log('Queue OK');
  
  console.log('5. Testing ledger...');
  const { postTransaction } = require('./src/ledger/ledger.js');
  console.log('Ledger OK');
  
  console.log('=== All imports successful ===');
  
} catch (error) {
  console.error('Error during import:', error.message);
  console.error('Stack:', error.stack);
}