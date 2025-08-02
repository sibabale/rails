const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { addCorrelationId, addSecurityHeaders, validateSettlement, validateTransactionQuery } = require('../../src/middleware/validation');

// Mock dependencies
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
  })),
  audit: jest.fn(),
  transaction: jest.fn()
}));

// Setup test data directory
const testDataDir = path.join(__dirname, '../test-data');
const testLedgerFile = path.join(testDataDir, 'ledger.json');
const testBanksFile = path.join(testDataDir, 'banks.json');
const testReserveFile = path.join(testDataDir, 'reserve.json');

describe('Ledger Integration Tests', () => {
  let app;
  let ledgerModule;

  beforeAll(async () => {
    // Create test data directory
    await fs.mkdir(testDataDir, { recursive: true });
  });

  beforeEach(async () => {
    // Clear test files before each test
    const filesToClear = [testLedgerFile, testBanksFile, testReserveFile];
    await Promise.all(
      filesToClear.map(async (file) => {
        try {
          await fs.unlink(file);
        } catch (error) {
          // File doesn't exist, that's fine
        }
      })
    );

    // Mock the ledger file paths
    jest.doMock('../../src/ledger/ledger', () => {
      // Override file paths for testing
      const originalModule = jest.requireActual('../../src/ledger/ledger');
      return {
        ...originalModule,
        LEDGER_FILE: testLedgerFile,
        BANKS_FILE: testBanksFile,
        RESERVE_FILE: testReserveFile
      };
    });

    // Import fresh module instance
    delete require.cache[require.resolve('../../src/ledger/ledger')];
    ledgerModule = require('../../src/ledger/ledger');

    // Setup test app
    app = express();
    app.set('trust proxy', true);
    app.use(addCorrelationId);
    app.use(addSecurityHeaders);
    app.use(bodyParser.json());
    
    // Add test routes
    const router = express.Router();
    
    router.post('/ledger/settle', validateSettlement, async (req, res) => {
      try {
        const { authorized_by, force } = req.validatedBody;
        const result = await ledgerModule.settleTransactions(authorized_by, force);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    router.get('/ledger/pending', (req, res) => {
      try {
        const pending = ledgerModule.getPendingTransactions();
        res.json({ pending });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    router.get('/transactions', validateTransactionQuery, (req, res) => {
      try {
        const filters = req.validatedQuery;
        const transactions = ledgerModule.getLedger(filters);
        res.json({ transactions });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    router.get('/reserve', (req, res) => {
      try {
        const reserve = ledgerModule.getReserve();
        res.json(reserve);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.use('/api', router);

    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rmdir(testDataDir, { recursive: true });
    } catch (error) {
      // Directory doesn't exist or cleanup failed
    }
  });

  describe('POST /api/ledger/settle', () => {
    beforeEach(async () => {
      // Add some test transactions to the ledger
      await ledgerModule.postTransaction({
        txn_ref: 'TXN_SETTLE_001',
        amount: 100.00,
        userId: 'user_123',
        type: 'debit',
        description: 'Test transaction 1',
        source_account: 'ACC_001',
        timestamp: new Date().toISOString(),
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_123'
        }
      });

      await ledgerModule.postTransaction({
        txn_ref: 'TXN_SETTLE_002',
        amount: 250.50,
        userId: 'user_456',
        type: 'credit',
        description: 'Test transaction 2',
        source_account: 'ACC_002',
        destination_account: 'ACC_003',
        timestamp: new Date().toISOString(),
        metadata: {
          ip_address: '192.168.1.101',
          session_id: 'sess_456'
        }
      });
    });

    it('should settle pending transactions with proper authorization', async () => {
      const settlementRequest = {
        authorized_by: 'admin_user_123',
        authorization_token: 'valid_admin_token_123456',
        force: false
      };

      const response = await request(app)
        .post('/api/ledger/settle')
        .send(settlementRequest)
        .expect(200);

      expect(response.body).toHaveProperty('settled');
      expect(response.body).toHaveProperty('settlement_timestamp');
      expect(response.body.settled).toBeInstanceOf(Array);
      expect(response.body.settled.length).toBe(2);

      // Verify transactions are marked as settled
      response.body.settled.forEach(txn => {
        expect(txn.status).toBe('completed');
        expect(txn.settled).toBe(true);
        expect(txn.settled_by).toBe('admin_user_123');
        expect(txn.settled_at).toBeTruthy();
      });
    });

    it('should reject settlement without authorization', async () => {
      const invalidRequest = {
        force: false
        // Missing authorized_by and authorization_token
      };

      const response = await request(app)
        .post('/api/ledger/settle')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'authorized_by'
          }),
          expect.objectContaining({
            field: 'authorization_token'
          })
        ])
      );
    });

    it('should handle force settlement when no pending transactions', async () => {
      // First settle all transactions
      await ledgerModule.settleTransactions('admin_123', false);

      const settlementRequest = {
        authorized_by: 'admin_user_123',
        authorization_token: 'valid_admin_token_123456',
        force: true
      };

      const response = await request(app)
        .post('/api/ledger/settle')
        .send(settlementRequest)
        .expect(200);

      expect(response.body.settled).toBeInstanceOf(Array);
      expect(response.body.settled.length).toBe(0);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/ledger/pending', () => {
    it('should return pending transactions', async () => {
      // Add test transaction
      await ledgerModule.postTransaction({
        txn_ref: 'TXN_PENDING_001',
        amount: 75.25,
        userId: 'user_789',
        type: 'debit',
        description: 'Pending test transaction',
        source_account: 'ACC_004',
        timestamp: new Date().toISOString(),
        metadata: {
          ip_address: '192.168.1.102',
          session_id: 'sess_789'
        }
      });

      const response = await request(app)
        .get('/api/ledger/pending')
        .expect(200);

      expect(response.body).toHaveProperty('pending');
      expect(response.body.pending).toBeInstanceOf(Array);
      expect(response.body.pending.length).toBe(1);
      expect(response.body.pending[0]).toEqual(
        expect.objectContaining({
          txn_ref: 'TXN_PENDING_001',
          status: 'pending',
          amount: 75.25
        })
      );
    });

    it('should return empty array when no pending transactions', async () => {
      const response = await request(app)
        .get('/api/ledger/pending')
        .expect(200);

      expect(response.body).toHaveProperty('pending');
      expect(response.body.pending).toEqual([]);
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      // Add test transactions with different dates and users
      const baseDate = new Date('2024-01-01T10:00:00Z');
      
      await ledgerModule.postTransaction({
        txn_ref: 'TXN_QUERY_001',
        amount: 100.00,
        userId: 'user_alice',
        type: 'debit',
        description: 'Transaction 1',
        source_account: 'ACC_001',
        timestamp: new Date(baseDate.getTime()).toISOString(),
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_001'
        }
      });

      await ledgerModule.postTransaction({
        txn_ref: 'TXN_QUERY_002',
        amount: 200.00,
        userId: 'user_bob',
        type: 'credit',
        description: 'Transaction 2',
        source_account: 'ACC_002',
        destination_account: 'ACC_003',
        timestamp: new Date(baseDate.getTime() + 3600000).toISOString(), // +1 hour
        metadata: {
          ip_address: '192.168.1.101',
          session_id: 'sess_002'
        }
      });
    });

    it('should require start_date and end_date for security', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'start_date'
          }),
          expect.objectContaining({
            field: 'end_date'
          })
        ])
      );
    });

    it('should return transactions within date range', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({
          start_date: '2024-01-01T09:00:00Z',
          end_date: '2024-01-01T12:00:00Z'
        })
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toBeInstanceOf(Array);
      expect(response.body.transactions.length).toBe(2);
    });

    it('should filter by user ID', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({
          start_date: '2024-01-01T09:00:00Z',
          end_date: '2024-01-01T12:00:00Z',
          userId: 'user_alice'
        })
        .expect(200);

      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].userId).toBe('user_alice');
    });

    it('should filter by transaction type', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({
          start_date: '2024-01-01T09:00:00Z',
          end_date: '2024-01-01T12:00:00Z',
          type: 'credit'
        })
        .expect(200);

      expect(response.body.transactions.length).toBe(1);
      expect(response.body.transactions[0].type).toBe('credit');
    });

    it('should validate end_date is after start_date', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({
          start_date: '2024-01-01T12:00:00Z',
          end_date: '2024-01-01T09:00:00Z' // Before start_date
        })
        .expect(400);

      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'end_date',
            message: expect.stringContaining('greater')
          })
        ])
      );
    });

    it('should respect pagination limits', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({
          start_date: '2024-01-01T09:00:00Z',
          end_date: '2024-01-01T12:00:00Z',
          limit: 1
        })
        .expect(200);

      expect(response.body.transactions.length).toBe(1);
    });
  });

  describe('GET /api/reserve', () => {
    it('should return current reserve status', async () => {
      const response = await request(app)
        .get('/api/reserve')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('available');
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.available).toBe('number');
      expect(response.body.available).toBeLessThanOrEqual(response.body.total);
    });
  });

  describe('Transaction Processing with Reserve', () => {
    it('should reduce available reserve when processing transactions', async () => {
      // Get initial reserve
      const initialReserve = ledgerModule.getReserve();
      const initialAvailable = initialReserve.available;

      // Process transaction
      await ledgerModule.postTransaction({
        txn_ref: 'TXN_RESERVE_001',
        amount: 100.00,
        userId: 'user_reserve',
        type: 'debit',
        description: 'Reserve test transaction',
        source_account: 'ACC_RESERVE',
        timestamp: new Date().toISOString(),
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_reserve'
        }
      });

      // Check reserve was reduced
      const updatedReserve = ledgerModule.getReserve();
      expect(updatedReserve.available).toBe(initialAvailable - 100.00);
    });

    it('should handle insufficient reserve gracefully', async () => {
      // Set low reserve
      await ledgerModule.setReserve(50.00, 'test_admin');

      // Try to process transaction larger than reserve
      const result = await ledgerModule.postTransaction({
        txn_ref: 'TXN_INSUFFICIENT_001',
        amount: 100.00,
        userId: 'user_insufficient',
        type: 'debit',
        description: 'Insufficient reserve test',
        source_account: 'ACC_INSUFFICIENT',
        timestamp: new Date().toISOString(),
        metadata: {
          ip_address: '192.168.1.100',
          session_id: 'sess_insufficient'
        }
      });

      // Transaction should be marked as delayed
      expect(result.status).toBe('delayed');
    });
  });
});