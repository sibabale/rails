#!/bin/bash

# Rails Users Service - Development Startup Script
# This script sets up environment variables and starts the Spring Boot application

# Set environment variables for development
export DATABASE_URL="jdbc:postgresql://ep-restless-wildflower-acl41u3o-pooler.sa-east-1.aws.neon.tech/neondb?user=neondb_owner&password=npg_E9Fwn5vWqUoe&sslmode=require&channelBinding=require"
export NATS_ENABLED=true
export PORT=8080
export SPRING_PROFILES_ACTIVE=local
export ACCOUNTS_GRPC_HOST=localhost
export ACCOUNTS_GRPC_PORT=9090

# Optional: JWT Configuration (uncomment if needed)
# export JWT_ISSUER=rails-users
# export JWT_ACCESS_TTL_SECONDS=900
# export JWT_REFRESH_TTL_SECONDS=2592000

# NATS Configuration (enabled for testing)
export NATS_URL=nats://localhost:4222
export NATS_STREAM=rails_events
export NATS_SUBJECT_USER_CREATED=users.user.created
export NATS_SUBJECT_ACCOUNT_CREATED=accounts.account.created

# Accounts gRPC Configuration (enabled for testing)
# export ACCOUNTS_GRPC_HOST=localhost  # Already set above
# export ACCOUNTS_GRPC_PORT=9090       # Already set above

echo "🚀 Starting Rails Users Service in development mode..."
echo "📊 Database: Neon PostgreSQL"
echo "🔌 HTTP Port: $PORT"
echo "📡 NATS: $NATS_ENABLED ($NATS_URL)"
echo "🔗 Accounts gRPC: $ACCOUNTS_GRPC_HOST:$ACCOUNTS_GRPC_PORT"
echo ""

# Run the Spring Boot application
mvn spring-boot:run
