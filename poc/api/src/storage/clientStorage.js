const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const BANKS_DIR = path.join(__dirname, '../data/banks');

class ClientStorage {

  // Register a new client for a bank
  static async registerClient(bankCode, clientData) {
    try {
      const clientId = uuidv4();
      const clientsDir = path.join(BANKS_DIR, bankCode, 'clients');
      
      // Ensure clients directory exists
      await fs.mkdir(clientsDir, { recursive: true });

      const client = {
        id: clientId,
        bankCode,
        ...clientData,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        transactionHistory: [],
        balances: {
          available: clientData.accountDetails.initialBalance || 0,
          pending: 0,
          total: clientData.accountDetails.initialBalance || 0
        },
        limits: {
          daily: {
            remaining: clientData.accountDetails.dailyTransactionLimit,
            used: 0,
            lastReset: new Date().toISOString().split('T')[0]
          },
          monthly: {
            remaining: clientData.accountDetails.monthlyTransactionLimit,
            used: 0,
            lastReset: new Date().toISOString().substr(0, 7) // YYYY-MM
          }
        }
      };

      const clientFile = path.join(clientsDir, `${clientData.clientId}.json`);
      await fs.writeFile(clientFile, JSON.stringify(client, null, 2));

      logger.audit('Client registered successfully', {
        clientId,
        clientIdCode: clientData.clientId,
        bankCode,
        clientName: clientData.clientName,
        accountNumber: clientData.accountDetails.accountNumber,
        event_type: 'client_registration'
      });

      return client;

    } catch (error) {
      logger.error('Client registration failed', {
        error: error.message,
        bankCode,
        clientId: clientData.clientId,
        event_type: 'client_registration_failed'
      });
      throw error;
    }
  }

