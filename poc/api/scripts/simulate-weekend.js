const { PrismaClient } = require('@prisma/client');
const { settleTransactions, getPendingTransactions } = require('../src/ledger/ledger');

const prisma = new PrismaClient();

async function simulateWeekend() {
  try {
    console.log('🌅 Simulating Weekend Settlement Cycle...\n');

    // Step 1: Friday evening - Create weekend transactions
    console.log('📅 Friday Evening: Creating weekend transactions...');
    await createWeekendTransactions();
    
    // Step 2: Saturday morning - Check pending transactions
    console.log('\n🌅 Saturday Morning: Checking pending transactions...');
    const saturdayPending = await getPendingTransactions();
    console.log(`   Found ${saturdayPending.length} transactions pending for weekend settlement`);
    
    // Step 3: Saturday afternoon - Trigger settlement
    console.log('\n🌞 Saturday Afternoon: Triggering weekend settlement...');
    const adminEmail = await getAdminEmail();
    const settlementResult = await settleTransactions(adminEmail, false);
    console.log(`   ✅ Settled ${settlementResult.settled.length} transactions`);
    
    // Step 4: Sunday - Verify settlement
    console.log('\n🌅 Sunday: Verifying settlement completion...');
    const sundayPending = await getPendingTransactions();
    console.log(`   Remaining pending: ${sundayPending.length} transactions`);
    
    // Step 5: Monday morning - Check clearing
    console.log('\n🌅 Monday Morning: Checking Monday clearing preparation...');
    await checkMondayClearing();
    
    console.log('\n🎉 Weekend settlement simulation completed!');

  } catch (error) {
    console.error('❌ Weekend simulation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function createWeekendTransactions() {
  const bank = await prisma.bank.findFirst({ where: { status: 'active' } });
  if (!bank) throw new Error('No active bank found');

  const weekendTransactions = [
    {
      txnRef: `WEEKEND_${Date.now()}_001`,
      userId: 'weekend_user_1',
      amount: 2500.00,
      type: 'debit',
      currency: 'ZAR',
      description: 'Weekend grocery shopping',
      sender: 'Weekend Sender',
      receiver: 'Weekend Receiver',
      senderBank: bank.bankName,
      receiverBank: 'Weekend Bank',
      status: 'pending',
      metadata: JSON.stringify({
        ip_address: '127.0.0.1',
        session_id: 'weekend_session_1',
        user_agent: 'Weekend Simulator',
        device_fingerprint: 'weekend_device_1'
      })
    },
    {
      txnRef: `WEEKEND_${Date.now()}_002`,
      userId: 'weekend_user_2',
      amount: 1800.75,
      type: 'credit',
      currency: 'ZAR',
      description: 'Weekend restaurant payment',
      sender: 'Weekend Sender 2',
      receiver: 'Weekend Receiver 2',
      senderBank: 'Weekend Bank 2',
      receiverBank: bank.bankName,
      status: 'pending',
      metadata: JSON.stringify({
        ip_address: '127.0.0.1',
        session_id: 'weekend_session_2',
        user_agent: 'Weekend Simulator',
        device_fingerprint: 'weekend_device_2'
      })
    },
    {
      txnRef: `WEEKEND_${Date.now()}_003`,
      userId: 'weekend_user_3',
      amount: 3200.50,
      type: 'debit',
      currency: 'ZAR',
      description: 'Weekend fuel payment',
      sender: 'Weekend Sender 3',
      receiver: 'Weekend Receiver 3',
      senderBank: bank.bankName,
      receiverBank: 'Weekend Bank 3',
      status: 'pending',
      metadata: JSON.stringify({
        ip_address: '127.0.0.1',
        session_id: 'weekend_session_3',
        user_agent: 'Weekend Simulator',
        device_fingerprint: 'weekend_device_3'
      })
    }
  ];

  for (const txn of weekendTransactions) {
    await prisma.transaction.create({
              data: {
          ...txn,
          timestamp: new Date(),
          settled: false,
          settledAt: null,
          settledBy: null
        }
    });
          console.log(`   ✅ Created: ${txn.txnRef} - R${txn.amount}`);
  }
}

async function getAdminEmail() {
      const bank = await prisma.bank.findFirst({
      where: { status: 'active' }
    });
    
    if (!bank) {
      throw new Error('No active bank found');
    }
    
    return bank.adminEmail;
}

async function checkMondayClearing() {
  // Check if all weekend transactions are ready for Monday clearing
  const completedTransactions = await prisma.transaction.findMany({
    where: {
      status: 'completed',
      settled: true,
      settledAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });

  console.log(`   Found ${completedTransactions.length} transactions ready for Monday clearing`);
  
  const totalAmount = completedTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  console.log(`   Total amount for clearing: R${totalAmount.toFixed(2)}`);
  
  // Simulate clearing preparation
  console.log('   📋 Preparing clearing instructions...');
  console.log('   📧 Sending clearing notifications...');
  console.log('   ✅ Monday clearing preparation complete');
}

// Run the simulation
simulateWeekend();
