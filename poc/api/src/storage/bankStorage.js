const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const BANKS_DIR = path.join(__dirname, '../data/banks');
const CLIENTS_DIR = path.join(__dirname, '../data/clients');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(BANKS_DIR, { recursive: true });
    await fs.mkdir(CLIENTS_DIR, { recursive: true });
    
    // Create bank-specific transaction directories
    const bankDirs = await fs.readdir(BANKS_DIR);
    for (const bankDir of bankDirs) {
      if (bankDir.endsWith('.json')) continue;
      await fs.mkdir(path.join(BANKS_DIR, bankDir, 'transactions'), { recursive: true });
      await fs.mkdir(path.join(BANKS_DIR, bankDir, 'settlements'), { recursive: true });
    }
  } catch (error) {
    logger.error('Failed to ensure directories', { error: error.message });
  }
}

// Bank storage functions
class BankStorage {
  
  // Register a new bank
  static async registerBank(bankData) {
    try {
      const bankId = uuidv4();
      const bankCode = bankData.bankCode;
      
      const bank = {
        id: bankId,
        ...bankData,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        apiKeys: {
          primary: `bank_${bankCode}_${uuidv4().replace(/-/g, '')}`,
          secondary: null
        },
        settings: {
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
        },
        metrics: {
          totalClients: 0,
          totalTransactions: 0,
          totalVolume: 0,
          avgTransactionSize: 0,
          lastTransactionDate: null
        }
      };

      // Create bank directory structure
      const bankDir = path.join(BANKS_DIR, bankCode);
      await fs.mkdir(bankDir, { recursive: true });
      await fs.mkdir(path.join(bankDir, 'transactions'), { recursive: true });
      await fs.mkdir(path.join(bankDir, 'settlements'), { recursive: true });
      await fs.mkdir(path.join(bankDir, 'clients'), { recursive: true });
      
      // Save bank data
      const bankFile = path.join(BANKS_DIR, `${bankCode}.json`);
      await fs.writeFile(bankFile, JSON.stringify(bank, null, 2));
      
      // Create initial reserve for the bank
      const reserveFile = path.join(bankDir, 'reserve.json');
      const initialReserve = {
        bankCode,
        totalReserve: 1000000, // R1M initial reserve for POC
        availableReserve: 1000000,
        currency: 'ZAR',
        lastUpdated: new Date().toISOString(),
        transactions: []
      };
      await fs.writeFile(reserveFile, JSON.stringify(initialReserve, null, 2));
      
      logger.audit('Bank registered successfully', {
        bankId,
        bankCode,
        bankName: bankData.bankName,
        adminEmail: bankData.adminUser.email,
        event_type: 'bank_registration'
      });

      return { bankId, bankCode, apiKey: bank.apiKeys.primary };
      
    } catch (error) {
      logger.error('Bank registration failed', {
        error: error.message,
        bankCode: bankData.bankCode,
        event_type: 'bank_registration_failed'
      });
      throw error;
    }
  }

