const cluster = require('cluster');
const os = require('os');

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

if (cluster.isMaster) {
  const numCPUs = Math.min(os.cpus().length, 4); // Limit to 4 workers for POC
  console.log(`Master process ${process.pid} is running. Forking ${numCPUs} workers...`);
  
  let primaryWorkerAssigned = false;
  
  for (let i = 0; i < numCPUs; i++) {
    const env = { 
      WORKER_ID: i.toString(),
      ...process.env // Inherit parent environment
    };
    
    // Assign first worker as primary for queue processing
    if (!primaryWorkerAssigned) {
      env.PRIMARY_WORKER = 'true';
      primaryWorkerAssigned = true;
      console.log(`Worker ${i} designated as primary queue processor`);
    }
    
    cluster.fork(env);
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Forking replacement...`);
    
    // Capture telemetry about worker death
    try {
      posthogClient.capture({
        distinctId: 'system',
        event: 'worker_died',
        properties: {
          worker_pid: worker.process.pid,
          exit_code: code,
          signal: signal,
          worker_id: worker.process.env?.WORKER_ID
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed:', posthogError.message);
    }
    
    // Fork replacement with same environment
    const env = { 
      WORKER_ID: worker.process.env.WORKER_ID,
      ...process.env // Inherit parent environment
    };
    
    // If primary worker died, reassign primary status
    if (worker.process.env?.PRIMARY_WORKER === 'true') {
      console.log('Primary worker died, reassigning primary status to replacement');
      env.PRIMARY_WORKER = 'true';
    }
    
    cluster.fork(env);
  });
  
  // Handle graceful cluster shutdown
  process.on('SIGINT', () => {
    console.log('Master received SIGINT, shutting down cluster...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('Forcing cluster shutdown...');
      process.exit(0);
    }, 10000); // Force exit after 10 seconds
  });
} else {
  // Worker process initialization
  const workerId = process.env.WORKER_ID || process.pid;
  console.log(`Worker ${workerId} starting...`);
  
  const express = require("express");
  const bodyParser = require("body-parser");
  const { addCorrelationId, addSecurityHeaders, addRequestTiming } = require("./src/middleware/validation");
  
  // Import routes without initializing heavy components yet
  const routes = require("./src/routes");
  
  // Use worker-specific logger to avoid file conflicts
  const logger = require("./src/utils/logger").child({ workerId });

  // Initialize worker-specific components with error handling
  let postTransaction, transactionQueue;
  
  // Staggered initialization to prevent file lock conflicts
  const initDelay = (parseInt(workerId) % 4) * 500; // 0-1.5s stagger
  
  setTimeout(async () => {
    try {
      console.log(`Worker ${workerId} initializing ledger system...`);
      
      // Import ledger system
      const ledgerModule = require("./src/ledger/ledger");
      postTransaction = ledgerModule.postTransaction;
      
      console.log(`Worker ${workerId} initializing queue system...`);
      
      // Import queue system  
      const queueModule = require("./src/queue/queue");
      transactionQueue = queueModule.transactionQueue;
      
      // Only start ONE queue processor per cluster (master decides)
      if (process.env.PRIMARY_WORKER === 'true') {
        logger.info('Starting transaction queue processing (primary worker)', {
          worker_pid: workerId,
          event_type: 'system_startup'
        });
        
        transactionQueue.startProcessing(postTransaction);
        console.log(`✅ Primary worker ${workerId} queue processing started`);
      } else {
        console.log(`✅ Worker ${workerId} ready (queue processing handled by primary)`);
      }
      
    } catch (error) {
      logger.error('Worker initialization failed', {
        worker_pid: workerId,
        error_message: error.message,
        error_stack: error.stack,
        event_type: 'worker_init_failed'
      });
      
      // Don't exit immediately, let other workers continue
      console.error(`Worker ${workerId} initialization failed:`, error.message);
    }
  }, initDelay);

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

  // Graceful shutdown with proper cleanup
  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}, starting graceful shutdown`, {
      worker_pid: process.pid,
      event_type: 'system_shutdown'
    });
    
    try {
      // Stop queue processing if initialized
      if (transactionQueue) {
        transactionQueue.stopProcessing();
      }
      
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
    logger.info(`Rails API worker started`, {
      worker_pid: process.pid,
      port: PORT,
      node_env: process.env.NODE_ENV || 'development',
      event_type: 'system_startup'
    });
    console.log(`🚀 Worker ${process.pid} running on http://localhost:${PORT}`);
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
}