const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { posthogClient } = require('../posthog/posthog');

const prisma = new PrismaClient();

// Custom error classes for better error handling
class LedgerError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'LedgerError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Initialize ledger system with database
async function initializeLedgerSystem() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Initialize default banks if they don't exist
    const defaultBanks = [
      { name: 'FNB', code: 'FNB001' },
      { name: 'ABSA', code: 'ABSA01' },
      { name: 'NEDBANK', code: 'NED001' },
      { name: 'CAPITEC', code: 'CAP001' },
      { name: 'STANDARD', code: 'STD001' }
    ];

    for (const bank of defaultBanks) {
      await prisma.bank.upsert({
        where: { name: bank.name },
        update: {},
        create: {
          name: bank.name,
          code: bank.code,
          connected: bank.name !== 'STANDARD' // Only STANDARD is disconnected by default
        }
      });
    }

    // Initialize reserve if it doesn't exist
    const reserveCount = await prisma.reserve.count();
    if (reserveCount === 0) {
      await prisma.reserve.create({
        data: {
          total: 25000000,
          available: 25000000
        }
      });
      console.log('✅ Initialized reserve with R25M');
    }

    console.log('✅ Ledger system initialized successfully');
  } catch (error) {
    console.error('🚨 Failed to initialize ledger system:', error);
    throw new LedgerError(
      'Database initialization failed',
      'DB_INIT_FAILED',
      { originalError: error.message }
    );
  }
}

