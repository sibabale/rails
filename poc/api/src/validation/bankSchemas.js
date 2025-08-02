const Joi = require('joi');

const bankRegistrationSchema = Joi.object({
  bankName: Joi.string().required().min(2).max(100),
  bankCode: Joi.string().required().length(6).pattern(/^[A-Z0-9]+$/), // Standard bank code
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().pattern(/^\+27[0-9]{9}$/).required(), // SA phone number
  address: Joi.object({
    street: Joi.string().required().min(5).max(100),
    city: Joi.string().required().min(2).max(50),
    province: Joi.string().required().valid(
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
      'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
    ),
    postalCode: Joi.string().required().pattern(/^[0-9]{4}$/),
    country: Joi.string().default('South Africa')
  }).required(),
  adminUser: Joi.object({
    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+27[0-9]{9}$/).required(),
    idNumber: Joi.string().required().length(13).pattern(/^[0-9]+$/), // SA ID number
    position: Joi.string().required().min(2).max(100)
  }).required(),
  businessDetails: Joi.object({
    registrationNumber: Joi.string().required().min(5).max(20),
    vatNumber: Joi.string().optional().pattern(/^[0-9]{10}$/),
    website: Joi.string().uri().optional(),
    establishedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()),
    bankType: Joi.string().required().valid('commercial', 'mutual', 'cooperative', 'investment'),
    expectedVolume: Joi.string().required().valid('low', 'medium', 'high', 'enterprise')
  }).required(),
  compliance: Joi.object({
    sarb_registered: Joi.boolean().required(),
    sarb_license_number: Joi.string().allow('').when('sarb_registered', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    fica_compliant: Joi.boolean().required(),
    popi_compliant: Joi.boolean().required(),
    accepts_terms: Joi.boolean().valid(true).required()
  }).required()
});

const bankLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  bankCode: Joi.string().required().length(6).pattern(/^[A-Z0-9]+$/),
  // For POC, we'll use a simple auth token instead of password
  authToken: Joi.string().required().min(32).pattern(/^[A-Za-z0-9+/=_-]+$/) // Base64-like pattern with underscores and hyphens for API keys
});

const clientRegistrationSchema = Joi.object({
  clientId: Joi.string().required().min(5).max(50).pattern(/^[A-Z0-9_-]+$/),
  clientName: Joi.string().required().min(2).max(100),
  clientType: Joi.string().required().valid('individual', 'business', 'corporate'),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().pattern(/^\+27[0-9]{9}$/).required(),
  accountDetails: Joi.object({
    accountNumber: Joi.string().required().min(8).max(20),
    accountType: Joi.string().required().valid('savings', 'current', 'fixed_deposit', 'investment'),
    currency: Joi.string().length(3).uppercase().default('ZAR'),
    initialBalance: Joi.number().min(0).default(0),
    dailyTransactionLimit: Joi.number().min(0).max(1000000).default(50000),
    monthlyTransactionLimit: Joi.number().min(0).max(10000000).default(500000)
  }).required(),
  kycDetails: Joi.object({
    idNumber: Joi.string().when('clientType', {
      is: 'individual',
      then: Joi.string().required().length(13).pattern(/^[0-9]+$/),
      otherwise: Joi.optional()
    }),
    registrationNumber: Joi.string().when('clientType', {
      is: Joi.valid('business', 'corporate'),
      then: Joi.string().required().min(5).max(20),
      otherwise: Joi.optional()
    }),
    address: Joi.object({
      street: Joi.string().required().min(5).max(100),
      city: Joi.string().required().min(2).max(50),
      province: Joi.string().required().valid(
        'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
        'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
      ),
      postalCode: Joi.string().required().pattern(/^[0-9]{4}$/),
      country: Joi.string().default('South Africa')
    }).required(),
    riskProfile: Joi.string().required().valid('low', 'medium', 'high'),
    fica_status: Joi.string().required().valid('pending', 'verified', 'rejected'),
    popi_consent: Joi.boolean().valid(true).required()
  }).required()
});

module.exports = {
  bankRegistrationSchema,
  bankLoginSchema,
  clientRegistrationSchema
};