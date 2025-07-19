// ledger.js
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { posthogClient } = require('../posthog/posthog');
const { fileStorageManager } = require('../utils/fileStorage');

const LEDGER_FILE = path.join(__dirname, 'ledger.json');
const BANKS_FILE = path.join(__dirname, 'banks.json');
const RESERVE_FILE = path.join(__dirname, 'reserve.json');

let ledger = [];
let banks = [];
let reserve = { total: 25000000, available: 25000000 }; // R25M default

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

// Simple atomic write for Windows compatibility
async function saveToFile(filePath, data) {
  try {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    
    // Write to temporary file first
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Atomic rename (works on Windows)
    await fs.rename(tempPath, filePath);
    
    logger.debug('File saved successfully', { filePath, dataSize: JSON.stringify(data).length });
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(`${filePath}.tmp.${Date.now()}`);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw new LedgerError(
      'Failed to save data to file',
      'FILE_SAVE_FAILED',
      { originalError: error.message, filePath }
    );
  }
}

async function loadFromFile(filePath, defaultData = null) {
  try {
    return await fileStorageManager.safeRead(filePath, {
      createIfMissing: defaultData !== null,
      defaultData
    });
  } catch (error) {
    throw new LedgerError(
      'Failed to load data from file',
      'FILE_LOAD_FAILED',
      { originalError: error.message, filePath }
    );
  }
}

// Load ledger from file with error handling
async function loadLedger() {
  try {
    ledger = await loadFromFile(LEDGER_FILE, []);
    
    // Validate ledger structure
    if (!Array.isArray(ledger)) {
      throw new LedgerError('Invalid ledger format: must be an array', 'INVALID_FORMAT');
    }
    
    console.log(`✅ Loaded ${ledger.length} transactions from ledger`);
  } catch (error) {
    console.error('Failed to load ledger:', error);
    if (error instanceof LedgerError) {
      throw error;
    }
    throw new LedgerError(
      'Failed to load ledger from file',
      'LOAD_FAILED',
      { originalError: error.message }
    );
  }
}

