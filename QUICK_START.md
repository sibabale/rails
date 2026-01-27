# Quick Start - Admin Dashboard Testing

## ✅ What's Already Done

- ✅ Frontend configured to use client-server only
- ✅ Client-server proxy routes added for all services
- ✅ Environment files created with correct structure
- ✅ API endpoints implemented in users and ledger services

## 🔧 What You Need To Do (3 Steps)

### Step 1: Install JWT Gem (30 seconds)
```bash
cd mvp/api/ledger
bundle install
```

### Step 2: Set JWT_SECRET (1 minute)

**IMPORTANT:** Both services must use the SAME JWT_SECRET value.

**Option A - Use existing secret:**
If you already have a JWT_SECRET in `mvp/api/users/.env`, copy it to `mvp/api/ledger/.env`:

```bash
# Get the secret from users service
grep JWT_SECRET mvp/api/users/.env

# Add it to ledger service .env
echo "JWT_SECRET=your_secret_here" >> mvp/api/ledger/.env
```

**Option B - Create new secret:**
```bash
# Generate a secret (any random string works)
openssl rand -hex 32

# Add to both services:
echo "JWT_SECRET=your_generated_secret" >> mvp/api/users/.env
echo "JWT_SECRET=your_generated_secret" >> mvp/api/ledger/.env
```

### Step 3: Start Services (5 terminals)

```bash
# Terminal 1: Users Service
cd mvp/api/users && cargo run

# Terminal 2: Accounts Service
cd mvp/api/accounts && cargo run

# Terminal 3: Ledger Service
cd mvp/api/ledger && rails server

# Terminal 4: Client Server
cd mvp/rails-client-server && npm run dev

# Terminal 5: Frontend
cd mvp/rails-web && npm run dev
```

## 🧪 Visual Testing

1. Open `http://localhost:5173`
2. Login as admin
3. Check these tabs:
   - **Users** - Should show user list (or "No Users Found")
   - **Accounts** - Should show accounts (or empty state)
   - **Ledger** - Should show transactions/entries (or empty state)

## ⚠️ If Something Doesn't Work

**401/403 Errors:**
- JWT_SECRET doesn't match between users and ledger services
- Fix: Make sure both `.env` files have identical `JWT_SECRET` values

**"Service not found" errors:**
- Service isn't running or wrong port
- Fix: Check service is running and port matches `.env` config

**CORS errors:**
- Frontend trying to call services directly
- Fix: Make sure `mvp/rails-web/.env` only has `VITE_CLIENT_SERVER` (no other service URLs)

## 📝 Files Already Configured

- ✅ `mvp/rails-web/.env` - Frontend config
- ✅ `mvp/rails-client-server/.env` - Client server config
- ✅ `mvp/api/ledger/.env.example` - Updated with JWT_SECRET

That's it! Just set JWT_SECRET and start services.
