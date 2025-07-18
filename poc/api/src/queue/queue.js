// queue.js
const txQueue = [];
const { posthogClient } = require('../posthog/posthog');

function addToQueue(txn) {
  txQueue.push(txn);
  console.log(`📥 Queued: ${txn.txn_ref} | Amount: R${txn.amount}`);
  posthogClient.capture({
    distinctId: txn.userId || 'unknown',
    event: 'queue_item_added',
    properties: {
      txn_ref: txn.txn_ref,
      amount: txn.amount
    }
  });
}

function processQueue(callback) {
  const intervalId = setInterval(() => {
    while (txQueue.length > 0) {
      const txn = txQueue.shift();
      callback(txn);
      posthogClient.capture({
        distinctId: txn.userId || 'unknown',
        event: 'queue_item_processed',
        properties: {
          txn_ref: txn.txn_ref,
          amount: txn.amount
        }
      });
    }
  }, 1000); // 1s interval
  return intervalId;
}

function clearQueue() {
  txQueue.length = 0;
}

module.exports = {
  addToQueue,
  processQueue,
  clearQueue
};
