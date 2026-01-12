const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createTestTransactions() {
  try {
    console.log('🔄 Creating test transactions for weekend settlement testing...');

    // Get the first available bank (your newly created bank)
    const bank = await prisma.bank.findFirst({
      where: { status: 'active' }
    });

    if (!bank) {
      console.error('❌ No active bank found. Please create a bank first.');
      return;
    }

    console.log(`✅ Using bank: ${bank.bankName} (${bank.bankCode})`);

    // Create test transactions with different statuses
    const testTransactions = [
      {
        txnRef: `TXN_${Date.now()}_001`,
        userId: 'test_user_1',
        amount: 1500.00,
        type: 'debit',
        currency: 'ZAR',
        description: 'Weekend settlement test transaction 1',
        sender: 'Test Sender Account',
        receiver: 'Test Receiver Account',
        senderBank: bank.bankName,
        receiverBank: 'Test Bank B',
        status: 'pending',
        metadata: JSON.stringify({
          ip_address: '127.0.0.1',
          session_id: 'test_session_1',
          user_agent: 'Test Script',
          device_fingerprint: 'test_device_1'
        })
      },
      {
        txnRef: `TXN_${Date.now()}_002`,
        userId: 'test_user_2',
        amount: 2750.50,
        type: 'credit',
        currency: 'ZAR',
        description: 'Weekend settlement test transaction 2',
        sender: 'Test Sender Account 2',
        receiver: 'Test Receiver Account 2',
        senderBank: 'Test Bank C',
        receiverBank: bank.bankName,
        status: 'pending',
        metadata: JSON.stringify({
          ip_address: '127.0.0.1',
          session_id: 'test_session_2',
          user_agent: 'Test Script',
          device_fingerprint: 'test_device_2'
        })
      },
      {
        txnRef: `TXN_${Date.now()}_003`,
        userId: 'test_user_3',
        amount: 890.25,
        type: 'debit',
        currency: 'ZAR',
        description: 'Weekend settlement test transaction 3',
        sender: 'Test Sender Account 3',
        receiver: 'Test Receiver Account 3',
        senderBank: bank.bankName,
        receiverBank: 'Test Bank D',
        status: 'pending',
        metadata: JSON.stringify({
          ip_address: '127.0.0.1',
          session_id: 'test_session_3',
          user_agent: 'Test Script',
          device_fingerprint: 'test_device_3'
        })
      }
    ];

    // Insert transactions
    const createdTransactions = [];
    for (const txn of testTransactions) {
      const created = await prisma.transaction.create({
        data: {
          ...txn,
          timestamp: new Date(),
          settled: false,
          settledAt: null,
          settledBy: null
        }
      });
      createdTransactions.push(created);
      console.log(`✅ Created transaction: ${created.txnRef} - R${created.amount}`);
    }

    console.log(`\n🎉 Successfully created ${createdTransactions.length} test transactions`);
    console.log('📊 Transaction Summary:');
    createdTransactions.forEach(txn => {
      console.log(`   • ${txn.txnRef}: R${txn.amount} (${txn.type})`);
    });

    const totalAmount = createdTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    console.log(`\n💰 Total pending amount: R${totalAmount.toFixed(2)}`);
    console.log('\n🚀 Ready for weekend settlement testing!');

  } catch (error) {
    console.error('❌ Error creating test transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestTransactions();
