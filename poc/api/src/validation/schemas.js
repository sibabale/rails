const Joi = require('joi');

const transactionSchema = Joi.object({
  txn_ref: Joi.string().required().min(1).max(50).pattern(/^[A-Z0-9_-]+$/), // Alphanumeric with underscores/hyphens only
  amount: Joi.number().positive().precision(2).max(999999.99).required(), // Max amount with 2 decimal places
  userId: Joi.string().required().min(1).max(100), // Required for audit trail
  type: Joi.string().valid('debit', 'credit').required(),
  currency: Joi.string().length(3).uppercase().default('ZAR'), // ISO currency code
  timestamp: Joi.date().iso().optional(), // Optional client timestamp for audit context
  description: Joi.string().required().min(1).max(255), // Required transaction description
  sender: Joi.string().required().min(1).max(100), // Sender identifier
  receiver: Joi.string().required().min(1).max(100), // Receiver identifier
  senderBank: Joi.string().required().min(1).max(50).pattern(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$|^[0-9]{6,9}$/), // SWIFT code or routing number
  receiverBank: Joi.string().required().min(1).max(50).pattern(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$|^[0-9]{6,9}$/), // SWIFT code or routing number
  metadata: Joi.object({
    ip_address: Joi.string().ip().required(), // Track originating IP
    user_agent: Joi.string().max(500).optional(),
    session_id: Joi.string().required(),
    device_fingerprint: Joi.string().optional()
  }).required()
});

const settlementSchema = Joi.object({
  force: Joi.boolean().default(false),
  bank_codes: Joi.array().items(Joi.string().length(6)).optional(), // Standard bank code length
  authorized_by: Joi.string().required().min(1), // Who authorized the settlement
  authorization_token: Joi.string().required().min(10) // Authorization token
});

const transactionQuerySchema = Joi.object({
  start_date: Joi.date().iso().required(), // Required date range for security
  end_date: Joi.date().iso().required().greater(Joi.ref('start_date')),
  type: Joi.string().valid('debit', 'credit').optional(),
  status: Joi.string().valid('pending', 'settled', 'failed').optional(),
  userId: Joi.string().optional(), // Optional filter by user
  min_amount: Joi.number().positive().optional(),
  max_amount: Joi.number().positive().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20) // Reduced max for performance
});

const simulatorSchema = Joi.object({
  count: Joi.number().integer().min(1).max(100).required(), // Required count, reduced max
  interval: Joi.number().integer().min(500).max(5000).required(), // Required interval
  authorized_by: Joi.string().required().min(1), // Who authorized simulation
  authorization_token: Joi.string().required().min(10),
  amount_range: Joi.object({
    min: Joi.number().positive().required(),
    max: Joi.number().positive().greater(Joi.ref('min')).required()
  }).required(),
  test_mode: Joi.boolean().default(true) // Ensure simulations are marked as test
});

const userAuthSchema = Joi.object({
  username: Joi.string().required().min(3).max(50).alphanum(),
  password: Joi.string().required().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/), // Strong password
  session_id: Joi.string().required(),
  ip_address: Joi.string().ip().required()
});

module.exports = {
  transactionSchema,
  settlementSchema,
  transactionQuerySchema,
  simulatorSchema,
  userAuthSchema
};