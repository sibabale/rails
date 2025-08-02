const axios = require('axios');

const BANKS = ["ABSA", "NEDBANK", "CAPITEC", "FNB", "STANDARD"];
const ENDPOINT = process.env.SIM_WEBHOOK_ENDPOINT || "http://localhost:8000/api/webhook";

function randomAmount(min = 50, max = 10000) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

function randomAccount() {
  return `ZA${Math.floor(100000 + Math.random() * 900000)}`;
}

function randomBank() {
  return BANKS[Math.floor(Math.random() * BANKS.length)];
}

function createTransaction() {
  const sender = randomAccount();
  const receiver = randomAccount();
  const payload = {
    txn_ref: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
    sender_account: sender,
    receiver_account: receiver,
    senderBank: randomBank(),
    receiverBank: randomBank(),
    amount: randomAmount(),
    currency: "ZAR",
    timestamp: new Date().toISOString(),
    metadata: {
      channel: "mobile_app",
      purpose: "peer_transfer"
    }
  };
  return payload;
}

async function sendTransaction(i) {
  const txn = createTransaction();
  try {
    const response = await axios.post(ENDPOINT, txn);
    console.log(`✅ [${i}] Sent ${txn.txn_ref} | Status: ${response.status} | Amount: R${txn.amount}`);
  } catch (error) {
    console.error(`❌ [${i}] Failed to send ${txn.txn_ref}:`, error.message);
  }
}

async function runSimulation(count = 10, interval = 1000) {
  for (let i = 1; i <= count; i++) {
    await sendTransaction(i);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

module.exports = { runSimulation }; 