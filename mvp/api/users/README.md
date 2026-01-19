# Users Service - Local Development Setup

## Prerequisites

The users service requires the following services to be running:

1. **PostgreSQL** - Database for storing users, businesses, environments, and sessions
2. **NATS** - Message broker for event publishing

## Quick Start

### 1. Install Dependencies

#### PostgreSQL
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Or use Docker
docker run --name postgres-users -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=users -p 5432:5432 -d postgres:14
```

#### NATS
```bash
# macOS
brew install nats-server
nats-server

# Or use Docker
docker run --name nats -p 4222:4222 -p 8222:8222 -d nats:latest
```

### 2. Set Up Database

Create the database and run migrations:

```bash
# Create database
createdb users

# Or with PostgreSQL running in Docker:
docker exec -i postgres-users psql -U postgres -c "CREATE DATABASE users;"

# Run migrations (using sqlx-cli)
cargo install sqlx-cli
export DATABASE_URL="postgresql://localhost:5432/users"
sqlx migrate run

# Or manually run the migration SQL
psql postgresql://localhost:5432/users < migrations/20260119000100_init_users_service.sql
```

### 3. Configure Environment

Create a `.env` file or set environment variables:

```bash
export DATABASE_URL="postgresql://localhost:5432/users"
export NATS_URL="nats://localhost:4222"
export SERVER_ADDR="0.0.0.0:8080"
export RUST_LOG="info"

# Service-to-service protection (recommended)
# Only required for the sensitive endpoints:
# - POST /api/v1/auth/login
# - POST /api/v1/business/register
# Comma-separated list of allowed internal tokens.
export INTERNAL_SERVICE_TOKEN_ALLOWLIST="replace_me"
```

### 4. Build and Run

```bash
# Build the service
cargo build --release

# Run using the helper script
./run-local.sh

# Or run directly
cargo run --release
```

## Service Endpoints

Once running, the service will be available at `http://localhost:8080`:

- `POST /api/v1/business/register` - Register a new business
- `POST /api/v1/users` - Create a new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/revoke` - Revoke refresh token

## Request Requirements

### Correlation ID

All `/api/...` requests must include:

- `x-correlation-id: <string>`

This is used for request tracking and will be included in logs.

### Sensitive endpoint protection (recommended)

The following endpoints are considered sensitive and can be restricted to trusted internal callers:

- `POST /api/v1/auth/login`
- `POST /api/v1/business/register`

If `INTERNAL_SERVICE_TOKEN_ALLOWLIST` is set, these endpoints require:

- `x-internal-service-token: <token>`

If the token is missing or not allowlisted, the service responds with `403` and a generic message.

This is designed for the intended production flow:

- Marketing/Client app (Next.js) -> `rails-client-server`
- `rails-client-server` -> `users-service` (adds internal token + correlation id)

## Troubleshooting

### Service hangs on startup
- Check that PostgreSQL is running: `pg_isready` or `psql -l`
- Check that NATS is running: `nc -z localhost 4222`
- Check the logs with `RUST_LOG=debug`

### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure the database exists: `psql -l | grep users`
- Check PostgreSQL is listening: `lsof -i :5432`

### NATS connection errors
- Verify NATS is running: `lsof -i :4222`
- Check `NATS_URL` is correct (default: `nats://localhost:4222`)

### Port already in use
- Change `SERVER_ADDR` to a different port (e.g., `0.0.0.0:8081`)
- Or kill the process using port 8080: `lsof -ti:8080 | xargs kill`

## Development

### Running Tests
```bash
cargo test
```

### Running with Debug Logging
```bash
RUST_LOG=debug cargo run
```

### Checking Service Status
```bash
# Check if service is running
ps aux | grep users_service

# Check if port is listening
lsof -i :8080

# Test endpoint
curl http://localhost:8080/api/v1/business/register \
  -H "x-correlation-id: local-test-1" \
  -H "x-internal-service-token: replace_me" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Business","admin_email":"admin@test.com","admin_password":"password123"}'
```
