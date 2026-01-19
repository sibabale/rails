# Railway Deployment Guide

Complete guide for deploying the Rails Banking Infrastructure to Railway with NATS messaging and gRPC inter-service communication.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Railway Project                             │
│                   "rails-infrastructure"                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     gRPC (internal)      ┌──────────────┐     │
│  │              │◄────────────────────────►│              │     │
│  │    Users     │      port 9090           │   Accounts   │     │
│  │   Service    │                          │   Service    │     │
│  │   (Rust)     │                          │   (Rust)     │     │
│  │              │                          │              │     │
│  │  HTTP: 8080  │                          │  HTTP: 8081  │     │
│  └──────┬───────┘                          │  gRPC: 9090  │     │
│         │                                  └──────┬───────┘     │
│         │                                         │              │
│         │  pub/sub events                         │              │
│         ▼                                         ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      NATS Server                         │    │
│  │              nats.railway.internal:4222                  │    │
│  │                                                          │    │
│  │  Streams: rails_events                                   │    │
│  │  Subjects:                                               │    │
│  │    • users.user.created.*.*                              │    │
│  │    • accounts.account.created.*.*                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Neon PostgreSQL                       │    │
│  │                   (External - Shared)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Railway CLI](https://docs.railway.app/develop/cli) installed and authenticated
- [Neon](https://neon.tech) PostgreSQL database (already configured)
- Git repository with the services

### Verify Railway CLI

```bash
railway --version
railway whoami
```

---

## Deployment Steps

### Step 1: Create Railway Project

```bash
# Navigate to the API directory
cd rails/mvp/api

# Create a new Railway project
railway init

# When prompted, enter: rails-infrastructure
```

Or create via Railway Dashboard:
1. Go to [railway.app/new](https://railway.app/new)
2. Click "Empty Project"
3. Name it `rails-infrastructure`

### Step 2: Deploy NATS Server

NATS is deployed as a Docker image from Docker Hub.

#### Option A: Railway Dashboard

1. In your project, click **"+ New"** → **"Docker Image"**
2. Enter image: `nats:latest`
3. Name the service: `nats`
4. Add environment variable:
   ```
   NATS_JETSTREAM=enabled
   ```
5. Deploy

#### Option B: Railway CLI

```bash
# This requires using the dashboard for Docker images
# Railway CLI doesn't directly support Docker image deployment
# Use the dashboard method above
```

#### NATS Configuration

| Setting | Value |
|---------|-------|
| Image | `nats:latest` |
| Internal Port | 4222 |
| Internal Hostname | `nats.railway.internal` |

#### Verify NATS Deployment

Check the logs for:
```
[1] Starting nats-server
[1] Listening for client connections on 0.0.0.0:4222
[1] Server is ready
```

---

### Step 3: Deploy Accounts Service (Rust)

#### 3.1 Link and Deploy

```bash
# Navigate to accounts service
cd rails/mvp/api/accounts

# Link to the Railway project
railway link

# Select the "rails-infrastructure" project
# Create a new service named "accounts-service"

# Deploy
railway up
```

#### 3.2 Configure Environment Variables

In Railway Dashboard, go to **accounts-service** → **Variables** and add:

```bash
# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-restless-wildflower-acl41u3o-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Server
PORT=8081
GRPC_PORT=9090
HOST=0.0.0.0

# NATS (using Railway reference variable)
NATS_URL=nats://${{nats.RAILWAY_PRIVATE_DOMAIN}}:4222
NATS_STREAM=rails_events

# Logging
RUST_LOG=info
```

#### 3.3 Verify Accounts Deployment

Check logs for:
```
Connected to database
Database migrations completed
Server starting on 0.0.0.0:8081
gRPC server starting on 0.0.0.0:9090
```

---

### Step 4: Deploy Users Service (Rust)

#### 4.1 Link and Deploy

```bash
# Navigate to users service
cd rails/mvp/api/users

# Link to the same Railway project
railway link

# Select "rails-infrastructure"
# Create a new service named "users-service"

# Deploy
railway up
```

#### 4.2 Configure Environment Variables

In Railway Dashboard, go to **users-service** → **Variables** and add:

```bash
# Server
PORT=8080
SERVER_ADDR=0.0.0.0:8080

# Logging
RUST_LOG=info

# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-restless-wildflower-acl41u3o-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# NATS (using Railway reference variable)
NATS_URL=nats://${{nats.RAILWAY_PRIVATE_DOMAIN}}:4222
NATS_STREAM=rails_events
```

#### 4.3 Verify Users Deployment

Check logs for:
```
Users service started successfully on http://0.0.0.0:8080
Database connection established
```

---

### Step 5: Generate Public Domain (Users Service)

Only the Users Service needs external access for API consumers.

```bash
# Generate domain for users-service
railway domain --service users-service
```

Or in Dashboard:
1. Go to **users-service** → **Settings** → **Networking**
2. Click **"Generate Domain"**
3. You'll get: `users-service-xxxx.railway.app`

---

## Service Reference Variables

Railway provides automatic service discovery via reference variables:

| Variable | Resolves To |
|----------|-------------|
| `${{nats.RAILWAY_PRIVATE_DOMAIN}}` | `nats.railway.internal` |
| `${{accounts-service.RAILWAY_PRIVATE_DOMAIN}}` | `accounts-service.railway.internal` |
| `${{users-service.RAILWAY_PRIVATE_DOMAIN}}` | `users-service.railway.internal` |

---

## Internal Networking

All services communicate over Railway's private network:

| Service | Internal URL | Port(s) |
|---------|--------------|---------|
| NATS | `nats://nats.railway.internal:4222` | 4222 |
| Accounts HTTP | `http://accounts-service.railway.internal:8081` | 8081 |
| Accounts gRPC | `accounts-service.railway.internal:9090` | 9090 |
| Users HTTP | `http://users-service.railway.internal:8080` | 8080 |

---

## Verification & Testing

### Check All Services Status

```bash
railway status
```

### View Logs

```bash
# NATS logs
railway logs --service nats

# Accounts service logs
railway logs --service accounts-service

# Users service logs
railway logs --service users-service
```

### Test Health Endpoints

```bash
# Users Service (via public domain)
# Note: the Rust service currently does not expose /actuator/health.
# Use one of the public endpoints as a smoke test instead.
curl -X POST https://users-service-xxxx.railway.app/api/v1/business/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Business","admin_email":"admin@test.com","admin_password":"password123"}'
```

### Test End-to-End Flow

1. **Create a user** via Users Service REST API
2. Users Service publishes `users.user.created` to NATS
3. Users Service calls Accounts gRPC to create default account
4. Accounts Service creates account in database
5. Accounts Service publishes `accounts.account.created` to NATS

```bash
# Create user
curl -X POST https://users-service-xxxx.railway.app/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "SecurePass123!"
  }'
```

---

## Troubleshooting

### NATS Connection Issues

**Symptom:** Services can't connect to NATS

**Solutions:**
1. Verify NATS is running: `railway logs --service nats`
2. Check the NATS_URL uses internal domain: `nats://nats.railway.internal:4222`
3. Ensure NATS service is in the same Railway project

### gRPC Connection Issues

**Symptom:** Users service can't reach Accounts gRPC

**Solutions:**
1. Verify Accounts service is running and gRPC port is exposed
2. Check `ACCOUNTS_GRPC_HOST` uses internal domain
3. Ensure both services are in the same Railway project
4. Check Accounts logs for gRPC server startup message

### Database Connection Issues

**Symptom:** Service fails to connect to Neon

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check Neon dashboard for connection limits
3. Ensure SSL mode is set: `?sslmode=require`
4. For Rust: Use `postgresql://` prefix

### Service Won't Start

**Symptom:** Deployment fails or service crashes

**Solutions:**
1. Check build logs: `railway logs --service <name> --build`
2. Verify Dockerfile is correct
3. Check all required environment variables are set
4. Review application logs for startup errors

---

## Environment-Specific Configuration

### Development Environment

```bash
# Create dev environment
railway environment create development

# Switch to dev
railway environment development

# Deploy with dev settings
railway up
```

### Production Environment

```bash
# Switch to production
railway environment production

# Update variables for production
railway variables set RUST_LOG=warn
```

---

## Scaling

### Horizontal Scaling

Railway supports multiple instances:

1. Go to service **Settings** → **Scaling**
2. Increase replica count
3. Note: NATS queue groups ensure messages go to one instance only

### Resource Limits

Configure memory/CPU in service settings if needed.

---

## Monitoring

### Built-in Metrics

Railway provides:
- CPU usage
- Memory usage
- Network I/O
- Request counts

### Custom Metrics

- Users Service: (not implemented yet)
- Accounts Service: Add custom metrics endpoint

---

## Cost Optimization

| Service | Estimated Usage | Notes |
|---------|-----------------|-------|
| NATS | Low | Lightweight, single instance sufficient |
| Accounts | Medium | Depends on transaction volume |
| Users | Medium | Depends on auth requests |
| Neon DB | External | Billed separately |

### Tips

- Use Railway's sleep feature for dev environments
- Monitor usage in Railway dashboard
- Scale down during low-traffic periods

---

## Quick Reference

### Deployment Commands

```bash
# Deploy all services
cd rails/mvp/api/accounts && railway up
cd rails/mvp/api/users && railway up

# View logs
railway logs --service <service-name>

# Check status
railway status

# Open dashboard
railway open
```

### Environment Variables Summary

| Service | Required Variables |
|---------|-------------------|
| NATS | `NATS_JETSTREAM=enabled` |
| Accounts | `DATABASE_URL`, `PORT`, `GRPC_PORT`, `NATS_URL`, `NATS_STREAM`, `RUST_LOG` |
| Users | `DATABASE_URL`, `SERVER_ADDR`, `NATS_URL`, `NATS_STREAM`, `RUST_LOG` |

---

## Next Steps

1. [ ] Set up CI/CD with GitHub Actions
2. [ ] Configure custom domain
3. [ ] Set up monitoring/alerting
4. [ ] Implement rate limiting
5. [ ] Add API gateway (if needed)