const metrics = require('./metrics');

jest.mock('../ledger/ledger', () => ({
  getLedger: jest.fn(),
  getBanks: jest.fn(),
  getReserve: jest.fn(),
  getDelayedTransactions: jest.fn()
}));

const { getLedger, getBanks, getReserve, getDelayedTransactions } = require('../ledger/ledger');

describe('metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getActiveBanks returns only connected banks', () => {
    getBanks.mockReturnValue([
      { name: 'A', connected: true },
      { name: 'B', connected: false }
    ]);
    expect(metrics.getActiveBanks()).toEqual([{ name: 'A', connected: true }]);
  });

  it('getCompletionRate returns correct percentage', () => {
    getLedger.mockReturnValue([
      { status: 'completed' },
      { status: 'pending' },
      { status: 'completed' }
    ]);
    expect(metrics.getCompletionRate()).toBeCloseTo(66.666, 1);
  });

  it('getTotalRevenue sums 1% of completed transactions', () => {
    getLedger.mockReturnValue([
      { status: 'completed', amount: 100 },
      { status: 'pending', amount: 200 },
      { status: 'completed', amount: 300 }
    ]);
    expect(metrics.getTotalRevenue()).toBeCloseTo(4);
  });

  it('getActiveTransactions counts pending', () => {
    getLedger.mockReturnValue([
      { status: 'pending' },
      { status: 'completed' },
      { status: 'pending' }
    ]);
    expect(metrics.getActiveTransactions()).toBe(2);
  });

  it('getRevenueOverview aggregates by month', () => {
    const now = new Date();
    getLedger.mockReturnValue([
      { status: 'completed', amount: 100, timestamp: now.toISOString() },
      { status: 'completed', amount: 200, timestamp: now.toISOString() }
    ]);
    const overview = metrics.getRevenueOverview(1);
    expect(overview[0].revenue).toBeCloseTo(3);
    expect(overview[0].count).toBe(2);
  });

  it('getBankDistribution returns correct distribution', () => {
    getLedger.mockReturnValue([
      { sender_bank: 'A', receiver_bank: 'B' },
      { sender_bank: 'A', receiver_bank: 'B' },
      { sender_bank: 'A', receiver_bank: 'C' }
    ]);
    const dist = metrics.getBankDistribution('A');
    expect(dist.total).toBe(3);
    expect(dist.distribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ to: 'B', count: 2 }),
        expect.objectContaining({ to: 'C', count: 1 })
      ])
    );
  });

  it('getRecentTransactionsForBank returns most recent N', () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000);
    getLedger.mockReturnValue([
      { sender_bank: 'A', timestamp: earlier.toISOString() },
      { sender_bank: 'A', timestamp: now.toISOString() },
      { sender_bank: 'B', timestamp: now.toISOString() }
    ]);
    const txns = metrics.getRecentTransactionsForBank('A', 1);
    expect(txns.length).toBe(1);
    expect(txns[0].timestamp).toBe(now.toISOString());
  });

  it('getTodaysTransactionLogs returns today\'s stats', () => {
    const now = new Date();
    getLedger.mockReturnValue([
      { status: 'completed', timestamp: now.toISOString() },
      { status: 'pending', timestamp: now.toISOString() },
      { status: 'completed', timestamp: new Date(now.getTime() - 86400000).toISOString() }
    ]);
    const result = metrics.getTodaysTransactionLogs();
    expect(result.total).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.percent).toBeCloseTo(50);
  });

  it('getReserveExhausted returns delayed count', () => {
    getDelayedTransactions.mockReturnValue([{}, {}, {}]);
    expect(metrics.getReserveExhausted()).toBe(3);
  });

  it('getBankPerformance returns current and previous weekend rates', () => {
    // Set up Saturday/Sunday for current and previous weekends
    const now = new Date();
    const getWeekendDate = (offsetWeeks, day) => {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + 6 - offsetWeeks * 7 + day); // Saturday=0, Sunday=1
      d.setHours(12, 0, 0, 0);
      return d;
    };
    // Current weekend: 2 completed, 1 pending
    const sat = getWeekendDate(0, 0);
    const sun = getWeekendDate(0, 1);
    // Previous weekend: 1 completed, 1 pending
    const prevSat = getWeekendDate(1, 0);
    const prevSun = getWeekendDate(1, 1);
    getLedger.mockReturnValue([
      { status: 'completed', timestamp: sat.toISOString() },
      { status: 'completed', timestamp: sun.toISOString() },
      { status: 'pending', timestamp: sun.toISOString() },
      { status: 'completed', timestamp: prevSat.toISOString() },
      { status: 'pending', timestamp: prevSun.toISOString() }
    ]);
    const perf = metrics.getBankPerformance();
    expect(perf.current).toBeCloseTo(66.666, 1);
    expect(perf.previous).toBeCloseTo(50, 1);
    expect(perf.change).toBeCloseTo(16.666, 1);
  });

  it('getProcessingFeesThisWeekend returns sum of 1% for completed this weekend', () => {
    // Set up Saturday/Sunday for current weekend
    const now = new Date();
    const getWeekendDate = (day) => {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + 6 + day); // Saturday=0, Sunday=1
      d.setHours(12, 0, 0, 0);
      return d;
    };
    const sat = getWeekendDate(0);
    const sun = getWeekendDate(1);
    getLedger.mockReturnValue([
      { status: 'completed', amount: 100, timestamp: sat.toISOString() },
      { status: 'completed', amount: 200, timestamp: sun.toISOString() },
      { status: 'pending', amount: 300, timestamp: sun.toISOString() }
    ]);
    expect(metrics.getProcessingFeesThisWeekend()).toBeCloseTo(3);
  });

  it('getReservePool returns reserve stats', () => {
    getReserve.mockReturnValue({ total: 1000, available: 400 });
    const pool = metrics.getReservePool();
    expect(pool.total).toBe(1000);
    expect(pool.available).toBe(400);
    expect(pool.utilized).toBe(600);
    expect(pool.percent).toBeCloseTo(60);
  });

  it('getMondayClearingPreparation returns correct structure', () => {
    getBanks.mockReturnValue([
      { name: 'A', connected: true },
      { name: 'B', connected: true }
    ]);
    getLedger.mockReturnValue([
      { sender_bank: 'A', status: 'delayed', amount: 100 },
      { sender_bank: 'A', status: 'pending', amount: 200 },
      { sender_bank: 'B', status: 'pending', amount: 300 }
    ]);
    const result = metrics.getMondayClearingPreparation();
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bank: 'A', amount: 300, status: 'ready', risk: 'low' }),
        expect.objectContaining({ bank: 'B', amount: 300, status: 'processing', risk: 'low' })
      ])
    );
  });
}); 