const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const securityConfig = require('../config/security');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  datasource: {
    url: process.env.DATABASE_URL
  }
});

class AuthService {
  constructor() {
    this.securityConfig = securityConfig.getConfig();
  }

  /**
   * Generate secure JWT token with proper claims
   * @param {Object} payload - Token payload
   * @param {string} type - Token type (access, refresh)
   * @returns {string} JWT token
   */
  generateToken(payload, type = 'access') {
    const config = this.securityConfig;
    const expiry = type === 'refresh' ? config.jwtRefreshExpiry : config.jwtExpiry;
    
    const tokenPayload = {
      ...payload,
      type,
      iat: Math.floor(Date.now() / 1000),
      iss: 'rails-api',
      aud: 'bank-client'
    };

    return jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: expiry,
      algorithm: 'HS256'
    });
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.securityConfig.jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'rails-api',
        audience: 'bank-client'
      });
    } catch (error) {
      logger.security('JWT verification failed', {
        error: error.message,
        event_type: 'jwt_verification_failed'
      });
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate secure API key
   * @param {string} bankCode - Bank code for prefix
   * @returns {Object} API key details
   */
  generateApiKey(bankCode) {
    const apiKey = securityConfig.generateApiKey(`bank_${bankCode}`);
    const hashedKey = securityConfig.hashData(apiKey);
    const expiresAt = new Date(Date.now() + this.securityConfig.apiKeyExpiry);

    return {
      apiKey,
      hashedKey,
      expiresAt
    };
  }

  /**
   * Hash API key for storage
   * @param {string} apiKey - API key to hash
   * @returns {string} Hashed API key
   */
  hashApiKey(apiKey) {
    return securityConfig.hashData(apiKey);
  }

  /**
   * Verify API key against stored hash
   * @param {string} apiKey - API key to verify
   * @param {string} storedHash - Stored hash to compare against
   * @returns {boolean} Whether API key is valid
   */
  verifyApiKey(apiKey, storedHash) {
    const hashedKey = this.hashApiKey(apiKey);
    
    try {
      return crypto.timingSafeEqual(Buffer.from(hashedKey), Buffer.from(storedHash));
    } catch (error) {
      // Fallback to regular comparison if buffer lengths don't match
      return hashedKey === storedHash;
    }
  }

  /**
   * Check if account is locked due to failed login attempts
   * @param {string} identifier - Email or bank code
   * @returns {Object} Lock status
   */
  async checkAccountLock(identifier) {
    const lockRecord = await prisma.loginAttempt.findFirst({
      where: {
        identifier,
        isLocked: true,
        lockExpiresAt: {
          gt: new Date()
        }
      }
    });

    if (lockRecord) {
      const remainingTime = lockRecord.lockExpiresAt.getTime() - Date.now();
      return {
        isLocked: true,
        remainingTime,
        lockExpiresAt: lockRecord.lockExpiresAt
      };
    }

    return { isLocked: false };
  }

  /**
   * Record failed login attempt
   * @param {string} identifier - Email or bank code
   * @param {string} ipAddress - IP address of the attempt
   * @param {string} userAgent - User agent string
   */
  async recordFailedAttempt(identifier, ipAddress, userAgent) {
    const config = this.securityConfig;
    
    // Get or create login attempt record
    let attemptRecord = await prisma.loginAttempt.findFirst({
      where: { identifier }
    });

    if (!attemptRecord) {
      attemptRecord = await prisma.loginAttempt.create({
        data: {
          identifier,
          failedAttempts: 1,
          lastAttemptAt: new Date(),
          lastIpAddress: ipAddress,
          lastUserAgent: userAgent,
          isLocked: false
        }
      });
    } else {
      const newFailedAttempts = attemptRecord.failedAttempts + 1;
      const isLocked = newFailedAttempts >= config.maxLoginAttempts;
      const lockExpiresAt = isLocked ? new Date(Date.now() + config.lockoutDuration) : null;

      attemptRecord = await prisma.loginAttempt.update({
        where: { id: attemptRecord.id },
        data: {
          failedAttempts: newFailedAttempts,
          lastAttemptAt: new Date(),
          lastIpAddress: ipAddress,
          lastUserAgent: userAgent,
          isLocked,
          lockExpiresAt
        }
      });
    }

    // Log security event
    logger.security('Failed login attempt recorded', {
      identifier,
      ipAddress,
      userAgent,
      failedAttempts: attemptRecord.failedAttempts,
      isLocked: attemptRecord.isLocked,
      event_type: 'failed_login_attempt'
    });

    return attemptRecord;
  }

  /**
   * Reset failed login attempts on successful login
   * @param {string} identifier - Email or bank code
   */
  async resetFailedAttempts(identifier) {
    await prisma.loginAttempt.updateMany({
      where: { identifier },
      data: {
        failedAttempts: 0,
        isLocked: false,
        lockExpiresAt: null,
        lastSuccessfulLogin: new Date()
      }
    });

    logger.security('Login attempts reset after successful login', {
      identifier,
      event_type: 'login_attempts_reset'
    });
  }

  /**
   * Authenticate bank with enhanced security
   * @param {string} email - Admin email
   * @param {string} bankCode - Bank code
   * @param {string} authToken - API key or password
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Object} Authentication result
   */
  async authenticateBank(email, bankCode, authToken, ipAddress, userAgent) {
    try {
      // Check account lock first
      const lockStatus = await this.checkAccountLock(email);
      if (lockStatus.isLocked) {
        logger.security('Login attempt blocked - account locked', {
          email,
          bankCode,
          ipAddress,
          remainingTime: lockStatus.remainingTime,
          event_type: 'login_blocked_locked'
        });

        return {
          success: false,
          error: 'Account temporarily locked due to multiple failed attempts',
          lockExpiresAt: lockStatus.lockExpiresAt
        };
      }

      // Find bank and verify credentials
      const bank = await prisma.bank.findFirst({
        where: {
          bankCode,
          adminEmail: email
        }
      });

      if (!bank) {
        await this.recordFailedAttempt(email, ipAddress, userAgent);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Verify API key (hashed comparison)
      const isApiKeyValid = this.verifyApiKey(authToken, bank.primaryApiKey) ||
                           (bank.secondaryApiKey && this.verifyApiKey(authToken, bank.secondaryApiKey));

      if (!isApiKeyValid) {
        await this.recordFailedAttempt(email, ipAddress, userAgent);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if API key is expired
      if (bank.apiKeyExpiresAt && bank.apiKeyExpiresAt < new Date()) {
        logger.security('Login attempt with expired API key', {
          email,
          bankCode,
          ipAddress,
          event_type: 'expired_api_key_attempt'
        });

        return {
          success: false,
          error: 'API key has expired'
        };
      }

      // Check bank status
      if (bank.status !== 'active' && bank.status !== 'pending_approval') {
        logger.security('Login attempt for inactive bank', {
          email,
          bankCode,
          status: bank.status,
          ipAddress,
          event_type: 'inactive_bank_login'
        });

        return {
          success: false,
          error: `Bank account status: ${bank.status}`
        };
      }

      // Reset failed attempts on successful authentication
      await this.resetFailedAttempts(email);

      // Update last login
      await prisma.bank.update({
        where: { id: bank.id },
        data: { lastLogin: new Date() }
      });

      // Generate tokens
      const tokenPayload = {
        bankId: bank.id,
        bankCode: bank.bankCode,
        bankName: bank.bankName,
        userId: bank.adminEmail,
        role: 'bank_admin',
        type: 'bank'
      };

      const accessToken = this.generateToken(tokenPayload, 'access');
      const refreshToken = this.generateToken(tokenPayload, 'refresh');

      // Store refresh token
      // Convert JWT refresh expiry to milliseconds (7d = 7 days = 7 * 24 * 60 * 60 * 1000)
      const refreshExpiryMs = this.securityConfig.jwtRefreshExpiry === '7d' 
        ? 7 * 24 * 60 * 60 * 1000 
        : parseInt(this.securityConfig.jwtRefreshExpiry) * 1000;
        
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: bank.adminEmail,
          userType: 'bank',
          expiresAt: new Date(Date.now() + refreshExpiryMs),
          ipAddress,
          userAgent
        }
      });

      logger.audit('Bank authentication successful', {
        bankId: bank.id,
        bankCode: bank.bankCode,
        adminEmail: bank.adminEmail,
        ipAddress,
        event_type: 'bank_auth_success'
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        bank: {
          id: bank.id,
          bankCode: bank.bankCode,
          bankName: bank.bankName,
          status: bank.status,
          adminEmail: bank.adminEmail,
          adminFirstName: bank.adminFirstName,
          adminLastName: bank.adminLastName,
          adminPosition: bank.adminPosition
        }
      };

    } catch (error) {
      console.log('Authentication error:', error.message);
      
      logger.error('Bank authentication error', {
        error: error.message,
        email,
        bankCode,
        ipAddress,
        event_type: 'bank_auth_error'
      });

      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {string} ipAddress - IP address
   * @returns {Object} Token refresh result
   */
  async refreshAccessToken(refreshToken, ipAddress) {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken);
      
      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          isRevoked: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!storedToken) {
        logger.security('Invalid refresh token used', {
          ipAddress,
          event_type: 'invalid_refresh_token'
        });

        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      // Generate new access token
      const tokenPayload = {
        bankId: decoded.bankId,
        bankCode: decoded.bankCode,
        bankName: decoded.bankName,
        userId: decoded.userId,
        role: decoded.role,
        type: 'bank'
      };

      const newAccessToken = this.generateToken(tokenPayload, 'access');

      logger.audit('Access token refreshed', {
        userId: decoded.userId,
        ipAddress,
        event_type: 'token_refresh_success'
      });

      return {
        success: true,
        accessToken: newAccessToken
      };

    } catch (error) {
      logger.security('Token refresh failed', {
        error: error.message,
        ipAddress,
        event_type: 'token_refresh_failed'
      });

      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  /**
   * Revoke refresh token
   * @param {string} refreshToken - Refresh token to revoke
   * @param {string} userId - User ID
   */
  async revokeRefreshToken(refreshToken, userId) {
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId
      },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    logger.audit('Refresh token revoked', {
      userId,
      event_type: 'token_revoked'
    });
  }

  /**
   * Logout user by revoking all refresh tokens
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address
   */
  async logout(userId, ipAddress) {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false
      },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    logger.audit('User logged out', {
      userId,
      ipAddress,
      event_type: 'user_logout'
    });
  }
}

module.exports = new AuthService(); 