  // Get client by ID
  static async getClientById(bankCode, clientId) {
    try {
      const clientFile = path.join(BANKS_DIR, bankCode, 'clients', `${clientId}.json`);
      const clientData = await fs.readFile(clientFile, 'utf8');
      return JSON.parse(clientData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  // Get all clients for a bank
  static async getClientsByBank(bankCode, options = {}) {
    try {
      const clientsDir = path.join(BANKS_DIR, bankCode, 'clients');
      const clientFiles = await fs.readdir(clientsDir);
      const clients = [];

      for (const file of clientFiles) {
        if (file.endsWith('.json')) {
          const clientData = await fs.readFile(path.join(clientsDir, file), 'utf8');
          const client = JSON.parse(clientData);
          
          // Apply filters
          if (options.status && client.status !== options.status) {
            continue;
          }
          if (options.clientType && client.clientType !== options.clientType) {
            continue;
          }

          clients.push(client);
        }
      }

      // Apply sorting
      if (options.sortBy === 'name') {
        clients.sort((a, b) => a.clientName.localeCompare(b.clientName));
      } else if (options.sortBy === 'balance') {
        clients.sort((a, b) => b.balances.total - a.balances.total);
      } else {
        // Default: sort by creation date (newest first)
        clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      // Apply pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const paginatedClients = clients.slice(offset, offset + limit);

      return {
        clients: paginatedClients,
        pagination: {
          total: clients.length,
          limit,
          offset,
          hasMore: offset + limit < clients.length
        }
      };

    } catch (error) {
      logger.error('Failed to get clients by bank', {
        error: error.message,
        bankCode,
        event_type: 'get_clients_failed'
      });
      throw error;
    }
  }

  // Update client
  static async updateClient(bankCode, clientId, updateData) {
    try {
      const client = await this.getClientById(bankCode, clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      const updatedClient = {
        ...client,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      const clientFile = path.join(BANKS_DIR, bankCode, 'clients', `${clientId}.json`);
      await fs.writeFile(clientFile, JSON.stringify(updatedClient, null, 2));

      logger.audit('Client updated', {
        clientId,
        bankCode,
        updateFields: Object.keys(updateData),
        event_type: 'client_update'
      });

      return updatedClient;

    } catch (error) {
      logger.error('Client update failed', {
        error: error.message,
        bankCode,
        clientId,
        event_type: 'client_update_failed'
      });
      throw error;
    }
  }

  // Update client balance (for transactions)
  static async updateClientBalance(bankCode, clientId, amount, type = 'debit') {
    try {
      const client = await this.getClientById(bankCode, clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      const newBalances = { ...client.balances };
      
      if (type === 'debit') {
        newBalances.available -= amount;
        newBalances.total -= amount;
      } else if (type === 'credit') {
        newBalances.available += amount;
        newBalances.total += amount;
      }

      // Check for negative balance
      if (newBalances.available < 0) {
        throw new Error('Insufficient funds');
      }

      // Update daily/monthly limits
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substr(0, 7);

      const limits = { ...client.limits };
      
      // Reset daily limits if new day
      if (limits.daily.lastReset !== today) {
        limits.daily.used = 0;
        limits.daily.remaining = client.accountDetails.dailyTransactionLimit;
        limits.daily.lastReset = today;
      }

      // Reset monthly limits if new month
      if (limits.monthly.lastReset !== thisMonth) {
        limits.monthly.used = 0;
        limits.monthly.remaining = client.accountDetails.monthlyTransactionLimit;
        limits.monthly.lastReset = thisMonth;
      }

      // Check limits
      if (type === 'debit') {
        if (limits.daily.remaining < amount) {
          throw new Error('Daily transaction limit exceeded');
        }
        if (limits.monthly.remaining < amount) {
          throw new Error('Monthly transaction limit exceeded');
        }

        limits.daily.used += amount;
        limits.daily.remaining -= amount;
        limits.monthly.used += amount;
        limits.monthly.remaining -= amount;
      }

      const updatedClient = await this.updateClient(bankCode, clientId, {
        balances: newBalances,
        limits,
        lastActivity: new Date().toISOString()
      });

      return updatedClient;

    } catch (error) {
      logger.error('Client balance update failed', {
        error: error.message,
        bankCode,
        clientId,
        amount,
        type,
        event_type: 'balance_update_failed'
      });
      throw error;
    }
  }

  // Get client metrics
  static async getClientMetrics(bankCode, clientId) {
    try {
      const client = await this.getClientById(bankCode, clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Calculate transaction metrics from transaction history
      const transactions = client.transactionHistory || [];
      const totalTransactions = transactions.length;
      const totalVolume = transactions.reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0);
      const avgTransactionSize = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

      // Calculate monthly activity
      const thisMonth = new Date().toISOString().substr(0, 7);
      const monthlyTransactions = transactions.filter(txn => 
        txn.timestamp && txn.timestamp.startsWith(thisMonth)
      );

      const metrics = {
        accountBalance: client.balances.total,
        availableBalance: client.balances.available,
        pendingBalance: client.balances.pending,
        totalTransactions,
        totalVolume,
        avgTransactionSize,
        monthlyActivity: {
          transactions: monthlyTransactions.length,
          volume: monthlyTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)
        },
        limits: client.limits,
        lastActivity: client.lastActivity,
        accountAge: Math.floor((new Date() - new Date(client.createdAt)) / (1000 * 60 * 60 * 24)) // days
      };

      return metrics;

    } catch (error) {
      logger.error('Failed to get client metrics', {
        error: error.message,
        bankCode,
        clientId,
        event_type: 'client_metrics_failed'
      });
      throw error;
    }
  }

  // Search clients
  static async searchClients(bankCode, searchTerm, options = {}) {
    try {
      const { clients } = await this.getClientsByBank(bankCode, options);
      
      const filteredClients = clients.filter(client => {
        const searchLower = searchTerm.toLowerCase();
        return (
          client.clientName.toLowerCase().includes(searchLower) ||
          client.clientId.toLowerCase().includes(searchLower) ||
          client.contactEmail.toLowerCase().includes(searchLower) ||
          client.accountDetails.accountNumber.includes(searchTerm)
        );
      });

      return {
        clients: filteredClients,
        searchTerm,
        totalFound: filteredClients.length
      };

    } catch (error) {
      logger.error('Client search failed', {
        error: error.message,
        bankCode,
        searchTerm,
        event_type: 'client_search_failed'
      });
      throw error;
    }
  }
}

module.exports = ClientStorage;