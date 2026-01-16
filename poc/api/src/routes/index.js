const express = require('express');
const router = express.Router();

// Import simplified routes
const webhookRouter = require('./webhook');
const ledgerRouter = require('./ledger');
const transactionRouter = require('./transaction');
const healthRouter = require('./health');
const simulatorRouter = require('./simulator');
const dashboardRouter = require('./dashboard');
const storageRouter = require('./storage');
const banksRouter = require('./banks');
const accountsRouter = require('./accounts');
const testRouter = require('./test');

// Root API endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Rails API - 👋🌎🌍🌏',
        version: '1.0.0'
    });
});

// Mount sub-routes
router.use('/webhook', webhookRouter);
router.use('/ledger', ledgerRouter);
router.use('/transaction', transactionRouter);
router.use('/health', healthRouter);
router.use('/simulator', simulatorRouter);
router.use('/dashboard', dashboardRouter);
router.use('/storage', storageRouter);
router.use('/banks', banksRouter);
router.use('/accounts', accountsRouter);
router.use('/test', testRouter);

module.exports = router; 