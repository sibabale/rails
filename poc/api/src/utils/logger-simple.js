const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger configuration that works
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'rails-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Add console transport for non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper methods
logger.transaction = function(message, data = {}) {
  this.info(message, { ...data, event_type: 'transaction' });
};

logger.audit = function(message, data = {}) {
  this.info(message, { ...data, event_type: 'audit' });
};

logger.security = function(message, data = {}) {
  this.warn(message, { ...data, event_type: 'security' });
};

logger.performance = function(message, data = {}) {
  this.info(message, { ...data, event_type: 'performance' });
};

logger.withCorrelationId = function(correlationId) {
  return this.child({ correlationId });
};

logger.withUser = function(userId, correlationId) {
  return this.child({ userId, correlationId });
};

logger.withTransaction = function(txn_ref, userId, correlationId) {
  return this.child({ txn_ref, userId, correlationId });
};

module.exports = logger;