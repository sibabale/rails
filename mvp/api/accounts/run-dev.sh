#!/bin/bash

# Rails Accounts Service - Development Startup Script
# This script sets up environment variables and starts the Rust application

# Set environment variables for development
export DATABASE_URL="postgresql://neondb_owner:npg_E9Fwn5vWqUoe@ep-restless-wildflower-acl41u3o-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
export PORT=8081
export GRPC_PORT=9090
export HOST=0.0.0.0
export RUST_LOG=info
export NATS_URL=nats://localhost:4222
export NATS_STREAM=rails_events

echo "🚀 Starting Rails Accounts Service in development mode..."
echo "📊 Database: Neon PostgreSQL"
echo "🔌 HTTP Port: $PORT"
echo "🔌 gRPC Port: $GRPC_PORT"
echo "📡 NATS URL: $NATS_URL"
echo "📝 Log Level: $RUST_LOG"
echo ""

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: Rust/Cargo is not installed"
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

# Check if SQLx CLI is installed
if ! command -v sqlx &> /dev/null; then
    echo "⚠️  SQLx CLI not found. Installing..."
    cargo install sqlx-cli --no-default-features --features native-tls,postgres
fi

# Run database migrations if they exist
if [ -d "migrations" ]; then
    echo "🗃️  Running database migrations..."
    sqlx migrate run
fi

# Build and run the application
echo "🔨 Building and starting the application..."
cargo run
