// Single process version for testing/debugging

// Load environment variables first
require('dotenv').config();

// Load and validate configuration first
const { validateConfig, getConfigSummary, isProduction } = require('./src/config');

try {
  const config = validateConfig();
  console.log('✅ Configuration validation passed');
  
  if (!isProduction()) {
    console.log('📋 Configuration summary:', JSON.stringify(getConfigSummary(), null, 2));
  }
} catch (error) {
  console.error('🚨 Configuration validation failed:', error.message);
  process.exit(1);
}

const { posthogClient } = require('./src/posthog/posthog.js');
const express = require("express");
const bodyParser = require("body-parser");
const { postTransaction } = require("./src/ledger/ledger");
const { addToQueue, transactionQueue } = require("./src/queue/queue");
const routes = require("./src/routes");
const { addCorrelationId, addSecurityHeaders, addRequestTiming } = require("./src/middleware/validation");
const logger = require("./src/utils/logger");

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Apply security and logging middleware first
app.use(addCorrelationId);
app.use(addSecurityHeaders);
app.use(addRequestTiming);
app.use(bodyParser.json());

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  const correlationId = req.correlationId;
  const requestLogger = req.logger || logger.withCorrelationId(correlationId);
  
  requestLogger.error('Request processing error', {
    error_message: err.message,
    error_stack: err.stack,
    method: req.method,
    url: req.url,
    event_type: 'error'
  });

  // Safe PostHog capture
  try {
    posthogClient.capture({
      distinctId: req.body?.userId || 'unknown',
      event: 'api_error',
      properties: {
        correlation_id: correlationId,
        endpoint: req.originalUrl,
        method: req.method,
        error_message: err.message
      }
    });
  } catch (posthogError) {
    requestLogger.warn('PostHog capture failed for error', { error: posthogError.message });
  }

  res.status(500).json({
    error: 'Internal server error',
    correlation_id: correlationId,
    timestamp: new Date().toISOString()
  });
});

routes.forEach(router => app.use("/api", router));

// Start background processing with enhanced logging
logger.info('Starting transaction queue processing', {
  worker_pid: process.pid,
  event_type: 'system_startup'
});

transactionQueue.startProcessing(postTransaction);

// Graceful shutdown with proper cleanup
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown`, {
    worker_pid: process.pid,
    event_type: 'system_shutdown'
  });
  
  try {
    // Stop queue processing
    transactionQueue.stopProcessing();
    
    // Flush remaining PostHog events
    await posthogClient.shutdown();
    
    logger.info('Graceful shutdown completed', {
      worker_pid: process.pid,
      event_type: 'system_shutdown_complete'
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error_message: error.message,
      worker_pid: process.pid,
      event_type: 'system_shutdown_error'
    });
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const { getConfig } = require('./src/config');
const PORT = getConfig('PORT');
const server = app.listen(PORT, () => {
  logger.info(`Rails API started (single process)`, {
    worker_pid: process.pid,
    port: PORT,
    node_env: process.env.NODE_ENV || 'development',
    event_type: 'system_startup'
  });
  console.log(`🚀 Rails API running on http://localhost:${PORT} (PID: ${process.pid})`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error', {
    error_message: error.message,
    error_code: error.code,
    worker_pid: process.pid,
    event_type: 'server_error'
  });
});