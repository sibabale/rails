const crypto = require('crypto');
const { promisify } = require('util');

// Security configuration and utilities
class SecurityConfig {
  constructor() {
    this.validateEnvironment();
  }

  /**
   * Validate that required security environment variables are set
   */
  validateEnvironment() {
    const requiredVars = ['JWT_SECRET', 'ADMIN_TOKEN'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required security environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Generate cryptographically secure random string
   * @param {number} length - Length of the string
   * @returns {string} Random string
   */
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Generate secure API key with proper entropy
   * @param {string} prefix - Optional prefix for the key
   * @returns {string} Secure API key
   */
  generateApiKey(prefix = '') {
    const randomPart = this.generateSecureRandom(32);
    return prefix ? `${prefix}_${randomPart}` : randomPart;
  }

  /**
   * Hash sensitive data using SHA-256
   * @param {string} data - Data to hash
   * @returns {string} Hashed data
   */
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure JWT secret
   * @returns {string} Secure JWT secret
   */
  generateJwtSecret() {
    return this.generateSecureRandom(64);
  }

  /**
   * Get security configuration
   * @returns {Object} Security configuration
   */
  getConfig() {
    return {
      jwtSecret: process.env.JWT_SECRET,
      adminToken: process.env.ADMIN_TOKEN,
      jwtExpiry: process.env.JWT_EXPIRY || '24h',
      jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000, // 15 minutes
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000, // 30 minutes
      apiKeyExpiry: parseInt(process.env.API_KEY_EXPIRY) || 365 * 24 * 60 * 60 * 1000, // 1 year
      enableMfa: process.env.ENABLE_MFA === 'true',
      mfaIssuer: process.env.MFA_ISSUER || 'Rails Financial',
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 12,
      requireSpecialChars: process.env.REQUIRE_SPECIAL_CHARS !== 'false',
      requireNumbers: process.env.REQUIRE_NUMBERS !== 'false',
      requireUppercase: process.env.REQUIRE_UPPERCASE !== 'false'
    };
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    const config = this.getConfig();
    const errors = [];

    if (password.length < config.passwordMinLength) {
      errors.push(`Password must be at least ${config.passwordMinLength} characters long`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Calculate password strength score (0-100)
   * @param {string} password - Password to evaluate
   * @returns {number} Strength score
   */
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length contribution
    score += Math.min(password.length * 4, 25);
    
    // Character variety contribution
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    
    // Bonus for mixed case and numbers
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score += 10;
    
    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 15; // Common sequences
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate TOTP secret for MFA
   * @returns {string} TOTP secret
   */
  generateTotpSecret() {
    return crypto.randomBytes(20).toString('base32');
  }

  /**
   * Verify TOTP token
   * @param {string} secret - TOTP secret
   * @param {string} token - Token to verify
   * @param {number} window - Time window for verification
   * @returns {boolean} Whether token is valid
   */
  verifyTotpToken(secret, token, window = 1) {
    const totp = require('totp-generator');
    const currentToken = totp(secret);
    
    if (token === currentToken) return true;
    
    // Check adjacent time windows
    for (let i = 1; i <= window; i++) {
      const pastToken = totp(secret, { time: Date.now() - (i * 30 * 1000) });
      const futureToken = totp(secret, { time: Date.now() + (i * 30 * 1000) });
      
      if (token === pastToken || token === futureToken) return true;
    }
    
    return false;
  }
}

// Export singleton instance
const securityConfig = new SecurityConfig();
module.exports = securityConfig; 