async function postTransaction(txn) {
  try {
    // Validate required transaction fields
    if (!txn.txn_ref || !txn.amount || !txn.userId) {
      throw new LedgerError(
        'Missing required transaction fields',
        'INVALID_TRANSACTION',
        { missing_fields: { txn_ref: !txn.txn_ref, amount: !txn.amount, userId: !txn.userId } }
      );
    }

    // Validate amount is positive
    if (txn.amount <= 0) {
      throw new LedgerError(
        'Transaction amount must be positive',
        'INVALID_AMOUNT',
        { amount: txn.amount }
      );
    }

    // Check for duplicate transaction reference
    const existingTxn = await prisma.transaction.findUnique({
      where: { txnRef: txn.txn_ref }
    });

    if (existingTxn) {
      throw new LedgerError(
        'Transaction reference already exists',
        'DUPLICATE_TXN_REF',
        { txn_ref: txn.txn_ref, existing_timestamp: existingTxn.timestamp }
      );
    }

    // Use database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get current reserve
      const reserve = await tx.reserve.findFirst();
    console.log('💰 Reserve:', reserve);

      if (!reserve) {
        throw new LedgerError('Reserve not found', 'RESERVE_NOT_FOUND');
      }

      let status = 'pending';
      
      // Check reserve availability
      if (reserve.available >= txn.amount) {
        // Update reserve
        await tx.reserve.update({
          where: { id: reserve.id },
          data: { available: reserve.available - txn.amount }
        });
      } else {
        status = 'delayed';
        
        // Safe PostHog capture for insufficient reserve
        try {
          posthogClient.capture({
            distinctId: txn.userId,
            event: 'transaction_delayed',
            properties: {
              txn_ref: txn.txn_ref,
              amount: txn.amount,
              reason: 'insufficient_reserve',
              reserve_available: reserve.available
            }
          });
        } catch (posthogError) {
          console.warn('PostHog capture failed for delayed transaction:', posthogError.message);
        }
      }

      // Create transaction record
      const entry = await tx.transaction.create({
        data: {
          txnRef: txn.txn_ref,
          userId: txn.userId,
          sender: txn.sender,
          receiver: txn.receiver,
          senderBank: txn.senderBank,
          receiverBank: txn.receiverBank,
          amount: parseFloat(txn.amount.toFixed(2)),
          currency: txn.currency || 'ZAR',
          type: txn.type,
          description: txn.description,
          status,
          timestamp: txn.timestamp || new Date(),
          metadata: JSON.stringify({
            ...txn.metadata,
            processing_node: process.env.NODE_ID || 'node-001'
          })
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'transaction_posted',
          userId: txn.userId,
          details: JSON.stringify({
            txn_ref: txn.txn_ref,
            amount: txn.amount,
            type: txn.type,
            status
          })
        }
      });

      return entry;
    });

    console.log(`📒 Ledger: R${result.amount} ${result.type} for ${result.userId} [${result.status}]`);
    
    // Safe PostHog capture for successful posting
    try {
      posthogClient.capture({
        distinctId: txn.userId,
        event: 'transaction_posted',
        properties: {
          txn_ref: txn.txn_ref,
          amount: txn.amount,
          type: txn.type,
          status: result.status
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed for transaction posting:', posthogError.message);
    }

    return result;
  } catch (error) {
    console.error('Failed to post transaction:', error);
    
    // Try to capture error telemetry
    try {
      posthogClient.capture({
        distinctId: txn?.userId || 'unknown',
        event: 'transaction_post_failed',
        properties: {
          txn_ref: txn?.txn_ref,
          error_code: error.code || 'UNKNOWN',
          error_message: error.message
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed for transaction error:', posthogError.message);
    }

    if (error instanceof LedgerError) {
      throw error;
    }
    
    throw new LedgerError(
      'Failed to process transaction',
      'TRANSACTION_PROCESSING_FAILED',
      { originalError: error.message, txn_ref: txn?.txn_ref }
    );
  }
}

async function getPendingTransactions() {
  try {
    return await prisma.transaction.findMany({
      where: { status: 'pending' },
      orderBy: { timestamp: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get pending transactions:', error);
    throw new LedgerError('Failed to retrieve pending transactions', 'QUERY_FAILED');
  }
}

async function getDelayedTransactions() {
  try {
    return await prisma.transaction.findMany({
      where: { status: 'delayed' },
      orderBy: { timestamp: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get delayed transactions:', error);
    throw new LedgerError('Failed to retrieve delayed transactions', 'QUERY_FAILED');
  }
}

async function settleTransactions(authorizedBy, force = false) {
  try {
    if (!authorizedBy) {
      throw new LedgerError('Settlement requires authorization', 'UNAUTHORIZED_SETTLEMENT');
    }

    const pendingCount = await prisma.transaction.count({
      where: { status: 'pending' }
    });

    if (pendingCount === 0 && !force) {
      return { settled: [], message: 'No pending transactions to settle' };
    }

    const settlementTimestamp = new Date();

    // Use database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get all pending transactions
      const pendingTransactions = await tx.transaction.findMany({
        where: { status: 'pending' },
        orderBy: { timestamp: 'asc' }
      });

      // Update all pending transactions to settled
      const settledTransactions = await tx.transaction.updateMany({
        where: { status: 'pending' },
        data: {
          settled: true,
          status: 'completed',
          settledAt: settlementTimestamp,
          settledBy: authorizedBy
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'settlement_completed',
          userId: authorizedBy,
          details: JSON.stringify({
            transactions_settled: pendingTransactions.length,
            total_amount: pendingTransactions.reduce((sum, t) => sum + t.amount, 0),
            authorized_by: authorizedBy,
            timestamp: settlementTimestamp
          })
        }
      });

      return pendingTransactions;
    });

    // Safe telemetry capture
    try {
      posthogClient.capture({
        distinctId: 'system',
        event: 'settlement_completed',
        properties: {
          transactions_settled: result.length,
          total_amount: result.reduce((sum, t) => sum + t.amount, 0),
          authorized_by: authorizedBy,
          timestamp: settlementTimestamp
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed for settlement:', posthogError.message);
    }

    console.log(`✅ Settlement completed: ${result.length} transactions by ${authorizedBy}`);
    return { settled: result, settlement_timestamp: settlementTimestamp };
  } catch (error) {
    console.error('Failed to settle transactions:', error);
    if (error instanceof LedgerError) {
      throw error;
    }
    throw new LedgerError(
      'Settlement processing failed',
      'SETTLEMENT_FAILED',
      { originalError: error.message }
    );
  }
}

async function getLedger(filters = {}) {
  try {
    const whereClause = {};
    
    if (filters.userId) {
      whereClause.userId = filters.userId;
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.start_date) {
      whereClause.timestamp = {
        ...whereClause.timestamp,
        gte: new Date(filters.start_date)
      };
    }
    if (filters.end_date) {
      whereClause.timestamp = {
        ...whereClause.timestamp,
        lte: new Date(filters.end_date)
      };
    }

    return await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get ledger:', error);
    throw new LedgerError('Failed to retrieve ledger data', 'QUERY_FAILED');
  }
}

async function getBanks() {
  try {
    return await prisma.bank.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get banks:', error);
    throw new LedgerError('Failed to retrieve banks data', 'QUERY_FAILED');
  }
}

async function getReserve() {
  try {
    const reserve = await prisma.reserve.findFirst();
    console.log('💰 Reserve:', reserve);

    if (!reserve) {
      
      throw new LedgerError('Reserve not found', 'RESERVE_NOT_FOUND');
    }
    return reserve;
  } catch (error) {
    console.error('Failed to get reserve:', error);
    if (error instanceof LedgerError) {
      throw error;
    }
    throw new LedgerError('Failed to retrieve reserve data', 'QUERY_FAILED');
  }
}

async function setReserve(amount, authorizedBy) {
  try {
    if (!authorizedBy) {
      throw new LedgerError('Reserve modification requires authorization', 'UNAUTHORIZED_RESERVE_CHANGE');
    }

    if (typeof amount !== 'number' || amount < 0) {
      throw new LedgerError('Reserve amount must be a positive number', 'INVALID_RESERVE_AMOUNT');
    }

    const result = await prisma.$transaction(async (tx) => {
      const oldReserve = await tx.reserve.findFirst();
    console.log('💰 Reserve:', reserve);

      if (!oldReserve) {
        throw new LedgerError('Reserve not found', 'RESERVE_NOT_FOUND');
      }

      const updatedReserve = await tx.reserve.update({
        where: { id: oldReserve.id },
        data: {
          total: amount,
          available: amount
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'reserve_updated',
          userId: authorizedBy,
          details: JSON.stringify({
            old_total: oldReserve.total,
            new_total: amount,
            authorized_by: authorizedBy
          })
        }
      });

      return { oldReserve, newReserve: updatedReserve };
    });

    // Safe telemetry capture
    try {
      posthogClient.capture({
        distinctId: 'system',
        event: 'reserve_updated',
        properties: {
          old_total: result.oldReserve.total,
          new_total: result.newReserve.total,
          authorized_by: authorizedBy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed for reserve update:', posthogError.message);
    }

    console.log(`💰 Reserve updated: R${result.oldReserve.total} → R${result.newReserve.total} by ${authorizedBy}`);
    return result.newReserve;
  } catch (error) {
    console.error('Failed to set reserve:', error);
    if (error instanceof LedgerError) {
      throw error;
    }
    throw new LedgerError(
      'Failed to update reserve',
      'RESERVE_UPDATE_FAILED',
      { originalError: error.message }
    );
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = {
  postTransaction,
  getPendingTransactions,
  getDelayedTransactions,
  settleTransactions,
  getLedger,
  getBanks,
  getReserve,
  setReserve,
  LedgerError,
  initializeLedgerSystem,
  prisma
}; 