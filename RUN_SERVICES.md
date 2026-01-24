# Running Services Locally

Use standard commands - no custom scripts needed! Just set up `.env` files and run the standard dev commands.

## Quick Start

### 1. Users Service (Rust)
```bash
cd mvp/api/users
cp .env.example .env  # Edit with your DATABASE_URL
cargo run
```

### 2. Accounts Service (Rust)
```bash
cd mvp/api/accounts
cp .env.example .env  # Edit with your DATABASE_URL
cargo run
```

### 3. Ledger Service (Rails)
```bash
cd mvp/api/ledger
cp .env.example .env.local  # Edit with your DATABASE_URL
bundle install  # First time only
rails db:migrate  # First time or after schema changes
rails server
```

## Environment Variables

Each service reads from `.env` files (Rust) or `.env.local` (Rails):

### Users Service
- `DATABASE_URL` - PostgreSQL connection (required)
- `SERVER_ADDR` - Server address (default: `0.0.0.0:8080`)
- `GRPC_PORT` - gRPC port (default: `50051`)
- `RUST_LOG` - Log level (default: `info`)

### Accounts Service
- `DATABASE_URL` - PostgreSQL connection (required)
- `PORT` - HTTP port (default: `8080`)
- `GRPC_PORT` - gRPC port (default: `9090`)
- `RUST_LOG` - Log level (default: `info`)

### Ledger Service
- `DATABASE_URL` - PostgreSQL connection (required)
- `PORT` - HTTP port (default: `3000`)
- `GRPC_PORT` - gRPC port (default: `50053`)
- `RAILS_ENV` - Rails environment (default: `development`)
- `LOG_LEVEL` - Log level (default: `info`)

## Standard Commands

**Rust services:**
```bash
cargo run          # Development
cargo build        # Build only
cargo test         # Run tests
```

**Rails service:**
```bash
rails server       # or: rails s
rails console      # or: rails c
rails db:migrate   # Run migrations
rails test         # Run tests
```

## Service Ports

- **Users HTTP:** 8080
- **Users gRPC:** 50051
- **Accounts HTTP:** 8081
- **Accounts gRPC:** 50052
- **Ledger HTTP:** 3000
- **Ledger gRPC:** 50053

## Health Checks

- Users: `http://localhost:8080/health`
- Accounts: `http://localhost:8081/health`
- Ledger: `http://localhost:3000` (Rails default)
