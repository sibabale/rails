jest.mock('../ledger/ledger', () => ({
  getPendingTransactions: jest.fn(),
  settleTransactions: jest.fn()
}));

const { getPendingTransactions, settleTransactions } = require('../ledger/ledger');

const { runSettlement } = require('./reconcile');

describe('reconcile.js', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should log when all transactions are settled', () => {
    getPendingTransactions.mockReturnValue([]);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runSettlement();
    expect(logSpy).toHaveBeenCalledWith('✅ All transactions already settled.');
    logSpy.mockRestore();
  });

  it('should process and log settlements', () => {
    getPendingTransactions.mockReturnValue([{}]);
    settleTransactions.mockReturnValue([
      { sender: 'A', receiver: 'B', amount: 100 },
      { sender: 'A', receiver: 'B', amount: 50 },
      { sender: 'B', receiver: 'C', amount: 75 }
    ]);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runSettlement();
    expect(logSpy).toHaveBeenCalledWith('🔄 Settling pending transactions...');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Final Settlement Ledger:'));
    expect(logSpy).toHaveBeenCalledWith('• A→B => R150.00');
    expect(logSpy).toHaveBeenCalledWith('• B→C => R75.00');
    logSpy.mockRestore();
  });
}); 