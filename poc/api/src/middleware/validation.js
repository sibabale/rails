const { 
  transactionSchema, 
  settlementSchema, 
  transactionQuerySchema, 
  simulatorSchema,
  userAuthSchema 
} = require('../validation/schemas');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { getSecurityConfig, getConfig } = require('../config');

// Generic validation middleware factory
function createValidator(schema, target = 'body') {
  return (req, res, next) => {
    const data = target === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true // Remove unknown fields for security
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request contains invalid or missing required fields',
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
    }
    
    // Store validated data
    if (target === 'query') {
      req.validatedQuery = value;
    } else {
      req.validatedBody = value;
    }
    
    next();
  };
}

// Specific validators for each endpoint
const validateTransaction = createValidator(transactionSchema);
const validateSettlement = createValidator(settlementSchema);
const validateTransactionQuery = createValidator(transactionQuerySchema, 'query');
const validateSimulator = createValidator(simulatorSchema);
const validateUserAuth = createValidator(userAuthSchema);

// Rate limiting configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retry_after: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    // Use proper IPv6-compatible key generator
    keyGenerator: (req) => {
      // Use the built-in IP key generator that handles IPv6 properly
      const ipKey = ipKeyGenerator(req);
      return ipKey + ':' + (req.headers['user-agent'] || 'unknown');
    },
    handler: (req, res) => {
      const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);
      
      requestLogger.security('Rate limit exceeded', {
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        endpoint: req.originalUrl,
        method: req.method,
        event_type: 'rate_limit_exceeded'
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retry_after: Math.ceil(windowMs / 1000),
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Different rate limits for different endpoints
const webhookRateLimit = createRateLimit(
  getConfig('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  getConfig('RATE_LIMIT_MAX_REQUESTS', 100),
  'Too many webhook requests from this IP. Please try again later.',
  false
);

const apiRateLimit = createRateLimit(
  getConfig('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  getConfig('RATE_LIMIT_MAX_REQUESTS', 100) * 2, // Double limit for general API
  'Too many API requests from this IP. Please try again later.',
  true // Skip counting successful requests
);

const adminRateLimit = createRateLimit(
  300000, // 5 minutes
  10, // Much stricter for admin operations
  'Too many admin requests from this IP. Admin operations are strictly rate limited.',
  false
);

// JWT Authentication middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);
    
    requestLogger.security('Authentication attempt without valid Bearer token', {
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      event_type: 'authentication_missing'
    });

    return res.status(401).json({
      error: 'Authentication required',
      message: 'Valid Bearer token must be provided',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
  
  const token = authHeader.split(' ')[1];
  const securityConfig = getSecurityConfig();
  
  try {
    const decoded = jwt.verify(token, securityConfig.jwtSecret);
    
    // Add user context to request
    req.user = decoded;
    req.authToken = token;
    
    // Add user context to logger
    if (req.logger) {
      req.logger = logger.withUser(decoded.userId || decoded.sub, req.correlationId);
    }

    // Log successful authentication
    req.logger.security('User authenticated successfully', {
      user_id: decoded.userId || decoded.sub,
      ip_address: req.ip,
      event_type: 'authentication_success'
    });
    
    next();
  } catch (error) {
    const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);
    
    requestLogger.security('JWT verification failed', {
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      error_message: error.message,
      event_type: 'authentication_failed'
    });

    return res.status(401).json({
      error: 'Invalid token',
      message: 'Bearer token is invalid or expired',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
}

// Admin authentication middleware
function requireAdminAuth(req, res, next) {
  const adminToken = req.headers['x-admin-token'];
  const securityConfig = getSecurityConfig();
  
  if (!adminToken || adminToken !== securityConfig.adminToken) {
    const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);
    
    requestLogger.security('Admin authentication failed', {
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      user_id: req.user?.userId || 'anonymous',
      event_type: 'admin_auth_failed'
    });

    return res.status(403).json({
      error: 'Admin authorization required',
      message: 'This operation requires admin privileges',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
  
  req.isAdmin = true;
  
  // Log admin access
  const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);
  requestLogger.audit('Admin operation authorized', {
    user_id: req.user?.userId || 'system',
    ip_address: req.ip,
    endpoint: req.originalUrl,
    method: req.method,
    event_type: 'admin_access'
  });
  
  next();
}

// Transaction amount validation middleware
function validateTransactionAmount(req, res, next) {
  const amount = req.validatedBody?.amount || req.body?.amount;
  const securityConfig = getSecurityConfig();
  
  if (amount && amount > securityConfig.maxTransactionAmount) {
    const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);
    
    requestLogger.security('Transaction amount exceeds limit', {
      user_id: req.user?.userId || 'anonymous',
      ip_address: req.ip,
      attempted_amount: amount,
      max_allowed: securityConfig.maxTransactionAmount,
      event_type: 'amount_limit_exceeded'
    });

    return res.status(400).json({
      error: 'Transaction amount exceeds limit',
      message: `Maximum allowed amount is ${securityConfig.maxTransactionAmount}`,
      max_amount: securityConfig.maxTransactionAmount,
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

// Correlation ID middleware
function addCorrelationId(req, res, next) {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  
  // Create contextual logger for this request
  req.logger = logger.withCorrelationId(req.correlationId);
  
  // Log incoming request
  req.logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.headers['user-agent'],
    event_type: 'http_request'
  });
  
  next();
}

// Security headers middleware
function addSecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By'); // Remove Express signature
  next();
}

// Request timing middleware
function addRequestTiming(req, res, next) {
  req.startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - req.startTime;
    
    // Log request completion
    if (req.logger) {
      req.logger.performance('Request completed', {
        method: req.method,
        url: req.url,
        status_code: res.statusCode,
        duration,
        event_type: 'http_response'
      });
    }
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
}

module.exports = {
  validateTransaction,
  validateSettlement,
  validateTransactionQuery,
  validateSimulator,
  validateUserAuth,
  requireAuth,
  requireAdminAuth,
  validateTransactionAmount,
  addCorrelationId,
  addSecurityHeaders,
  addRequestTiming,
  webhookRateLimit,
  apiRateLimit,
  adminRateLimit,
  createValidator,
  createRateLimit
};