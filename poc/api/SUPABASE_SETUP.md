# Supabase Setup Guide for Rails API

This guide will help you set up Supabase as the database for the Rails API, replacing the file-based ledger system.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. The Rails API project set up

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `rails-api` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Database Connection Details

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Find the **Connection string** section
3. Copy the **URI** (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`)
4. Also note your **Project URL** and **Anon Key** from the **API** section

## Step 3: Configure Environment Variables

Create or update your `.env` file in the `poc/api` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Application Configuration
NODE_ENV=development
PORT=8000

# PostHog Configuration
POSTHOG_API_KEY=your_posthog_api_key_here
POSTHOG_HOST=https://app.posthog.com

# Simulator Configuration
SIM_WEBHOOK_ENDPOINT=http://localhost:8000/api/webhook

# Node Configuration
NODE_ID=node-001
```

**Replace the placeholders:**
- `[YOUR-PASSWORD]`: The database password you set when creating the project
- `[YOUR-PROJECT-REF]`: Your project reference ID
- `[YOUR-ANON-KEY]`: Your Supabase anon key

## Step 4: Set Up Database Schema

1. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```

2. Push the schema to your Supabase database:
   ```bash
   npm run db:push
   ```

3. Set up the database and migrate existing data:
   ```bash
   npm run db:setup
   ```

## Step 5: Update API to Use Prisma

The API has been updated to use the new Prisma-based ledger system. The main changes are:

- **New file**: `src/ledger/ledger.js` - Replaces the file-based ledger
- **Updated**: All route handlers now use the Prisma client
- **Added**: Database transactions for atomicity
- **Added**: Audit logging for all operations

## Step 6: Test the Setup

1. Start the API server:
   ```bash
   npm start
   ```

2. Test the webhook endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "txn_ref": "TEST001",
       "userId": "test-user",
       "source_account": "ZA123456",
       "destination_account": "ZA789012",
       "amount": 100.50,
       "type": "transfer",
       "description": "Test transaction"
     }'
   ```

3. Check the dashboard endpoint:
   ```bash
   curl http://localhost:8000/api/dashboard
   ```

## Step 7: Enable Row Level Security (Optional)

For production use, you should enable Row Level Security (RLS) in Supabase:

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Policies**
3. Enable RLS on your tables
4. Create appropriate policies for your use case

Example RLS policy for transactions:
```sql
-- Allow users to see only their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Allow authenticated users to insert transactions
CREATE POLICY "Authenticated users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Step 8: Real-time Features

The new setup includes real-time capabilities through Supabase:

```javascript
const { subscribeToTransactions } = require('./src/config/supabase');

// Subscribe to transaction changes
const subscription = subscribeToTransactions((payload) => {
  console.log('Transaction updated:', payload);
});
```

## Database Schema Overview

The new schema includes:

### Tables

1. **transactions** - All financial transactions
   - `id` (Primary Key)
   - `txn_ref` (Unique transaction reference)
   - `user_id` (User identifier)
   - `sender`, `receiver` (Account numbers)
   - `sender_bank`, `receiver_bank` (Bank codes)
   - `amount`, `currency` (Transaction details)
   - `status` (pending, completed, delayed, failed)
   - `settled`, `settled_at`, `settled_by` (Settlement info)
   - `metadata` (JSON string for additional data)

2. **banks** - Bank information
   - `id` (Primary Key)
   - `name`, `code` (Bank details)
   - `connected` (Connection status)

3. **reserve** - Reserve management
   - `id` (Primary Key)
   - `total`, `available` (Reserve amounts)

4. **audit_logs** - Audit trail
   - `id` (Primary Key)
   - `action` (Action performed)
   - `user_id` (User who performed action)
   - `details` (JSON string with action details)

## Migration from File-based System

The setup script automatically migrates existing data from JSON files:

- `src/ledger/ledger.json` → `transactions` table
- `src/ledger/banks.json` → `banks` table
- `src/ledger/reserve.json` → `reserve` table

## Troubleshooting

### Common Issues

1. **Connection refused**: Check your DATABASE_URL and ensure the password is correct
2. **Schema push failed**: Make sure you have the correct permissions in Supabase
3. **Migration errors**: Check the console output for specific error messages

### Useful Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database (WARNING: This will delete all data)
npx prisma db push --force-reset

# Generate new Prisma client
npm run db:generate

# Check database connection
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Connected')).catch(console.error).finally(() => prisma.$disconnect())"
```

## Next Steps

1. **Production Deployment**: Update environment variables for production
2. **Backup Strategy**: Set up automated backups in Supabase
3. **Monitoring**: Configure Supabase monitoring and alerts
4. **Performance**: Add database indexes for frequently queried fields
5. **Security**: Implement proper authentication and authorization

## Support

If you encounter issues:

1. Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the Prisma documentation: [prisma.io/docs](https://prisma.io/docs)
3. Check the Rails API logs for detailed error messages 