// Save ledger to file with error handling
async function saveLedger() {
  try {
    // Create backup before saving for critical data
    try {
      if (fsSync.existsSync(LEDGER_FILE)) {
        await fileStorageManager.createBackup(LEDGER_FILE);
      }
    } catch (backupError) {
      console.warn('Backup creation failed:', backupError.message);
      // Continue with save even if backup fails
    }
    
    await saveToFile(LEDGER_FILE, ledger);
  } catch (error) {
    console.error('Failed to save ledger:', error);
    
    // Try to capture telemetry even if PostHog fails
    try {
      posthogClient.capture({
        distinctId: 'system',
        event: 'ledger_save_failed',
        properties: {
          error: error.message,
          ledger_size: ledger.length
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed:', posthogError.message);
    }
    
    throw error;
  }
}

// Load banks from file with error handling
async function loadBanks() {
  try {
    const defaultBanks = [
      { name: 'FNB', code: 'FNB001', connected: true },
      { name: 'ABSA', code: 'ABSA01', connected: true },
      { name: 'NEDBANK', code: 'NED001', connected: true },
      { name: 'CAPITEC', code: 'CAP001', connected: true },
      { name: 'STANDARD', code: 'STD001', connected: false }
    ];
    
    banks = await loadFromFile(BANKS_FILE, defaultBanks);
    
    // Validate banks structure
    if (!Array.isArray(banks)) {
      throw new LedgerError('Invalid banks format: must be an array', 'INVALID_FORMAT');
    }
    
    console.log(`✅ Loaded ${banks.length} banks`);
  } catch (error) {
    console.error('Failed to load banks:', error);
    if (error instanceof LedgerError) {
      throw error;
    }
    throw new LedgerError(
      'Failed to load banks from file',
      'BANKS_LOAD_FAILED',
      { originalError: error.message }
    );
  }
}

// Save banks to file with error handling
async function saveBanks() {
  try {
    await saveToFile(BANKS_FILE, banks);
  } catch (error) {
    console.error('Failed to save banks:', error);
    throw error;
  }
}

// Load reserve from file with error handling
async function loadReserve() {
  try {
    const defaultReserve = { total: 25000000, available: 25000000 }; // R25M default
    
    reserve = await loadFromFile(RESERVE_FILE, defaultReserve);
    
    // Validate reserve structure
    if (typeof reserve.total !== 'number' || typeof reserve.available !== 'number') {
      throw new LedgerError('Invalid reserve format: must contain total and available numbers', 'INVALID_FORMAT');
    }
    
    if (reserve.available > reserve.total) {
      throw new LedgerError('Invalid reserve: available cannot exceed total', 'INVALID_RESERVE_STATE');
    }
    
    console.log(`✅ Loaded reserve: R${reserve.total} total, R${reserve.available} available`);
  } catch (error) {
    console.error('Failed to load reserve:', error);
    if (error instanceof LedgerError) {
      throw error;
    }
    throw new LedgerError(
      'Failed to load reserve from file',
      'RESERVE_LOAD_FAILED',
      { originalError: error.message }
    );
  }
}

// Save reserve to file with error handling
async function saveReserve() {
  try {
    await saveToFile(RESERVE_FILE, reserve);
  } catch (error) {
    console.error('Failed to save reserve:', error);
    throw error;
  }
}

// Initialize data with proper error handling
async function initializeLedgerSystem() {
  try {
    await loadLedger();
    await loadBanks();
    await loadReserve();
    console.log('✅ Ledger system initialized successfully');
  } catch (error) {
    console.error('🚨 Failed to initialize ledger system:', error);
    throw error;
  }
}

// Initialize immediately
initializeLedgerSystem().catch(error => {
  console.error('🚨 CRITICAL: Ledger system initialization failed:', error);
  process.exit(1); // Exit if we can't initialize critical systems
});

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
    const existingTxn = ledger.find(t => t.txn_ref === txn.txn_ref);
    if (existingTxn) {
      throw new LedgerError(
        'Transaction reference already exists',
        'DUPLICATE_TXN_REF',
        { txn_ref: txn.txn_ref, existing_timestamp: existingTxn.timestamp }
      );
    }

    let status = 'pending';
    
    // Check reserve availability
    if (reserve.available >= txn.amount) {
      reserve.available -= txn.amount;
      await saveReserve();
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

    // Create ledger entry with strict field mapping
    const entry = {
      txn_ref: txn.txn_ref,
      userId: txn.userId,
      sender: txn.source_account,
      receiver: txn.destination_account || 'system',
      amount: parseFloat(txn.amount.toFixed(2)), // Ensure 2 decimal places
      currency: txn.currency || 'ZAR',
      type: txn.type,
      description: txn.description,
      settled: false,
      status,
      timestamp: txn.timestamp || new Date().toISOString(),
      created_at: new Date().toISOString(),
      metadata: {
        ...txn.metadata,
        processing_node: process.env.NODE_ID || 'node-001'
      }
    };

    ledger.push(entry);
    await saveLedger();

    console.log(`📒 Ledger: R${entry.amount} ${entry.type} for ${entry.userId} [${status}]`);
    
    // Safe PostHog capture for successful posting
    try {
      posthogClient.capture({
        distinctId: txn.userId,
        event: 'transaction_posted',
        properties: {
          txn_ref: txn.txn_ref,
          amount: txn.amount,
          type: txn.type,
          status: status
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed for transaction posting:', posthogError.message);
    }

    return entry;
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

function getPendingTransactions() {
  try {
    return ledger.filter(t => t.status === 'pending');
  } catch (error) {
    console.error('Failed to get pending transactions:', error);
    throw new LedgerError('Failed to retrieve pending transactions', 'QUERY_FAILED');
  }
}

function getDelayedTransactions() {
  try {
    return ledger.filter(t => t.status === 'delayed');
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

    const pending = ledger.filter(t => t.status === 'pending');
    if (pending.length === 0 && !force) {
      return { settled: [], message: 'No pending transactions to settle' };
    }

    const settled = [];
    const settlementTimestamp = new Date().toISOString();
    
    for (let txn of ledger) {
      if (txn.status === 'pending') {
        txn.settled = true;
        txn.status = 'completed';
        txn.settled_at = settlementTimestamp;
        txn.settled_by = authorizedBy;
        settled.push({ ...txn }); // Return copy for safety
      }
    }

    await saveLedger();
    
    // Safe telemetry capture
    try {
      posthogClient.capture({
        distinctId: 'system',
        event: 'settlement_completed',
        properties: {
          transactions_settled: settled.length,
          total_amount: settled.reduce((sum, t) => sum + t.amount, 0),
          authorized_by: authorizedBy,
          timestamp: settlementTimestamp
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed for settlement:', posthogError.message);
    }

    console.log(`✅ Settlement completed: ${settled.length} transactions by ${authorizedBy}`);
    return { settled, settlement_timestamp: settlementTimestamp };
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

function getLedger(filters = {}) {
  try {
    let filtered = [...ledger]; // Return copy for safety
    
    if (filters.userId) {
      filtered = filtered.filter(t => t.userId === filters.userId);
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.start_date) {
      filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(filters.start_date));
    }
    if (filters.end_date) {
      filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(filters.end_date));
    }
    
    return filtered;
  } catch (error) {
    console.error('Failed to get ledger:', error);
    throw new LedgerError('Failed to retrieve ledger data', 'QUERY_FAILED');
  }
}

function getBanks() {
  try {
    return [...banks]; // Return copy for safety
  } catch (error) {
    console.error('Failed to get banks:', error);
    throw new LedgerError('Failed to retrieve banks data', 'QUERY_FAILED');
  }
}

function getReserve() {
  try {
    return { ...reserve }; // Return copy for safety
  } catch (error) {
    console.error('Failed to get reserve:', error);
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

    const oldReserve = { ...reserve };
    reserve.total = amount;
    reserve.available = amount;
    
    await saveReserve();
    
    // Safe telemetry capture
    try {
      posthogClient.capture({
        distinctId: 'system',
        event: 'reserve_updated',
        properties: {
          old_total: oldReserve.total,
          new_total: reserve.total,
          authorized_by: authorizedBy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (posthogError) {
      console.warn('PostHog capture failed for reserve update:', posthogError.message);
    }

    console.log(`💰 Reserve updated: R${oldReserve.total} → R${reserve.total} by ${authorizedBy}`);
    return reserve;
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
  // For testability
  _saveLedger: saveLedger,
  _saveBanks: saveBanks,
  _saveReserve: saveReserve,
  _initializeLedgerSystem: initializeLedgerSystem
};
