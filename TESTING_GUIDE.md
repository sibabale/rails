# Testing Guide - Admin Dashboard Integration

This guide covers the steps needed to test the new admin dashboard features for viewing users, accounts, transactions, and ledger entries.

## Prerequisites

1. **All services must be running:**
   - Users Service (Rust)
   - Accounts Service (Rust)
   - Ledger Service (Rails)
   - Client Server (TypeScript/Express)
   - Frontend (React/Vite)

2. **Databases must be set up and migrated:**
   - Users service database
   - Accounts service database
   - Ledger service database

## Step 1: Install Dependencies

### Ledger Service - Install JWT Gem

```bash
cd mvp/api/ledger
bundle install
```

This installs the `jwt` gem needed for JWT token decoding in the ledger controllers.

## Step 2: Configure Environment Variables

### A. Frontend (rails-web)

Create or update `mvp/rails-web/.env`:

```bash
# Only this one is needed - all API calls go through client-server
VITE_CLIENT_SERVER=http://localhost:3000
```

**Important:** Do NOT set `VITE_USERS_SERVICE`, `VITE_ACCOUNTS_SERVICE`, or `VITE_LEDGER_SERVICE`. All calls must go through the client-server.

### B. Client Server (rails-client-server)

Create or update `mvp/rails-client-server/.env`:

```bash
# Users Service
USERS_SERVICE_BASE_URL=http://localhost:8080
USERS_SERVICE_INTERNAL_TOKEN=your_internal_token_here  # Optional, only if users service requires it

# Accounts Service (NEW)
ACCOUNTS_SERVICE_BASE_URL=http://localhost:8081

# Ledger Service (NEW)
LEDGER_SERVICE_BASE_URL=http://localhost:3000  # or whatever port ledger service runs on

# Client Server Port
PORT=3000
```

### C. Users Service

Ensure `mvp/api/users/.env` has:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/users
SERVER_ADDR=0.0.0.0:8080
JWT_SECRET=your_jwt_secret_here  # Must match ledger service!
```

**Important:** `JWT_SECRET` must match the ledger service JWT_SECRET.

### D. Accounts Service

Ensure `mvp/api/accounts/.env` has:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/accounts
SERVER_ADDR=0.0.0.0:8081
```

### E. Ledger Service

Create or update `mvp/api/ledger/.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/ledger
PORT=3000
GRPC_PORT=50053
RAILS_ENV=development

# JWT Secret - MUST MATCH users service JWT_SECRET
JWT_SECRET=your_jwt_secret_here  # Must match users service!
```

**Critical:** The `JWT_SECRET` in ledger service must exactly match the `JWT_SECRET` in users service, otherwise JWT decoding will fail.

## Step 3: Start Services

Start services in this order:

### Terminal 1: Users Service
```bash
cd mvp/api/users
cargo run
# Should start on port 8080
```

### Terminal 2: Accounts Service
```bash
cd mvp/api/accounts
cargo run
# Should start on port 8081
```

### Terminal 3: Ledger Service
```bash
cd mvp/api/ledger
bundle install  # If you haven't already
rails server
# Should start on port 3000 (or whatever PORT is set to)
```

### Terminal 4: Client Server
```bash
cd mvp/rails-client-server
npm install  # If you haven't already
npm run dev
# Should start on port 3000 (or whatever PORT is set to)
```

**Note:** If ledger service and client-server both use port 3000, change one of them:
- Option 1: Change ledger service `PORT=3001` in `.env`
- Option 2: Change client-server `PORT=3001` in `.env` and update frontend `VITE_CLIENT_SERVER=http://localhost:3001`

### Terminal 5: Frontend
```bash
cd mvp/rails-web
npm install  # If you haven't already
npm run dev
# Should start on port 5173 (Vite default)
```

## Step 4: Test the Integration

### 4.1 Test Login

1. Open browser to `http://localhost:5173`
2. Click "Login" or "Register"
3. Login with an admin account
4. You should be redirected to the dashboard

### 4.2 Test Users Tab

1. In the dashboard, click "Users" in the sidebar
2. You should see a list of users (if any exist)
3. If no users exist, you'll see "No Users Found" message
4. Users are created via SDK, not through the dashboard

**Expected Behavior:**
- ✅ Users list loads (if users exist)
- ✅ Shows user name, email, role, status, created date
- ✅ Read-only (no edit/delete buttons)

**Troubleshooting:**
- If you see "Endpoint not available" error, check:
  - Users service is running on port 8080
  - Client-server has `USERS_SERVICE_BASE_URL` set correctly
  - Check browser console for errors

### 4.3 Test Accounts Tab

1. Click "Accounts" in the sidebar
2. You should see a list of accounts
3. Click on an account to see details
4. Account details should show transactions

