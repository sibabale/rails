const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { bankRegistrationSchema, bankLoginSchema } = require('../validation/bankSchemas');
const { getSecurityConfig } = require('../config');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const securityConfig = require('../config/security');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Bank registration endpoint (mounted on /api/banks/register)
router.post('/register', async (req, res) => {
  const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);
  
  try {
    // Debug log the request body and headers
    requestLogger.info('Bank registration request received', {
      body: req.body,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type'],
      bodyLength: JSON.stringify(req.body || {}).length,
      event_type: 'registration_request'
    });

    // Validate registration data
    const { error, value } = bankRegistrationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    requestLogger.info('Validation result', {
      hasError: !!error,
      hasValue: !!value,
      errorDetails: error ? error.details : null,
      event_type: 'validation_result'
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      requestLogger.warn('Bank registration validation failed', {
        errors: errorDetails,
        event_type: 'validation_failed'
      });

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Bank registration data is invalid',
        details: errorDetails,
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    if (!value) {
      requestLogger.warn('Bank registration failed - empty body', {
        event_type: 'empty_request_body'
      });

      return res.status(400).json({
        error: 'Request body empty',
        message: 'Request body is empty or invalid',
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    // Check if bank code already exists
    const existingBank = await prisma.bank.findUnique({
      where: { bankCode: value.bankCode }
    });
    if (existingBank) {
      requestLogger.warn('Bank registration failed - code already exists', {
        bankCode: value.bankCode,
        event_type: 'duplicate_bank_code'
      });

      return res.status(409).json({
        error: 'Bank code already exists',
        message: `Bank with code ${value.bankCode} is already registered`,
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    // Check if admin email already exists
    const existingAdmin = await prisma.bank.findUnique({
      where: { adminEmail: value.adminUser.email }
    });
    if (existingAdmin) {
      requestLogger.warn('Bank registration failed - admin email already exists', {
        adminEmail: value.adminUser.email,
        event_type: 'duplicate_admin_email'
      });

      return res.status(409).json({
        error: 'Admin email already exists',
        message: `Admin with email ${value.adminUser.email} is already registered`,
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    // Generate and hash API key for secure storage
    const plainApiKey = `rails_${uuidv4().replace(/-/g, '')}`;
    const hashedApiKey = securityConfig.hashData(plainApiKey);

    // Register the bank (API key is hashed for security)
    const result = await prisma.bank.create({
      data: {
        bankCode: value.bankCode,
        bankName: value.bankName,
        contactEmail: value.contactEmail,
        contactPhone: value.contactPhone,
        address: JSON.stringify(value.address),
        adminFirstName: value.adminUser.firstName,
        adminLastName: value.adminUser.lastName,
        adminEmail: value.adminUser.email,
        adminPosition: value.adminUser.position,
        primaryApiKey: hashedApiKey, // Store hashed API key
        apiKeyExpiresAt: null,
        businessType: value.businessDetails?.type,
        businessRegNo: value.businessDetails?.registrationNumber,
        taxId: value.businessDetails?.taxId,
        settings: JSON.stringify({
          timezone: 'Africa/Johannesburg',
          currency: 'ZAR',
          businessHours: {
            start: '09:00',
            end: '17:00',
            weekends: false
          },
          notifications: {
            email: true,
            sms: false,
            webhook: null
          }
        })
      }
    });

    requestLogger.audit('Bank application submitted', {
      bankId: result.id,
      bankCode: result.bankCode,
      bankName: result.bankName,
      adminEmail: result.adminEmail,
      event_type: 'bank_application_submitted'
    });

    // Send application received email
    const emailData = {
      bankId: result.id,
      bankCode: result.bankCode,
      bankName: result.bankName,
      adminEmail: result.adminEmail,
      adminFirstName: result.adminFirstName,
      adminLastName: result.adminLastName
    };

    const emailResult = await emailService.sendBankApplicationReceived(emailData);
    if (!emailResult.success) {
      requestLogger.warn('Failed to send application received email', {
        bankId: result.id,
        adminEmail: result.adminEmail,
        error: emailResult.error || emailResult.reason,
        event_type: 'email_send_warning'
      });
    }

    res.status(201).json({
      message: 'Partnership application submitted successfully',
      bankId: result.id,
      bankCode: result.bankCode,
      status: result.status,
      apiKey: plainApiKey, // Return the plain API key for the user to save
      nextSteps: [
        'We will review your application within 5-7 business days',
        'Save your API key securely - it will be needed for authentication',
        'Selected partners will receive final approval via email'
      ],
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    requestLogger.error('Bank registration failed', {
      error_message: error.message,
      error_stack: error.stack,
      event_type: 'bank_registration_error'
    });

    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during bank registration',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

// Bank login endpoint (mounted on /api/banks/login)
router.post('/login', async (req, res) => {
  const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);

  try {
    // Validate login data
    const { error, value } = bankLoginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      requestLogger.security('Bank login validation failed', {
        errors: errorDetails,
        ip_address: req.ip,
        event_type: 'login_validation_failed'
      });

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Login credentials are invalid',
        details: errorDetails,
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    // Authenticate bank using the new auth service
    const authResult = await authService.authenticateBank(
      value.email,
      value.bankCode,
      value.authToken,
      req.ip,
      req.headers['user-agent']
    );

    if (!authResult.success) {
      requestLogger.security('Bank authentication failed', {
        email: value.email,
        bankCode: value.bankCode,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        error: authResult.error,
        event_type: 'bank_auth_failed'
      });

      return res.status(401).json({
        error: 'Authentication failed',
        message: authResult.error,
        lockExpiresAt: authResult.lockExpiresAt,
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    requestLogger.audit('Bank login successful', {
      bankId: authResult.bank.id,
      bankCode: authResult.bank.bankCode,
      adminEmail: authResult.bank.adminEmail,
      ip_address: req.ip,
      event_type: 'bank_login_success'
    });

    res.json({
      message: 'Login successful',
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      bank: authResult.bank,
      expiresIn: securityConfig.getConfig().jwtExpiry,
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    requestLogger.error('Bank login failed', {
      error_message: error.message,
      error_stack: error.stack,
      event_type: 'bank_login_error'
    });

    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Refresh token is required',
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    const refreshResult = await authService.refreshAccessToken(refreshToken, req.ip);

    if (!refreshResult.success) {
      requestLogger.security('Token refresh failed', {
        ip_address: req.ip,
        error: refreshResult.error,
        event_type: 'token_refresh_failed'
      });

      return res.status(401).json({
        error: 'Token refresh failed',
        message: refreshResult.error,
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'Token refreshed successfully',
      accessToken: refreshResult.accessToken,
      expiresIn: securityConfig.getConfig().jwtExpiry,
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    requestLogger.error('Token refresh error', {
      error_message: error.message,
      event_type: 'token_refresh_error'
    });

    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred during token refresh',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  const requestLogger = req.logger || logger.withCorrelationId(req.correlationId);

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Valid Bearer token must be provided',
        correlation_id: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);

    await authService.logout(decoded.userId, req.ip);

    res.json({
      message: 'Logout successful',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    requestLogger.error('Logout error', {
      error_message: error.message,
      event_type: 'logout_error'
    });

    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
      correlation_id: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;