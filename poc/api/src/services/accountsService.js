const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class AccountService {
    async createAccount(bankId, accountData) {
        try {
            // Check if the account number already exists
            const existingAccount = await prisma.account.findUnique({
                where: { accountNumber: accountData.accountNumber }
            });

            if (existingAccount) {
                throw new Error('Account number already exists');
            }

            const account = await prisma.account.create({
                data: {
                    accountNumber: accountData.accountNumber,
                    ownerEmail: accountData.ownerEmail,
                    ownerName: accountData.ownerName,
                    balance: accountData.initialBalance || 0,
                    currency: accountData.currency || 'ZAR',
                    bankId: bankId,
                    type: 'SAVINGS'
                }
            });

            logger.audit('Account created', {
                accountId: account.id,
                accountNumber: account.accountNumber,
                bankId,
                event_type: 'account_created'
            });

            return { success: true, account };
        } catch (error) {
            logger.error('Failed to create account', {
                error: error.message,
                bankId,
                event_type: 'account_creation_error'
            });
            throw error;
        }
    }

    async getBankAccounts(bankId) {
        return await prisma.account.findMany({
            where: { bankId }
        });
    }
}

module.exports = new AccountService();