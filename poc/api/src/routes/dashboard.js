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

router.get('/dashboard/metrics', async (req, res) => {
  try {
    const activeBanks = await getActiveBanks();
    const bankDistributions = await Promise.all(activeBanks.map(b => getBankDistribution(b.name)));
    const transactionLogs = await Promise.all(activeBanks.map(async b => ({
      bank: b.name,
      logs: await getRecentTransactionsForBank(b.name, 5)
    })));
    
    res.json({
      activeBanks: activeBanks.length,
      totalRevenue: await getTotalRevenue(),
      completionRate: await getCompletionRate(),
      revenueOverview: await getRevenueOverview(6),
      transactionLogs,
      activeBanksList: activeBanks,
      bankDistributions,
      activeTransactions: await getActiveTransactions(),
      settlementOverview: {
        reservePool: await getReservePool(),
        bankPerformance: await getBankPerformance(),
        reserveExhausted: await getReserveExhausted(),
        todaysTransactionLogs: await getTodaysTransactionLogs(),
        processingFeesThisWeekend: await getProcessingFeesThisWeekend()
      },
      mondayClearingPreparation: await getMondayClearingPreparation()
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 