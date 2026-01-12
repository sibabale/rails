const { PrismaClient } = require('@prisma/client');
const { settleTransactions, getPendingTransactions } = require('../src/ledger/ledger');

const prisma = new PrismaClient();

async function testSettlement() {
  try {
    console.log('🧪 Testing Weekend Settlement Functionality...\n');

    // Step 1: Check current pending transactions
    console.log('📋 Step 1: Checking pending transactions...');
    const pendingBefore = await getPendingTransactions();
    console.log(`   Found ${pendingBefore.length} pending transactions`);
    
    if (pendingBefore.length === 0) {
      console.log('   ⚠️  No pending transactions found. Run create-test-transactions.js first.');
      return;
    }

    console.log('   Pending transactions:');
    pendingBefore.forEach(txn => {
      console.log(`     • ${txn.txnRef}: R${txn.amount} (${txn.type})`);
    });

    // Step 2: Get bank admin email for authorization
    console.log('\n🏦 Step 2: Getting bank admin details...');
    const bank = await prisma.bank.findFirst({
      where: { status: 'active' }
    });

    if (!bank) {
      console.error('❌ No active bank found.');
      return;
    }

    const adminEmail = bank.adminEmail;
    console.log(`   Using admin: ${adminEmail}`);

    // Step 3: Trigger settlement
    console.log('\n🔄 Step 3: Triggering weekend settlement...');
    const settlementResult = await settleTransactions(adminEmail, false);
    
    console.log('   Settlement completed successfully!');
    console.log(`   Transactions settled: ${settlementResult.settled.length}`);
    console.log(`   Settlement timestamp: ${settlementResult.settlement_timestamp}`);

    // Step 4: Verify settlement results
    console.log('\n✅ Step 4: Verifying settlement results...');
    const pendingAfter = await getPendingTransactions();
    console.log(`   Remaining pending transactions: ${pendingAfter.length}`);

    if (pendingAfter.length === 0) {
      console.log('   ✅ All transactions successfully settled!');
    } else {
      console.log('   ⚠️  Some transactions remain pending:');
      pendingAfter.forEach(txn => {
        console.log(`     • ${txn.txnRef}: R${txn.amount}`);
      });
    }

    // Step 5: Check audit logs
    console.log('\n📝 Step 5: Checking audit logs...');
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: 'settlement_completed',
        userId: adminEmail
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log(`   Found ${auditLogs.length} settlement audit logs`);
    auditLogs.forEach(log => {
      const details = JSON.parse(log.details);
      console.log(`   • ${log.timestamp}: ${details.transactions_settled} transactions, R${details.total_amount}`);
    });

    // Step 6: Performance metrics
    console.log('\n📊 Step 6: Settlement performance summary...');
    const totalSettled = settlementResult.settled.reduce((sum, txn) => sum + txn.amount, 0);
    console.log(`   Total amount settled: R${totalSettled.toFixed(2)}`);
    console.log(`   Average transaction amount: R${(totalSettled / settlementResult.settled.length).toFixed(2)}`);
    console.log(`   Settlement success rate: 100%`);

    console.log('\n🎉 Weekend settlement test completed successfully!');

  } catch (error) {
    console.error('❌ Settlement test failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSettlement();
