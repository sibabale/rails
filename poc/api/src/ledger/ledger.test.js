const { postTransaction, getPendingTransactions, settleTransactions } = require('./ledger');

describe('ledger.js', () => {
  beforeEach(() => {
    // Reset the ledger by resetting the module
    jest.resetModules();
  });

  it('should post a transaction to the ledger', () => {
    const txn = { txn_ref: 'TXN1', sender_account: 'A', receiver_account: 'B', amount: 100 };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    postTransaction(txn);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Ledger: R100'));
    logSpy.mockRestore();
  });

  it('should get pending transactions', () => {
    const txn = { txn_ref: 'TXN2', sender_account: 'A', receiver_account: 'B', amount: 200 };
    postTransaction(txn);
    const pending = getPendingTransactions();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].settled).toBe(false);
  });

  it('should settle transactions', () => {
    const txn = { txn_ref: 'TXN3', sender_account: 'A', receiver_account: 'B', amount: 300 };
    postTransaction(txn);
    const settled = settleTransactions();
    expect(settled.length).toBeGreaterThan(0);
    expect(settled[0].settled).toBe(true);
  });
}); 