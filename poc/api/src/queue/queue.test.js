const { addToQueue, processQueue, clearQueue } = require('./queue');

describe('queue.js', () => {
  afterEach(() => {
    clearQueue();
    jest.clearAllTimers();
  });

  it('should add a transaction to the queue', () => {
    const txn = { txn_ref: 'TXN1', amount: 100 };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    addToQueue(txn);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Queued: TXN1'));
    logSpy.mockRestore();
  });

  it('should process transactions in the queue', done => {
    const txn = { txn_ref: 'TXN2', amount: 200 };
    addToQueue(txn);
    const intervalId = processQueue((processedTxn) => {
      expect(processedTxn).toEqual(txn);
      clearInterval(intervalId);
      done();
    });
  });
}); 