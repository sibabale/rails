const express = require('express');
const {
  getActiveBanks,
  getReservePool,
  getTotalRevenue,
  getCompletionRate,
  getRevenueOverview,
  getBankPerformance,
  getReserveExhausted,
  getBankDistribution,
  getActiveTransactions,
  getTodaysTransactionLogs,
  getRecentTransactionsForBank,
  getProcessingFeesThisWeekend,
  getMondayClearingPreparation
} = require('../metrics/metrics');

const router = express.Router();

router.get('/dashboard/metrics', (req, res) => {
  const activeBanks = getActiveBanks();
  const bankDistributions = activeBanks.map(b => getBankDistribution(b.name));
  const transactionLogs = activeBanks.map(b => ({
    bank: b.name,
    logs: getRecentTransactionsForBank(b.name, 5)
  }));
  res.json({
    activeBanks: activeBanks.length,
    totalRevenue: getTotalRevenue(),
    completionRate: getCompletionRate(),
    revenueOverview: getRevenueOverview(6),
    transactionLogs,
    activeBanksList: activeBanks,
    bankDistributions,
    activeTransactions: getActiveTransactions(),
    settlementOverview: {
      reservePool: getReservePool(),
      bankPerformance: getBankPerformance(),
      reserveExhausted: getReserveExhausted(),
      todaysTransactionLogs: getTodaysTransactionLogs(),
      processingFeesThisWeekend: getProcessingFeesThisWeekend()
    },
    mondayClearingPreparation: getMondayClearingPreparation()
  });
});

module.exports = router; 