  // Get bank by code
  static async getBankByCode(bankCode) {
    try {
      const bankFile = path.join(BANKS_DIR, `${bankCode}.json`);
      const bankData = await fs.readFile(bankFile, 'utf8');
      return JSON.parse(bankData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  // Update bank data
  static async updateBank(bankCode, updateData) {
    try {
      const bank = await this.getBankByCode(bankCode);
      if (!bank) {
        throw new Error('Bank not found');
      }

      const updatedBank = {
        ...bank,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      const bankFile = path.join(BANKS_DIR, `${bankCode}.json`);
      await fs.writeFile(bankFile, JSON.stringify(updatedBank, null, 2));
      
      return updatedBank;
    } catch (error) {
      logger.error('Bank update failed', {
        error: error.message,
        bankCode,
        event_type: 'bank_update_failed'
      });
      throw error;
    }
  }

  // Authenticate bank
  static async authenticateBank(email, bankCode, authToken) {
    try {
      const bank = await this.getBankByCode(bankCode);
      if (!bank) {
        return null;
      }

      // For POC, we'll use API key as auth token
      if (authToken !== bank.apiKeys.primary && authToken !== bank.apiKeys.secondary) {
        return null;
      }

      // Check if admin email matches
      if (bank.adminUser.email !== email) {
        return null;
      }

      // Update last login
      await this.updateBank(bankCode, { lastLogin: new Date().toISOString() });

      return {
        bankId: bank.id,
        bankCode: bank.bankCode,
        bankName: bank.bankName,
        adminUser: bank.adminUser,
        status: bank.status
      };

    } catch (error) {
      logger.error('Bank authentication failed', {
        error: error.message,
        email,
        bankCode,
        event_type: 'bank_auth_failed'
      });
      return null;
    }
  }

  // Get all banks (admin function)
  static async getAllBanks() {
    try {
      const bankFiles = await fs.readdir(BANKS_DIR);
      const banks = [];

      for (const file of bankFiles) {
        if (file.endsWith('.json')) {
          const bankData = await fs.readFile(path.join(BANKS_DIR, file), 'utf8');
          const bank = JSON.parse(bankData);
          // Remove sensitive data
          delete bank.apiKeys;
          banks.push(bank);
        }
      }

      return banks;
    } catch (error) {
      logger.error('Failed to get all banks', { error: error.message });
      throw error;
    }
  }

  // Get bank metrics
  static async getBankMetrics(bankCode) {
    try {
      const bank = await this.getBankByCode(bankCode);
      if (!bank) {
        throw new Error('Bank not found');
      }

      // Get transaction data
      const transactionFile = path.join(BANKS_DIR, bankCode, 'transactions', 'ledger.json');
      let transactions = [];
      try {
        const transactionData = await fs.readFile(transactionFile, 'utf8');
        transactions = JSON.parse(transactionData);
      } catch {
        // No transactions yet
      }

      // Get client data
      const clientsDir = path.join(BANKS_DIR, bankCode, 'clients');
      let clientCount = 0;
      try {
        const clientFiles = await fs.readdir(clientsDir);
        clientCount = clientFiles.filter(f => f.endsWith('.json')).length;
      } catch {
        // No clients yet
      }

      // Calculate metrics
      const totalTransactions = transactions.length;
      const totalVolume = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
      const avgTransactionSize = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

      const metrics = {
        totalClients: clientCount,
        totalTransactions,
        totalVolume,
        avgTransactionSize,
        lastTransactionDate: transactions.length > 0 ? transactions[transactions.length - 1].received_at : null,
        dailyMetrics: this.calculateDailyMetrics(transactions),
        weeklyMetrics: this.calculateWeeklyMetrics(transactions)
      };

      return metrics;

    } catch (error) {
      logger.error('Failed to get bank metrics', {
        error: error.message,
        bankCode,
        event_type: 'metrics_failed'
      });
      throw error;
    }
  }

  // Helper: Calculate daily metrics
  static calculateDailyMetrics(transactions) {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(txn => 
      txn.received_at && txn.received_at.startsWith(today)
    );

    return {
      count: todayTransactions.length,
      volume: todayTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0),
      avgSize: todayTransactions.length > 0 ? 
        todayTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0) / todayTransactions.length : 0
    };
  }

  // Helper: Calculate weekly metrics
  static calculateWeeklyMetrics(transactions) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();

    const weekTransactions = transactions.filter(txn => 
      txn.received_at && txn.received_at >= weekAgoStr
    );

    return {
      count: weekTransactions.length,
      volume: weekTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0),
      avgSize: weekTransactions.length > 0 ? 
        weekTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0) / weekTransactions.length : 0
    };
  }
}

// Initialize directories on module load
ensureDirectories().catch(err => {
  logger.error('Failed to initialize bank storage directories', { error: err.message });
});

module.exports = BankStorage;