const { getLedger, getBanks, getReserve, getDelayedTransactions } = require('../ledger/ledger');

function getActiveBanks() {
  return getBanks().filter(b => b.connected);
}

function getCompletionRate() {
  const ledger = getLedger();
  const total = ledger.length;
  if (total === 0) return 0;
  const completed = ledger.filter(t => t.status === 'completed').length;
  return (completed / total) * 100;
}

function getTotalRevenue() {
  const ledger = getLedger();
  return ledger.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount * 0.01, 0);
}

function getActiveTransactions() {
  const ledger = getLedger();
  return ledger.filter(t => t.status === 'pending').length;
}

function getRevenueOverview(months = 6) {
  const ledger = getLedger();
  const now = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = month.toLocaleString('default', { month: 'short', year: 'numeric' });
    const monthTxns = ledger.filter(t => {
      const txnDate = new Date(t.timestamp);
      return txnDate.getFullYear() === month.getFullYear() && txnDate.getMonth() === month.getMonth();
    });
    const revenue = monthTxns.reduce((sum, t) => sum + t.amount * 0.01, 0);
    result.push({ month: monthStr, revenue, count: monthTxns.length });
  }
  return result;
}

function getBankDistribution(senderBank) {
  const ledger = getLedger();
  const outgoing = ledger.filter(t => t.sender_bank === senderBank);
  const total = outgoing.length;
  if (total === 0) return { bank: senderBank, distribution: [], total: 0 };
  const counts = {};
  outgoing.forEach(t => {
    counts[t.receiver_bank] = (counts[t.receiver_bank] || 0) + 1;
  });
  const distribution = Object.entries(counts).map(([to, count]) => ({
    to,
    count,
    percent: Math.round((count / total) * 100)
  }));
  return { bank: senderBank, distribution, total };
}

function getRecentTransactionsForBank(bank, limit = 5, offset = 0) {
  const ledger = getLedger();
  const txns = ledger
    .filter(t => t.sender_bank === bank)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return txns.slice(offset, offset + limit);
}

// New metrics for settlement overview
function getTodaysTransactionLogs() {
  const ledger = getLedger();
  const today = new Date();
  const isToday = t => {
    const d = new Date(t.timestamp);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };
  const todays = ledger.filter(isToday);
  const completed = todays.filter(t => t.status === 'completed').length;
  return {
    total: todays.length,
    completed,
    percent: todays.length ? (completed / todays.length) * 100 : 0
  };
}

function getReserveExhausted() {
  return getDelayedTransactions().length;
}

function getBankPerformance() {
  // Current weekend completion rate vs previous weekend
  const ledger = getLedger();
  const now = new Date();
  // Get current and previous weekend (Saturday/Sunday)
  function getWeekendRange(offset = 0) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() + 6 - offset * 7); // Saturday
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1); // Sunday
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  function rateForWeekend(range) {
    const txns = ledger.filter(t => {
      const d = new Date(t.timestamp);
      return d >= range.start && d <= range.end;
    });
    if (!txns.length) return 0;
    const completed = txns.filter(t => t.status === 'completed').length;
    return (completed / txns.length) * 100;
  }
  const thisWeekend = getWeekendRange(0);
  const lastWeekend = getWeekendRange(1);
  const current = rateForWeekend(thisWeekend);
  const previous = rateForWeekend(lastWeekend);
  return {
    current,
    previous,
    change: current - previous
  };
}

function getProcessingFeesThisWeekend() {
  const ledger = getLedger();
  const now = new Date();
  function getWeekendRange(offset = 0) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() + 6 - offset * 7); // Saturday
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1); // Sunday
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const weekend = getWeekendRange(0);
  const txns = ledger.filter(t => {
    const d = new Date(t.timestamp);
    return d >= weekend.start && d <= weekend.end && t.status === 'completed';
  });
  return txns.reduce((sum, t) => sum + t.amount * 0.01, 0);
}

function getReservePool() {
  const reserve = getReserve();
  const utilized = reserve.total - reserve.available;
  const percent = reserve.total ? (utilized / reserve.total) * 100 : 0;
  return {
    total: reserve.total,
    available: reserve.available,
    utilized,
    percent
  };
}

function getMondayClearingPreparation() {
  const banks = getBanks().filter(b => b.connected);
  const ledger = getLedger();
  // For each bank, sum delayed and pending txns as settlement amount
  return banks.map(bank => {
    const delayed = ledger.filter(t => t.sender_bank === bank.name && t.status === 'delayed');
    const pending = ledger.filter(t => t.sender_bank === bank.name && t.status === 'pending');
    const amount = [...delayed, ...pending].reduce((sum, t) => sum + t.amount, 0);
    let status = 'pending';
    if (delayed.length > 0) status = 'ready';
    else if (pending.length > 0) status = 'processing';
    // Risk: high > 5M, medium > 2M, else low
    let risk = 'low';
    if (amount > 5000000) risk = 'high';
    else if (amount > 2000000) risk = 'medium';
    return {
      bank: bank.name,
      amount,
      status,
      risk
    };
  });
}

module.exports = {
  getReservePool,
  getActiveBanks,
  getTotalRevenue,
  getCompletionRate,
  getRevenueOverview,
  getBankPerformance,
  getBankDistribution,
  getReserveExhausted,
  getActiveTransactions,
  getTodaysTransactionLogs,
  getRecentTransactionsForBank,
  getProcessingFeesThisWeekend,
  getMondayClearingPreparation
}; 