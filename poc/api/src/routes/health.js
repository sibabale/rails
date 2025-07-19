const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { getQueueStats } = require('../queue/queue');
const { getReserve, getBanks } = require('../ledger/ledger');
const { getConfigSummary } = require('../config');
const { posthogClient } = require('../posthog/posthog');

const router = express.Router();

// Basic health check - no authentication required for monitoring systems
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  const healthChecks = {
    service: 'rails-api',
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    node_env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    status: 'healthy',
    checks: {}
  };

  try {
    // File system health check
    healthChecks.checks.filesystem = await checkFileSystem();
    
    // Ledger system health check
    healthChecks.checks.ledger = await checkLedgerSystem();
    
    // Queue system health check
    healthChecks.checks.queue = checkQueueSystem();
    
    // PostHog connectivity check
    healthChecks.checks.analytics = checkAnalyticsSystem();
    
    // Configuration health check
    healthChecks.checks.configuration = checkConfiguration();
    
    // Overall system resources
    healthChecks.checks.resources = checkSystemResources();
    
    // Determine overall health status
    const failedChecks = Object.values(healthChecks.checks).filter(check => check.status !== 'healthy');
    if (failedChecks.length > 0) {
      healthChecks.status = 'degraded';
      if (failedChecks.some(check => check.critical)) {
        healthChecks.status = 'unhealthy';
      }
    }
    
    healthChecks.response_time_ms = Date.now() - startTime;
    
    // Return appropriate HTTP status
    const httpStatus = healthChecks.status === 'healthy' ? 200 : 
                      healthChecks.status === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(healthChecks);
    
  } catch (error) {
    const errorResponse = {
      service: 'rails-api',
      timestamp,
      status: 'unhealthy',
      error: error.message,
      response_time_ms: Date.now() - startTime
    };
    
    res.status(503).json(errorResponse);
  }
});

// Detailed health check with authentication required
router.get('/health/detailed', async (req, res) => {
  // This endpoint could require authentication for sensitive details
  // For now, keeping it open for POC but adding correlation ID
  const correlationId = req.correlationId || req.headers['x-correlation-id'];
  
  try {
    const detailedHealth = {
      service: 'rails-api',
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      system_info: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime_seconds: process.uptime()
      },
      configuration: getConfigSummary(),
      ledger_stats: await getLedgerStats(),
      queue_stats: getQueueStats(),
      file_system: await getFileSystemStats(),
      memory_usage: process.memoryUsage(),
      environment_variables: getEnvironmentStatus()
    };
    
    res.json(detailedHealth);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate detailed health report',
      message: error.message,
      correlation_id: correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

// Individual health check functions
async function checkFileSystem() {
  try {
    const ledgerDir = path.join(__dirname, '../ledger');
    const logsDir = path.join(__dirname, '../../logs');
    
    // Check if critical directories exist and are writable
    await fs.access(ledgerDir, fs.constants.R_OK | fs.constants.W_OK);
    
    // Check logs directory (create if doesn't exist)
    try {
      await fs.access(logsDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      await fs.mkdir(logsDir, { recursive: true });
    }
    
    return {
      status: 'healthy',
      message: 'File system accessible and writable',
      critical: true
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `File system error: ${error.message}`,
      critical: true
    };
  }
}

async function checkLedgerSystem() {
  try {
    const reserve = getReserve();
    const banks = getBanks();
    
    if (typeof reserve.total !== 'number' || typeof reserve.available !== 'number') {
      throw new Error('Invalid reserve data structure');
    }
    
    if (!Array.isArray(banks) || banks.length === 0) {
      throw new Error('Invalid or empty banks configuration');
    }
    
    return {
      status: 'healthy',
      message: 'Ledger system operational',
      reserve_available: reserve.available,
      banks_connected: banks.filter(b => b.connected).length,
      critical: true
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Ledger system error: ${error.message}`,
      critical: true
    };
  }
}

function checkQueueSystem() {
  try {
    const queueStats = getQueueStats();
    
    const status = queueStats.queue_size > 1000 ? 'degraded' : 'healthy';
    const message = status === 'degraded' ? 
      'Queue size is high, potential backlog' : 
      'Queue processing normally';
    
    return {
      status,
      message,
      queue_size: queueStats.queue_size,
      is_processing: queueStats.is_processing,
      critical: false
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Queue system error: ${error.message}`,
      critical: true
    };
  }
}

function checkAnalyticsSystem() {
  try {
    // Basic check that PostHog client is available
    if (!posthogClient) {
      throw new Error('PostHog client not initialized');
    }
    
    return {
      status: 'healthy',
      message: 'Analytics system connected',
      critical: false
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: `Analytics system error: ${error.message}`,
      critical: false
    };
  }
}

function checkConfiguration() {
  try {
    const config = getConfigSummary();
    
    const issues = [];
    if (config.environment === 'production' && !config.posthogEnabled) {
      issues.push('PostHog not configured for production');
    }
    
    const status = issues.length > 0 ? 'degraded' : 'healthy';
    const message = issues.length > 0 ? 
      `Configuration issues: ${issues.join(', ')}` : 
      'Configuration validated';
    
    return {
      status,
      message,
      environment: config.environment,
      critical: false
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Configuration error: ${error.message}`,
      critical: true
    };
  }
}

function checkSystemResources() {
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // Alert if heap usage is over 80%
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    const status = heapUsagePercent > 80 ? 'degraded' : 'healthy';
    
    return {
      status,
      message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${Math.round(heapUsagePercent)}%)`,
      heap_used_mb: heapUsedMB,
      heap_total_mb: heapTotalMB,
      uptime_seconds: process.uptime(),
      critical: false
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Resource check error: ${error.message}`,
      critical: false
    };
  }
}

async function getLedgerStats() {
  try {
    const reserve = getReserve();
    const banks = getBanks();
    
    return {
      reserve_total: reserve.total,
      reserve_available: reserve.available,
      reserve_utilization_percent: Math.round(((reserve.total - reserve.available) / reserve.total) * 100),
      banks_total: banks.length,
      banks_connected: banks.filter(b => b.connected).length
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getFileSystemStats() {
  try {
    const ledgerDir = path.join(__dirname, '../ledger');
    const files = await fs.readdir(ledgerDir);
    
    const fileStats = {};
    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const filePath = path.join(ledgerDir, file);
        const stats = await fs.stat(filePath);
        fileStats[file] = {
          size_bytes: stats.size,
          modified: stats.mtime.toISOString()
        };
      } catch (error) {
        fileStats[file] = { error: error.message };
      }
    }
    
    return fileStats;
  } catch (error) {
    return { error: error.message };
  }
}

function getEnvironmentStatus() {
  const requiredVars = ['SIM_WEBHOOK_ENDPOINT'];
  const optionalVars = ['POSTHOG_API_KEY', 'ADMIN_TOKEN', 'JWT_SECRET'];
  
  const status = {};
  
  for (const varName of requiredVars) {
    status[varName] = process.env[varName] ? 'set' : 'missing';
  }
  
  for (const varName of optionalVars) {
    status[varName] = process.env[varName] ? 'set' : 'not_set';
  }
  
  return status;
}

module.exports = router; 