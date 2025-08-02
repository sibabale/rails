const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for financial services logging with latest entries at top
const financialFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, correlationId, userId, txn_ref, amount, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: 'rails-api',
      environment: process.env.NODE_ENV || 'development',
      node_id: process.env.NODE_ID || 'node-001',
      pid: process.pid
    };

    // Add financial-specific fields if present
    if (correlationId) logEntry.correlation_id = correlationId;
    if (userId) logEntry.user_id = userId;
    if (txn_ref) logEntry.transaction_ref = txn_ref;
    if (amount) logEntry.amount = amount;

    // Add any additional metadata
    if (Object.keys(meta).length > 0) {
      logEntry.metadata = meta;
    }

    return JSON.stringify(logEntry, null, 2);
  })
);

// Special format for exceptions and rejections
const exceptionFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.printf((info) => {
    const { timestamp, level, message, error, exception, os, process, service, stack, trace, version, ...meta } = info;
    
    const exceptionEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: service || 'rails-api',
      environment: process.env.NODE_ENV || 'development',
      node_id: process.env.NODE_ID || 'node-001',
      pid: process?.pid || 'unknown',
      exception: exception || false,
      error_details: {
        name: error?.name,
        message: error?.message,
        stack: stack,
        trace: trace
      },
      system_info: {
        os: os,
        process: {
          argv: process?.argv,
          cwd: process?.cwd,
          execPath: process?.execPath,
          version: process?.version,
          memoryUsage: process?.memoryUsage
        },
        version: version
      },
      metadata: meta
    };

    return JSON.stringify(exceptionEntry, null, 2);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, correlationId, userId, txn_ref }) => {
    let logLine = `${timestamp} ${level}: ${message}`;
    
    if (correlationId) logLine += ` [correlation: ${correlationId}]`;
    if (userId) logLine += ` [user: ${userId}]`;
    if (txn_ref) logLine += ` [txn: ${txn_ref}]`;
    
    return logLine;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'rails-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error log file - only errors (latest at top)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.json'),
      level: 'error',
      format: financialFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      options: { flags: 'a' } // Append mode
    }),

    // Combined log file - all levels (latest at top)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.json'),
      format: financialFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true,
      options: { flags: 'a' } // Append mode
    }),

    // Audit log for financial transactions (latest at top)
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.json'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
          const { timestamp, level, message, userId, txn_ref, amount, event_type, ...meta } = info;
          const auditEntry = {
            timestamp,
            audit_type: event_type || 'transaction',
            user_id: userId,
            transaction_ref: txn_ref,
            amount,
            message,
            metadata: meta
          };
          return JSON.stringify(auditEntry, null, 2);
        })
      ),
      maxsize: 20971520, // 20MB
      maxFiles: 50, // Keep more audit logs
      tailable: true,
      options: { flags: 'a' } // Append mode
    })
  ],

  // Handle uncaught exceptions and rejections with proper JSON formatting
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.json'),
      format: exceptionFormat,
      options: { flags: 'a' } // Append mode
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.json'),
      format: exceptionFormat,
      options: { flags: 'a' } // Append mode
    })
  ]
});

// Add console transport for non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Helper methods for structured logging
logger.transaction = function(message, { userId, txn_ref, amount, correlationId, ...meta }) {
  this.info(message, {
    userId,
    txn_ref,
    amount,
    correlationId,
    event_type: 'transaction',
    ...meta
  });
};

logger.audit = function(message, { userId, txn_ref, amount, event_type, correlationId, ...meta }) {
  this.info(message, {
    userId,
    txn_ref,
    amount,
    correlationId,
    event_type,
    ...meta
  });
};

logger.security = function(message, { userId, ip_address, correlationId, ...meta }) {
  this.warn(message, {
    userId,
    ip_address,
    correlationId,
    event_type: 'security',
    ...meta
  });
};

logger.performance = function(message, { duration, correlationId, ...meta }) {
  this.info(message, {
    correlationId,
    duration,
    event_type: 'performance',
    ...meta
  });
};

// Create child logger with correlation ID
logger.withCorrelationId = function(correlationId) {
  return this.child({ correlationId });
};

// Create child logger with user context
logger.withUser = function(userId, correlationId) {
  return this.child({ userId, correlationId });
};

// Create child logger with transaction context
logger.withTransaction = function(txn_ref, userId, correlationId) {
  return this.child({ txn_ref, userId, correlationId });
};

module.exports = logger;