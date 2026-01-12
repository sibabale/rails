const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createBankTransactions() {
  try {
    console.log('🔄 Creating bank-specific test transactions...');

    // Get the active bank
    const bank = await prisma.bank.findFirst({
      where: { status: 'active' }
    });

    if (!bank) {
      console.error('❌ No active bank found. Please create a bank first.');
      return;
    }

    console.log(`✅ Using bank: ${bank.bankName} (${bank.bankCode})`);
    console.log(`✅ Admin email: ${bank.adminEmail}`);

    // Create test transactions associated with the bank admin
    const bankTransactions = [
      {
        txnRef: `BANK_${Date.now()}_001`,
        userId: bank.adminEmail, // Use admin email as userId
        amount: 2500.00,
        type: 'debit',
        currency: 'ZAR',
        description: 'Bank settlement test transaction 1',
        sender: 'Bank Customer A',
        receiver: 'Bank Customer B',
        senderBank: bank.bankName,
        receiverBank: 'Test Bank B',
        status: 'pending',
        metadata: JSON.stringify({
          ip_address: '127.0.0.1',
          session_id: 'bank_session_1',
          user_agent: 'Bank Test Script',
          device_fingerprint: 'bank_device_1'
        })
      },
      {
        txnRef: `BANK_${Date.now()}_002`,
        userId: bank.adminEmail, // Use admin email as userId
        amount: 1800.75,
        type: 'credit',
        currency: 'ZAR',
        description: 'Bank settlement test transaction 2',
        sender: 'Bank Customer C',
        receiver: 'Bank Customer D',
        senderBank: 'Test Bank C',
        receiverBank: bank.bankName,
        status: 'pending',
        metadata: JSON.stringify({
          ip_address: '127.0.0.1',
          session_id: 'bank_session_2',
          user_agent: 'Bank Test Script',
          device_fingerprint: 'bank_device_2'
        })
      },
      {
        txnRef: `BANK_${Date.now()}_003`,
        userId: bank.adminEmail, // Use admin email as userId
        amount: 3200.50,
        type: 'debit',
        currency: 'ZAR',
        description: 'Bank settlement test transaction 3',
        sender: 'Bank Customer E',
        receiver: 'Bank Customer F',
        senderBank: bank.bankName,
        receiverBank: 'Test Bank D',
        status: 'pending',
        metadata: JSON.stringify({
          ip_address: '127.0.0.1',
          session_id: 'bank_session_3',
          user_agent: 'Bank Test Script',
          device_fingerprint: 'bank_device_3'
        })
      }
    ];

    // Insert transactions
    const createdTransactions = [];
    for (const txn of bankTransactions) {
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

    console.log(`\n🎉 Successfully created ${createdTransactions.length} bank-specific transactions`);
    console.log('📊 Transaction Summary:');
    createdTransactions.forEach(txn => {
      console.log(`   • ${txn.txnRef}: R${txn.amount} (${txn.type})`);
    });

    const totalAmount = createdTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    console.log(`\n💰 Total pending amount: R${totalAmount.toFixed(2)}`);
    console.log('\n🚀 These transactions will now appear in the dashboard table!');

  } catch (error) {
    console.error('❌ Error creating bank transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createBankTransactions();
