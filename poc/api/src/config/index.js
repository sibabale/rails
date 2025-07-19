const Joi = require('joi');

// Define the configuration schema for financial services
const configSchema = Joi.object({
  // Server configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(8000),
    
  NODE_ID: Joi.string()
    .alphanum()
    .min(1)
    .max(20)
    .default('node-001'),

  // External service configuration
  SIM_WEBHOOK_ENDPOINT: Joi.string()
    .uri()
    .required()
    .description('Webhook endpoint for transaction simulation'),

  // Analytics and monitoring
  POSTHOG_API_KEY: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .description('PostHog API key for analytics'),

  // Logging configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),

  // Security configuration
  ADMIN_TOKEN: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional().default('dev-admin-token-change-in-production')
    })
    .description('Admin token for privileged operations'),

  JWT_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional().default('dev-jwt-secret-change-in-production')
    })
    .description('JWT secret for token signing'),

  // Financial service limits
  MAX_TRANSACTION_AMOUNT: Joi.number()
    .positive()
    .default(1000000)
    .description('Maximum allowed transaction amount'),

  DAILY_TRANSACTION_LIMIT: Joi.number()
    .positive()
    .default(10000000)
    .description('Daily transaction processing limit'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000) // 15 minutes
    .description('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Maximum requests per window'),

  // Queue configuration
  QUEUE_PROCESSING_INTERVAL: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1000)
    .description('Queue processing interval in milliseconds'),

  QUEUE_MAX_RETRIES: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(3)
    .description('Maximum retry attempts for failed transactions'),

  QUEUE_RETRY_DELAY: Joi.number()
    .integer()
    .min(1000)
    .max(60000)
    .default(5000)
    .description('Delay between retry attempts in milliseconds'),

  // File storage configuration
  LEDGER_FILE_MAX_SIZE: Joi.number()
    .integer()
    .min(1048576) // 1MB minimum
    .default(104857600) // 100MB default
    .description('Maximum ledger file size before rotation'),

  BACKUP_RETENTION_DAYS: Joi.number()
    .integer()
    .min(7)
    .default(90)
    .description('Number of days to retain backup files'),

  // Development/Testing
  ENABLE_REQUEST_LOGGING: Joi.boolean()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional().default(false),
      otherwise: Joi.optional().default(true)
    }),

  ENABLE_DETAILED_ERRORS: Joi.boolean()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.optional().default(true),
      otherwise: Joi.optional().default(false)
    })
});

/**
 * Validate and return the application configuration
 * @returns {Object} Validated configuration object
 * @throws {Error} If configuration validation fails
 */
function validateConfig() {
  const { error, value } = configSchema.validate(process.env, {
    allowUnknown: true, // Allow other env vars not in schema
    stripUnknown: false, // Don't remove unknown vars
    abortEarly: false // Return all validation errors
  });

  if (error) {
    const errorMessages = error.details.map(detail => {
      const field = detail.path.join('.');
      return `${field}: ${detail.message}`;
    });

    throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`);
  }

  return value;
}

/**
 * Get a specific configuration value with type safety
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value
 */
function getConfig(key, defaultValue = undefined) {
  const config = validateConfig();
  return config[key] !== undefined ? config[key] : defaultValue;
}

/**
 * Check if the application is running in production mode
 * @returns {boolean} True if in production
 */
function isProduction() {
  return getConfig('NODE_ENV') === 'production';
}

/**
 * Check if the application is running in development mode
 * @returns {boolean} True if in development
 */
function isDevelopment() {
  return getConfig('NODE_ENV') === 'development';
}

/**
 * Check if the application is running in test mode
 * @returns {boolean} True if in test mode
 */
function isTest() {
  return getConfig('NODE_ENV') === 'test';
}

/**
 * Get security-related configuration
 * @returns {Object} Security configuration
 */
function getSecurityConfig() {
  const config = validateConfig();
  return {
    adminToken: config.ADMIN_TOKEN,
    jwtSecret: config.JWT_SECRET,
    maxTransactionAmount: config.MAX_TRANSACTION_AMOUNT,
    dailyTransactionLimit: config.DAILY_TRANSACTION_LIMIT,
    rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: config.RATE_LIMIT_MAX_REQUESTS
  };
}

/**
 * Get queue-related configuration
 * @returns {Object} Queue configuration
 */
function getQueueConfig() {
  const config = validateConfig();
  return {
    processingInterval: config.QUEUE_PROCESSING_INTERVAL,
    maxRetries: config.QUEUE_MAX_RETRIES,
    retryDelay: config.QUEUE_RETRY_DELAY
  };
}

/**
 * Print configuration summary (safe for logging)
 * @returns {Object} Configuration summary without secrets
 */
function getConfigSummary() {
  const config = validateConfig();
  
  return {
    environment: config.NODE_ENV,
    port: config.PORT,
    nodeId: config.NODE_ID,
    logLevel: config.LOG_LEVEL,
    maxTransactionAmount: config.MAX_TRANSACTION_AMOUNT,
    dailyTransactionLimit: config.DAILY_TRANSACTION_LIMIT,
    queueProcessingInterval: config.QUEUE_PROCESSING_INTERVAL,
    queueMaxRetries: config.QUEUE_MAX_RETRIES,
    rateLimitEnabled: !!config.RATE_LIMIT_WINDOW_MS,
    posthogEnabled: !!config.POSTHOG_API_KEY,
    requestLoggingEnabled: config.ENABLE_REQUEST_LOGGING,
    detailedErrorsEnabled: config.ENABLE_DETAILED_ERRORS
  };
}

module.exports = {
  validateConfig,
  getConfig,
  isProduction,
  isDevelopment,
  isTest,
  getSecurityConfig,
  getQueueConfig,
  getConfigSummary,
  configSchema
};