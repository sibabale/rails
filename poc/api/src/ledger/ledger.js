// ledger.js
const fs = require('fs');
const path = require('path');
const { posthogClient } = require('../posthog/posthog');

const LEDGER_FILE = path.join(__dirname, 'ledger.json');
const BANKS_FILE = path.join(__dirname, 'banks.json');
const RESERVE_FILE = path.join(__dirname, 'reserve.json');

let ledger = [];
let banks = [];
let reserve = { total: 25000000, available: 25000000 }; // R25M default

// Load ledger from file
function loadLedger() {
  if (fs.existsSync(LEDGER_FILE)) {
    ledger = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
  }
}

// Save ledger to file
function saveLedger() {
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
}

// Load banks from file
function loadBanks() {
  if (fs.existsSync(BANKS_FILE)) {
    banks = JSON.parse(fs.readFileSync(BANKS_FILE, 'utf8'));
  } else {
    banks = [
      { name: 'FNB', connected: true },
      { name: 'ABSA', connected: true },
      { name: 'NEDBANK', connected: true },
      { name: 'CAPITEC', connected: true },
      { name: 'STANDARD', connected: false }
    ];
    saveBanks();
  }
}

// Save banks to file
function saveBanks() {
  fs.writeFileSync(BANKS_FILE, JSON.stringify(banks, null, 2));
}

// Load reserve from file
function loadReserve() {
  if (fs.existsSync(RESERVE_FILE)) {
    reserve = JSON.parse(fs.readFileSync(RESERVE_FILE, 'utf8'));
  }
}

// Save reserve to file
function saveReserve() {
  fs.writeFileSync(RESERVE_FILE, JSON.stringify(reserve, null, 2));
}

// Initialize data
loadLedger();
loadBanks();
loadReserve();

function postTransaction(txn) {
  let status = 'pending';
  // Check reserve
  if (reserve.available >= txn.amount) {
    reserve.available -= txn.amount;
    saveReserve();
  } else {
    status = 'delayed';
    posthogClient.capture({
      distinctId: txn.userId || 'unknown',
      event: 'transaction_failed',
      properties: {
        txn_ref: txn.txn_ref,
        amount: txn.amount,
        reason: 'insufficient_reserve'
      }
    });
  }
  const entry = {
    txn_ref: txn.txn_ref,
    sender: txn.sender_account,
    receiver: txn.receiver_account,
    sender_bank: txn.sender_bank,
    receiver_bank: txn.receiver_bank,
    amount: txn.amount,
    settled: false,
    status,
    timestamp: new Date().toISOString()
  };
  ledger.push(entry);
  saveLedger();
  console.log(`📒 Ledger: R${entry.amount} from ${entry.sender} → ${entry.receiver} [${status}]`);
  posthogClient.capture({
    distinctId: txn.userId || 'unknown',
    event: 'transaction_posted',
    properties: {
      amount: txn.amount,
      status: 'success'
    }
  });
}

function getPendingTransactions() {
  return ledger.filter(t => t.status === 'pending');
}

function getDelayedTransactions() {
  return ledger.filter(t => t.status === 'delayed');
}

function settleTransactions() {
  const settled = [];
  for (let txn of ledger) {
    if (txn.status === 'pending') {
      txn.settled = true;
      txn.status = 'completed';
      settled.push(txn);
    }
  }
  saveLedger();
  return settled;
}

function getLedger() {
  return ledger;
}

function getBanks() {
  return banks;
}

function getReserve() {
  return reserve;
}

function setReserve(amount) {
  reserve.total = amount;
  reserve.available = amount;
  saveReserve();
}

module.exports = {
  postTransaction,
  getPendingTransactions,
  getDelayedTransactions,
  settleTransactions,
  getLedger,
  getBanks,
  getReserve,
  setReserve,
  // For testability
  _saveLedger: saveLedger,
  _saveBanks: saveBanks,
  _saveReserve: saveReserve
};
