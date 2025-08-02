const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Push the schema to create tables
    console.log('📦 Creating database tables...');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Failed to create tables:', error.message);
      throw error;
    }

    // Initialize default banks
    console.log('🏦 Initializing default banks...');
    const defaultBanks = [
      { name: 'FNB', code: 'FNB001' },
      { name: 'ABSA', code: 'ABSA01' },
      { name: 'NEDBANK', code: 'NED001' },
      { name: 'CAPITEC', code: 'CAP001' },
      { name: 'STANDARD', code: 'STD001' }
    ];

    for (const bank of defaultBanks) {
      try {
        await prisma.bank.upsert({
          where: { name: bank.name },
          update: {},
          create: {
            name: bank.name,
            code: bank.code,
            connected: bank.name !== 'STANDARD' // Only STANDARD is disconnected by default
          }
        });
        console.log(`✅ Bank ${bank.name} initialized`);
      } catch (error) {
        console.warn(`⚠️  Failed to initialize bank ${bank.name}:`, error.message);
      }
    }

    // Initialize reserve
    console.log('💰 Initializing reserve...');
    try {
      const reserveCount = await prisma.reserve.count();
      if (reserveCount === 0) {
        await prisma.reserve.create({
          data: {
            total: 25000000,
            available: 25000000
          }
        });
        console.log('✅ Reserve initialized with R25M');
      } else {
        console.log('✅ Reserve already exists');
      }
    } catch (error) {
      console.warn('⚠️  Failed to initialize reserve:', error.message);
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 