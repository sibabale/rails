const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase environment variables not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database connection string for Prisma
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return dbUrl;
};

// Helper function to test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    return false;
  }
};

// Helper function to get real-time subscriptions
const subscribeToTransactions = (callback) => {
  return supabase
    .channel('transactions')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'transactions' }, 
      callback
    )
    .subscribe();
};

module.exports = {
  supabase,
  getDatabaseUrl,
  testConnection,
  subscribeToTransactions
}; 