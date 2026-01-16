const express = require('express');
const router = express.Router();
const accountService = require('../services/accountsService');
const { createAccountSchema } = require('../validation/accountsSchemas');
const authService = require('../services/authService');
const logger = require('../utils/logger');

// Middleware to verify bank token
const verifyBankToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Bearer token required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    req.bank = decoded; // Contains bankId, bankCode, etc.
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

// Create an account
router.post('/', verifyBankToken, async (req, res) => {
  const { error, value } = createAccountSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }

  try {
    const result = await accountService.createAccount(req.bank.bankId, value);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List bank accounts
router.get('/', verifyBankToken, async (req, res) => {
  try {
    const accounts = await accountService.getBankAccounts(req.bank.bankId);
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

module.exports = router;
