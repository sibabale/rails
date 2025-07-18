const webhookRouter = require('./webhook');
const ledgerRouter = require('./ledger');
const transactionRouter = require('./transaction');
const healthRouter = require('./health');
const simulatorRouter = require('./simulator');
const dashboardRouter = require('./dashboard');

module.exports = [
  webhookRouter,
  ledgerRouter,
  transactionRouter,
  healthRouter,
  simulatorRouter,
  dashboardRouter
]; 