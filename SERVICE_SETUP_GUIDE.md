# 🚀 Local Services Setup Guide

## Overview

This guide helps you set up all required services locally for E2E testing of the hardened ledger implementation.

## 📋 Required Services

| Service | Language | Port | Purpose |
|---------|----------|------|---------|
| **PostgreSQL** | SQL | 5432 | Database for all services |
| **Users Service** | Rust | 8080 | User management and authentication |
| **Accounts Service** | Rust | 8081 | Account and transaction management |
| **Ledger Service** | Ruby/Rails | 3000 | Double-entry accounting ledger |

## 🛠️ Prerequisites

### Install Required Tools

```bash
# Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Ruby/Rails (for Ledger Service)
brew install rbenv ruby-build
rbenv install 3.1.0
rbenv global 3.1.0
gem install rails

# Additional tools
brew install jq nc
```

### Verify Installation

```bash
# Check PostgreSQL
psql --version

# Check Rust
rustc --version
cargo --version

# Check Ruby
ruby --version
rails --version
```

## 🚀 Quick Start

### 1. Setup Databases

```bash
cd /Users/sibabale.joja/projects/personal/rails
chmod +x setup_local_databases.sh
./setup_local_databases.sh
```

### 2. Start All Services

```bash
chmod +x start_all_services.sh
./start_all_services.sh
```

### 3. Run E2E Test

```bash
chmod +x test_business_registration_e2e.sh
./test_business_registration_e2e.sh
```

### 4. Stop All Services

```bash
chmod +x stop_all_services.sh
./stop_all_services.sh
```

## 📁 Service Details

### Users Service (Rust)
- **Port**: 8080 (HTTP), 50051 (gRPC)
- **Database**: `users_development`
- **Health Check**: `http://localhost:8080/health`

### Accounts Service (Rust)
- **Port**: 8081 (HTTP), 50052 (gRPC)
- **Database**: `accounts_development`
- **Environment**: Consumes user events, publishes transaction events
- **Health Check**: `http://localhost:8081/health`

### Ledger Service (Rails)
- **Port**: 3000 (HTTP), 50053 (gRPC)
- **Database**: Neon PostgreSQL (configured in .env.local)
- **Environment**: Consumes transaction events, enforces accounting rules
- **Health Check**: `http://localhost:3000/health`
## 🔧 Manual Service Startup

If the scripts don't work, you can start services manually:

### 1. Start Users Service
```bash
cd /Users/sibabale.joja/projects/personal/rails/mvp/api/users
export DATABASE_URL="postgresql://postgres:password@localhost:5432/users_development"
export GRPC_PORT=50051
export HTTP_PORT=8080
export RUST_LOG=debug
cargo run --release
```

### 2. Start Accounts Service
```bash
cd /Users/sibabale.joja/projects/personal/rails/mvp/api/accounts
export DATABASE_URL="postgresql://postgres:password@localhost:5432/accounts_development"
export GRPC_PORT=50052
export HTTP_PORT=8081
export RUST_LOG=debug
cargo run --release
```

### 3. Start Ledger Service
```bash
cd /Users/sibabale.joja/projects/personal/rails/mvp/api/ledger
export DATABASE_URL="postgresql://neondb_owner:npg_6LTzUMvFi0Qe@ep-icy-mouse-acf5xu9j-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export GRPC_PORT=50053
export RAILS_ENV=development
rbenv exec bundle exec rails server -p 3000 -b 0.0.0.0
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@14
```

### Rust Build Issues
```bash
# Clean and rebuild
cargo clean
cargo build --release
```

### Rails Issues
```bash
# Install dependencies
rbenv exec bundle install

# Check Ruby version
rbenv version

# Reinstall Rails if needed
gem install rails
```

## 📊 Service Monitoring

### Check Service Health
```bash
# Users Service
curl http://localhost:8080/health

# Accounts Service
curl http://localhost:8081/health

# Ledger Service
curl http://localhost:3000/health
```

### View Logs
```bash
# Rust services (if started in background)
tail -f /tmp/users.log
tail -f /tmp/accounts.log

# Rails logs
tail -f /Users/sibabale.joja/projects/personal/rails/mvp/api/ledger/log/development.log
```

## 🎯 Testing Checklist

Before running E2E tests, verify:

- [ ] PostgreSQL is running on port 5432
- [ ] Users Service is running on port 8080
- [ ] Accounts Service is running on port 8081
- [ ] Ledger Service is running on port 3000
- [ ] All databases are created and migrated

## 🚀 Ready for Testing!

Once all services are running, you can execute the E2E test:

```bash
./test_business_registration_e2e.sh
```

This will test the complete business registration → user creation → account assignment → financial operations flow with your hardened ledger implementation.
