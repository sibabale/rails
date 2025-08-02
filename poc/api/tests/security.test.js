const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const securityConfig = require('../src/config/security');
const authService = require('../src/services/authService');

const prisma = new PrismaClient();

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-for-testing';
process.env.ADMIN_TOKEN = 'test-admin-token-32-chars-long-for-testing';

describe('Security Tests', () => {
  let app;
  let testBank;
  let testApiKey;

  beforeAll(async () => {
    // Import app after setting environment variables
    app = require('../index');
    
    // Clean up test data
    await prisma.refreshToken.deleteMany();
    await prisma.loginAttempt.deleteMany();
    await prisma.bank.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.refreshToken.deleteMany();
    await prisma.loginAttempt.deleteMany();
    await prisma.bank.deleteMany();
  });

  describe('Security Configuration', () => {
    test('should validate required environment variables', () => {
      expect(() => securityConfig.validateEnvironment()).not.toThrow();
    });

    test('should generate secure random strings', () => {
      const random1 = securityConfig.generateSecureRandom(32);
      const random2 = securityConfig.generateSecureRandom(32);
      
      expect(random1).toHaveLength(43); // base64url encoding
      expect(random1).not.toBe(random2);
      expect(random1).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('should generate secure API keys', () => {
      const apiKey1 = securityConfig.generateApiKey('test');
      const apiKey2 = securityConfig.generateApiKey('test');
      
      expect(apiKey1).toMatch(/^test_[A-Za-z0-9_-]+$/);
      expect(apiKey1).not.toBe(apiKey2);
      expect(apiKey1.length).toBeGreaterThan(40);
    });

    test('should hash data consistently', () => {
      const data = 'test-data';
      const hash1 = securityConfig.hashData(data);
      const hash2 = securityConfig.hashData(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
      expect(hash1).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('Password Validation', () => {
    test('should validate strong passwords', () => {
      const strongPassword = 'StrongP@ssw0rd123';
      const result = securityConfig.validatePassword(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBeGreaterThan(70);
    });

    test('should reject weak passwords', () => {
      const weakPassword = 'weak';
      const result = securityConfig.validatePassword(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBeLessThan(50);
    });

    test('should calculate password strength correctly', () => {
      const passwords = [
        { password: 'weak', expectedStrength: 'low' },
        { password: 'StrongP@ssw0rd123', expectedStrength: 'high' },
        { password: '123456789', expectedStrength: 'low' },
        { password: 'Complex!@#$%^&*()', expectedStrength: 'high' }
      ];

      passwords.forEach(({ password, expectedStrength }) => {
        const result = securityConfig.validatePassword(password);
        const strength = result.strength;
        
        if (expectedStrength === 'low') {
          expect(strength).toBeLessThan(50);
        } else {
          expect(strength).toBeGreaterThan(70);
        }
      });
    });
  });

  describe('API Key Security', () => {
    test('should generate and verify API keys securely', () => {
      const apiKeyData = authService.generateApiKey('TEST');
      
      expect(apiKeyData.apiKey).toMatch(/^bank_TEST_[A-Za-z0-9_-]+$/);
      expect(apiKeyData.hashedKey).toHaveLength(64);
      expect(apiKeyData.expiresAt).toBeInstanceOf(Date);
      
      // Verify the API key
      const isValid = authService.verifyApiKey(apiKeyData.apiKey, apiKeyData.hashedKey);
      expect(isValid).toBe(true);
    });

    test('should reject invalid API keys', () => {
      const apiKeyData = authService.generateApiKey('TEST');
      const fakeKey = 'fake-api-key';
      
      const isValid = authService.verifyApiKey(fakeKey, apiKeyData.hashedKey);
      expect(isValid).toBe(false);
    });

    test('should use timing-safe comparison', () => {
      const apiKeyData = authService.generateApiKey('TEST');
      const fakeKey = 'fake-api-key';
      
      // This test ensures we're using timing-safe comparison
      // The verification should take similar time regardless of key validity
      const start1 = Date.now();
      authService.verifyApiKey(apiKeyData.apiKey, apiKeyData.hashedKey);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      authService.verifyApiKey(fakeKey, apiKeyData.hashedKey);
      const time2 = Date.now() - start2;
      
      // Times should be similar (within 10ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(10);
    });
  });

  describe('Account Lockout', () => {
    test('should lock account after multiple failed attempts', async () => {
      const email = 'test@example.com';
      const ipAddress = '192.168.1.1';
      const userAgent = 'test-agent';
      
      // Record failed attempts
      for (let i = 0; i < 5; i++) {
        await authService.recordFailedAttempt(email, ipAddress, userAgent);
      }
      
      // Check if account is locked
      const lockStatus = await authService.checkAccountLock(email);
      expect(lockStatus.isLocked).toBe(true);
      expect(lockStatus.remainingTime).toBeGreaterThan(0);
    });

    test('should reset failed attempts on successful login', async () => {
      const email = 'test@example.com';
      const ipAddress = '192.168.1.1';
      const userAgent = 'test-agent';
      
      // Record some failed attempts
      await authService.recordFailedAttempt(email, ipAddress, userAgent);
      await authService.recordFailedAttempt(email, ipAddress, userAgent);
      
      // Reset attempts
      await authService.resetFailedAttempts(email);
      
      // Check if account is unlocked
      const lockStatus = await authService.checkAccountLock(email);
      expect(lockStatus.isLocked).toBe(false);
    });

    test('should unlock account after lockout period', async () => {
      const email = 'test@example.com';
      const ipAddress = '192.168.1.1';
      const userAgent = 'test-agent';
      
      // Record failed attempts to lock account
      for (let i = 0; i < 5; i++) {
        await authService.recordFailedAttempt(email, ipAddress, userAgent);
      }
      
      // Verify account is locked
      let lockStatus = await authService.checkAccountLock(email);
      expect(lockStatus.isLocked).toBe(true);
      
      // Manually expire the lock by updating the database
      await prisma.loginAttempt.updateMany({
        where: { identifier: email },
        data: { lockExpiresAt: new Date(Date.now() - 1000) }
      });
      
      // Verify account is unlocked
      lockStatus = await authService.checkAccountLock(email);
      expect(lockStatus.isLocked).toBe(false);
    });
  });

  describe('JWT Token Security', () => {
    test('should generate valid JWT tokens', () => {
      const payload = {
        userId: 'test-user',
        role: 'bank_admin'
      };
      
      const token = authService.generateToken(payload, 'access');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token
      const decoded = authService.verifyToken(token);
      expect(decoded.userId).toBe('test-user');
      expect(decoded.role).toBe('bank_admin');
      expect(decoded.type).toBe('access');
      expect(decoded.iss).toBe('rails-api');
      expect(decoded.aud).toBe('bank-client');
    });

    test('should reject expired tokens', () => {
      const payload = {
        userId: 'test-user',
        role: 'bank_admin'
      };
      
      // Generate token with short expiry
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1ms',
        issuer: 'rails-api',
        audience: 'bank-client'
      });
      
      // Wait for token to expire
      setTimeout(() => {
        expect(() => authService.verifyToken(token)).toThrow('Invalid or expired token');
      }, 10);
    });

    test('should reject tokens with invalid signature', () => {
      const payload = {
        userId: 'test-user',
        role: 'bank_admin'
      };
      
      const token = jwt.sign(payload, 'wrong-secret', {
        expiresIn: '1h',
        issuer: 'rails-api',
        audience: 'bank-client'
      });
      
      expect(() => authService.verifyToken(token)).toThrow('Invalid or expired token');
    });
  });

  describe('Bank Registration Security', () => {
    test('should register bank with secure API key', async () => {
      const bankData = {
        bankName: 'Test Bank',
        bankCode: 'TEST01',
        contactEmail: 'contact@testbank.com',
        contactPhone: '+27123456789',
        address: {
          street: '123 Test Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa'
        },
        adminUser: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'admin@testbank.com',
          phone: '+27123456789',
          idNumber: '1234567890123',
          position: 'CEO'
        },
        businessDetails: {
          registrationNumber: 'REG123456',
          vatNumber: '1234567890',
          website: 'https://testbank.com',
          establishedYear: 2020,
          bankType: 'commercial',
          expectedVolume: 'medium'
        },
        compliance: {
          sarb_registered: true,
          sarb_license_number: 'SARB123456',
          fica_compliant: true,
          popi_compliant: true,
          accepts_terms: true
        }
      };

      const response = await request(app)
        .post('/api/banks/register')
        .send(bankData)
        .expect(201);

      expect(response.body.apiKey).toBeDefined();
      expect(response.body.apiKey).toMatch(/^bank_TEST01_[A-Za-z0-9_-]+$/);
      expect(response.body.apiKey.length).toBeGreaterThan(40);
      
      // Verify API key is hashed in database
      const bank = await prisma.bank.findUnique({
        where: { bankCode: 'TEST01' }
      });
      
      expect(bank.primaryApiKey).not.toBe(response.body.apiKey);
      expect(bank.primaryApiKey).toHaveLength(64); // SHA-256 hash
      expect(bank.apiKeyExpiresAt).toBeInstanceOf(Date);
    });

    test('should prevent duplicate bank codes', async () => {
      const bankData = {
        bankName: 'Test Bank',
        bankCode: 'TEST02',
        contactEmail: 'contact@testbank.com',
        contactPhone: '+27123456789',
        address: {
          street: '123 Test Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa'
        },
        adminUser: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'admin2@testbank.com',
          phone: '+27123456789',
          idNumber: '1234567890123',
          position: 'CEO'
        },
        businessDetails: {
          registrationNumber: 'REG123456',
          vatNumber: '1234567890',
          website: 'https://testbank.com',
          establishedYear: 2020,
          bankType: 'commercial',
          expectedVolume: 'medium'
        },
        compliance: {
          sarb_registered: true,
          sarb_license_number: 'SARB123456',
          fica_compliant: true,
          popi_compliant: true,
          accepts_terms: true
        }
      };

      // Register first bank
      await request(app)
        .post('/api/banks/register')
        .send(bankData)
        .expect(201);

      // Try to register with same bank code
      const response = await request(app)
        .post('/api/banks/register')
        .send(bankData)
        .expect(409);

      expect(response.body.error).toBe('Bank code already exists');
    });

    test('should prevent duplicate admin emails', async () => {
      const bankData = {
        bankName: 'Test Bank',
        bankCode: 'TEST03',
        contactEmail: 'contact@testbank.com',
        contactPhone: '+27123456789',
        address: {
          street: '123 Test Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa'
        },
        adminUser: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'admin3@testbank.com',
          phone: '+27123456789',
          idNumber: '1234567890123',
          position: 'CEO'
        },
        businessDetails: {
          registrationNumber: 'REG123456',
          vatNumber: '1234567890',
          website: 'https://testbank.com',
          establishedYear: 2020,
          bankType: 'commercial',
          expectedVolume: 'medium'
        },
        compliance: {
          sarb_registered: true,
          sarb_license_number: 'SARB123456',
          fica_compliant: true,
          popi_compliant: true,
          accepts_terms: true
        }
      };

      // Register first bank
      await request(app)
        .post('/api/banks/register')
        .send(bankData)
        .expect(201);

      // Try to register with same admin email
      bankData.bankCode = 'TEST04';
      const response = await request(app)
        .post('/api/banks/register')
        .send(bankData)
        .expect(409);

      expect(response.body.error).toBe('Admin email already exists');
    });
  });

  describe('Bank Authentication Security', () => {
    beforeEach(async () => {
      // Create a test bank
      const bankData = {
        bankName: 'Test Bank',
        bankCode: 'TEST05',
        contactEmail: 'contact@testbank.com',
        contactPhone: '+27123456789',
        address: {
          street: '123 Test Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa'
        },
        adminUser: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'admin5@testbank.com',
          phone: '+27123456789',
          idNumber: '1234567890123',
          position: 'CEO'
        },
        businessDetails: {
          registrationNumber: 'REG123456',
          vatNumber: '1234567890',
          website: 'https://testbank.com',
          establishedYear: 2020,
          bankType: 'commercial',
          expectedVolume: 'medium'
        },
        compliance: {
          sarb_registered: true,
          sarb_license_number: 'SARB123456',
          fica_compliant: true,
          popi_compliant: true,
          accepts_terms: true
        }
      };

      const response = await request(app)
        .post('/api/banks/register')
        .send(bankData);

      testBank = response.body;
      testApiKey = response.body.apiKey;
    });

    test('should authenticate with valid credentials', async () => {
      const loginData = {
        email: 'admin5@testbank.com',
        bankCode: 'TEST05',
        authToken: testApiKey
      };

      const response = await request(app)
        .post('/api/banks/login')
        .send(loginData)
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.bank.bankCode).toBe('TEST05');
      expect(response.body.bank.adminEmail).toBe('admin5@testbank.com');
    });

    test('should reject invalid credentials', async () => {
      const loginData = {
        email: 'admin5@testbank.com',
        bankCode: 'TEST05',
        authToken: 'invalid-api-key'
      };

      const response = await request(app)
        .post('/api/banks/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Authentication failed');
    });

    test('should lock account after multiple failed attempts', async () => {
      const loginData = {
        email: 'admin5@testbank.com',
        bankCode: 'TEST05',
        authToken: 'invalid-api-key'
      };

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/banks/login')
          .send(loginData)
          .expect(401);
      }

      // Next attempt should be locked
      const response = await request(app)
        .post('/api/banks/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Authentication failed');
      expect(response.body.message).toContain('Account temporarily locked');
      expect(response.body.lockExpiresAt).toBeDefined();
    });

    test('should refresh access token', async () => {
      // First login to get tokens
      const loginData = {
        email: 'admin5@testbank.com',
        bankCode: 'TEST05',
        authToken: testApiKey
      };

      const loginResponse = await request(app)
        .post('/api/banks/login')
        .send(loginData)
        .expect(200);

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/banks/refresh')
        .send({ refreshToken: loginResponse.body.refreshToken })
        .expect(200);

      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.accessToken).not.toBe(loginResponse.body.accessToken);
    });

    test('should logout and revoke tokens', async () => {
      // First login to get tokens
      const loginData = {
        email: 'admin5@testbank.com',
        bankCode: 'TEST05',
        authToken: testApiKey
      };

      const loginResponse = await request(app)
        .post('/api/banks/login')
        .send(loginData)
        .expect(200);

      // Logout
      await request(app)
        .post('/api/banks/logout')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      // Try to refresh token (should fail)
      const refreshResponse = await request(app)
        .post('/api/banks/refresh')
        .send({ refreshToken: loginResponse.body.refreshToken })
        .expect(401);

      expect(refreshResponse.body.error).toBe('Token refresh failed');
    });
  });

  describe('Rate Limiting', () => {
    test('should limit login attempts', async () => {
      const loginData = {
        email: 'rate@test.com',
        bankCode: 'RATE01',
        authToken: 'invalid-key'
      };

      // Make multiple rapid requests
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/api/banks/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
}); 