**Expected Behavior:**
- ✅ Accounts list loads
- ✅ Clicking an account shows details
- ✅ Transactions appear in account details
- ✅ Read-only (no decommission button)

**Troubleshooting:**
- If accounts don't load:
  - Check accounts service is running on port 8081
  - Check client-server has `ACCOUNTS_SERVICE_BASE_URL` set
  - Check browser console for CORS errors

### 4.4 Test Ledger Tab

1. Click "Ledger" in the sidebar
2. You should see ledger transactions and entries

**Expected Behavior:**
- ✅ Recent transactions display
- ✅ Ledger summary shows entry counts
- ✅ Debits and credits are color-coded

**Troubleshooting:**
- If ledger data doesn't load:
  - Check ledger service is running
  - Check `JWT_SECRET` matches between users and ledger services
  - Check client-server has `LEDGER_SERVICE_BASE_URL` set
  - Check browser console for 401/403 errors (JWT issues)

## Step 5: Verify JWT Secret Match

This is critical! If JWT secrets don't match, ledger endpoints will return 401 Unauthorized.

### Check Users Service JWT_SECRET:
```bash
cd mvp/api/users
# Check .env file
cat .env | grep JWT_SECRET
```

### Check Ledger Service JWT_SECRET:
```bash
cd mvp/api/ledger
# Check .env file
cat .env | grep JWT_SECRET
```

**They must be identical!** If they're different, update one to match the other.

## Step 6: Test with Real Data

### Create Test Data (via SDK or direct API calls)

1. **Create a user** (via SDK or API):
   ```bash
   curl -X POST http://localhost:3000/api/v1/users \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "X-Environment-Id: YOUR_ENV_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "first_name": "Test",
       "last_name": "User",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

2. **Create an account** (via SDK or API):
   ```bash
   curl -X POST http://localhost:3000/api/v1/accounts \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "X-Environment-Id: YOUR_ENV_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "account_type": "checking",
       "currency": "USD"
     }'
   ```

3. **Create ledger transactions** (via SDK or gRPC):
   - Use the accounts service to create transactions
   - These will automatically create ledger entries

## Common Issues and Solutions

### Issue: "VITE_CLIENT_SERVER is not configured"

**Solution:** Set `VITE_CLIENT_SERVER=http://localhost:3000` in `mvp/rails-web/.env`

### Issue: "LEDGER_SERVICE_BASE_URL is not set"

**Solution:** Set `LEDGER_SERVICE_BASE_URL=http://localhost:3000` in `mvp/rails-client-server/.env`

### Issue: Ledger endpoints return 401 Unauthorized

**Solution:** 
1. Check `JWT_SECRET` matches between users and ledger services
2. Verify JWT token is being sent in Authorization header
3. Check ledger service logs for JWT decode errors

### Issue: CORS errors in browser console

**Solution:**
- All requests should go through client-server (no CORS issues)
- If you see CORS errors, check that frontend is using `VITE_CLIENT_SERVER` not direct service URLs

### Issue: "Failed to reach users/accounts/ledger service"

**Solution:**
1. Verify service is running: `curl http://localhost:8080/health` (users)
2. Check service URLs in client-server `.env` are correct
3. Check service ports match what's configured

### Issue: Users list is empty

**Solution:**
- This is expected if no users exist
- Users are created via SDK, not through dashboard
- Create a test user via API to see it in the list

### Issue: Environment mismatch

**Solution:**
- Ledger service needs `X-Environment` header (sandbox/production)
- Currently defaults to 'sandbox' if not provided
- Ensure environment_id in JWT matches the environment you're querying

## Verification Checklist

- [ ] All services are running
- [ ] Frontend `.env` has `VITE_CLIENT_SERVER` set
- [ ] Client-server `.env` has all service URLs set
- [ ] `JWT_SECRET` matches between users and ledger services
- [ ] JWT gem installed in ledger service (`bundle install`)
- [ ] Can login to dashboard
- [ ] Users tab shows users (or "No Users Found")
- [ ] Accounts tab shows accounts
- [ ] Ledger tab shows transactions/entries
- [ ] No CORS errors in browser console
- [ ] No 401/403 errors in browser console

## Next Steps

Once everything is working:

1. **Test with production-like data** - Create multiple users, accounts, and transactions
2. **Test pagination** - If you have many records, verify pagination works
3. **Test filtering** - Test account_id filter on ledger entries
4. **Test error handling** - Stop a service and verify error messages display correctly
5. **Performance testing** - Test with large datasets to ensure performance is acceptable

## Support

If you encounter issues:

1. Check service logs for errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure all services are running and accessible
5. Verify JWT_SECRET matches between services
