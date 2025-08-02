const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { addCorrelationId, addSecurityHeaders, addRequestTiming, validateTransaction } = require('../../src/middleware/validation');
const webhookRouter = require('../../src/routes/webhook');

// Mock dependencies
jest.mock('../../src/queue/queue', () => ({
  addToQueue: jest.fn(() => true)
}));

jest.mock('../../src/posthog/posthog', () => ({
  posthogClient: {
    capture: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  withCorrelationId: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    performance: jest.fn()
  }))
}));

// Setup test app
const createTestApp = () => {
  const app = express();
  app.set('trust proxy', true);
  app.use(addCorrelationId);
  app.use(addSecurityHeaders);
  app.use(addRequestTiming);
  app.use(bodyParser.json());
  app.use('/api', webhookRouter);
  return app;
};

describe('Webhook Integration Tests', () => {
  let app;
  const { addToQueue } = require('../../src/queue/queue');

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/webhook', () => {
    it('should accept valid transaction with all required fields', async () => {
      const validTransaction = {
        txn_ref: 'TXN_TEST_001',
        amount: 150.75,
        userId: 'user_12345',
        type: 'debit',
        currency: 'ZAR',
        timestamp: new Date().toISOString(),
        description: 'Test payment transaction',
        source_account: 'ACC_001',
        destination_account: 'ACC_002',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_12345',
          device_fingerprint: 'device_abc123'
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(validTransaction)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Transaction received and validated');
      expect(response.body).toHaveProperty('txn_ref', 'TXN_TEST_001');
      expect(response.body).toHaveProperty('status', 'queued');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verify correlation ID is present
      expect(response.headers).toHaveProperty('x-correlation-id');
      
      // Verify security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      
      // Verify queue was called
      expect(addToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          txn_ref: 'TXN_TEST_001',
          amount: 150.75,
          userId: 'user_12345',
          received_at: expect.any(String),
          status: 'pending',
          validation_passed: true
        })
      );
    });

    it('should reject transaction with missing required fields', async () => {
      const invalidTransaction = {
        txn_ref: '', // Invalid empty ref
        amount: -100, // Invalid negative amount
        // Missing userId, type, description, source_account, metadata
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(invalidTransaction)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);

      // Should not call queue for invalid transactions
      expect(addToQueue).not.toHaveBeenCalled();
    });

    it('should validate transaction reference format', async () => {
      const invalidTransaction = {
        txn_ref: 'invalid-ref-with-special-chars!@#', // Invalid characters
        amount: 100,
        userId: 'user_123',
        type: 'credit',
        description: 'Test transaction',
        source_account: 'ACC_001',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(invalidTransaction)
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'txn_ref',
            message: expect.stringContaining('pattern')
          })
        ])
      );
    });

    it('should validate amount precision and limits', async () => {
      const invalidTransaction = {
        txn_ref: 'TXN_AMOUNT_TEST',
        amount: 1000000.999, // Too many decimal places
        userId: 'user_123',
        type: 'debit',
        description: 'Test transaction',
        source_account: 'ACC_001',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(invalidTransaction)
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'amount',
            message: expect.stringContaining('precision')
          })
        ])
      );
    });

    it('should require destination_account for credit transactions', async () => {
      const creditTransaction = {
        txn_ref: 'TXN_CREDIT_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'credit',
        description: 'Credit transaction',
        source_account: 'ACC_001',
        // Missing destination_account for credit
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(creditTransaction)
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'destination_account'
          })
        ])
      );
    });

    it('should validate metadata structure', async () => {
      const transactionWithBadMetadata = {
        txn_ref: 'TXN_META_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'debit',
        description: 'Test transaction',
        source_account: 'ACC_001',
        metadata: {
          ip_address: 'invalid-ip', // Invalid IP address
          session_id: 'sess_123'
          // Missing required session_id
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(transactionWithBadMetadata)
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining('metadata')
          })
        ])
      );
    });

    it('should handle internal server errors gracefully', async () => {
      // Mock addToQueue to throw an error
      addToQueue.mockImplementationOnce(() => {
        throw new Error('Queue processing failed');
      });

      const validTransaction = {
        txn_ref: 'TXN_ERROR_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'debit',
        description: 'Test transaction',
        source_account: 'ACC_001',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(validTransaction)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'Failed to process transaction');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should strip unknown fields for security', async () => {
      const transactionWithExtraFields = {
        txn_ref: 'TXN_STRIP_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'debit',
        description: 'Test transaction',
        source_account: 'ACC_001',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        },
        // These should be stripped
        maliciousField: 'attempt to inject',
        adminOverride: true,
        systemHack: { dangerous: 'payload' }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(transactionWithExtraFields)
        .expect(200);

      // Verify the transaction was processed (stripped fields don't cause rejection)
      expect(response.body).toHaveProperty('message', 'Transaction received and validated');
      
      // Check that addToQueue was called without the malicious fields
      expect(addToQueue).toHaveBeenCalledWith(
        expect.not.objectContaining({
          maliciousField: expect.anything(),
          adminOverride: expect.anything(),
          systemHack: expect.anything()
        })
      );
    });

    it('should set default currency when not provided', async () => {
      const transactionWithoutCurrency = {
        txn_ref: 'TXN_CURRENCY_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'debit',
        description: 'Test transaction',
        source_account: 'ACC_001',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
        // No currency field
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(transactionWithoutCurrency)
        .expect(200);

      // Verify default currency was set
      expect(addToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'ZAR'
        })
      );
    });
  });

  describe('Security Headers', () => {
    it('should include all required security headers', async () => {
      const validTransaction = {
        txn_ref: 'TXN_SECURITY_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'debit',
        description: 'Security test',
        source_account: 'ACC_001',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
      };

      const response = await request(app)
        .post('/api/webhook')
        .send(validTransaction)
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).not.toHaveProperty('x-powered-by');
    });

    it('should generate unique correlation IDs', async () => {
      const transaction = {
        txn_ref: 'TXN_CORRELATION_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'debit',
        description: 'Correlation test',
        source_account: 'ACC_001',
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
      };

      const response1 = await request(app).post('/api/webhook').send(transaction);
      const response2 = await request(app).post('/api/webhook').send({
        ...transaction,
        txn_ref: 'TXN_CORRELATION_002'
      });

      const correlationId1 = response1.headers['x-correlation-id'];
      const correlationId2 = response2.headers['x-correlation-id'];

      expect(correlationId1).toBeTruthy();
      expect(correlationId2).toBeTruthy();
      expect(correlationId1).not.toEqual(correlationId2);
    });
  });
});