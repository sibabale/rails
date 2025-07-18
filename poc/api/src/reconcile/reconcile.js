// batchReconcile.js
const { getPendingTransactions, settleTransactions } = require("../ledger/ledger");
const { posthogClient } = require('../posthog/posthog');

function runSettlement() {
  const pending = getPendingTransactions();
  if (pending.length === 0) {
    console.log("✅ All transactions already settled.");
    return;
  }

  console.log("🔄 Settling pending transactions...");
  const settled = settleTransactions();

  posthogClient.capture({
    distinctId: 'system',
    event: 'reconciliation_run',
    properties: {
      settled_count: settled.length
    }
  });

  // Group by bank for mock netting
  const bankMap = {};

  settled.forEach(txn => {
    const key = txn.sender + "→" + txn.receiver;
    if (!bankMap[key]) bankMap[key] = 0;
    bankMap[key] += txn.amount;
  });

  console.log("💼 Final Settlement Ledger:");
  for (let key in bankMap) {
    console.log(`• ${key} => R${bankMap[key].toFixed(2)}`);
  }
}

module.exports = { runSettlement };
