#!/bin/bash

# Users Service Local Runner
# This script helps run the users service locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Users Service...${NC}"

# Check if binary exists
if [ ! -f "./target/release/users_service" ]; then
    echo -e "${YELLOW}Binary not found. Building...${NC}"
    cargo build --release
fi

# DATABASE_URL is REQUIRED - check if it's set
if [ -z "$DATABASE_URL" ]; then
    if [ -f .env ]; then
        echo -e "${YELLOW}Loading DATABASE_URL from .env file...${NC}"
        export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}Error: DATABASE_URL environment variable is required${NC}"
        echo -e "${YELLOW}Please set DATABASE_URL to your PostgreSQL connection string:${NC}"
        echo "  export DATABASE_URL='postgresql://user:password@host:5432/database'"
        echo ""
        echo -e "${YELLOW}For Supabase/Neon, use the pooler URL (ends with -pooler) for better performance${NC}"
        echo "  Example: postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
        exit 1
    fi
fi

# Set other environment variables if not set
export NATS_URL=${NATS_URL:-"nats://localhost:4222"}
export SERVER_ADDR=${SERVER_ADDR:-"0.0.0.0:8080"}
export RUST_LOG=${RUST_LOG:-"info"}

echo -e "${GREEN}Configuration:${NC}"
# Mask password in DATABASE_URL for display
if [[ "$DATABASE_URL" == *"@"* ]]; then
    DB_DISPLAY=$(echo "$DATABASE_URL" | sed -E 's|://([^:]+):([^@]+)@|://\1:***@|')
    echo "  DATABASE_URL: $DB_DISPLAY"
else
    echo "  DATABASE_URL: $DATABASE_URL"
fi
echo "  NATS_URL: $NATS_URL"
echo "  SERVER_ADDR: $SERVER_ADDR"
echo ""

# Check if PostgreSQL is accessible
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL connection OK${NC}"
    else
        echo -e "${RED}✗ PostgreSQL connection failed${NC}"
        echo -e "${YELLOW}  Make sure PostgreSQL is running and DATABASE_URL is correct${NC}"
    fi
else
    echo -e "${YELLOW}⚠ psql not found, skipping PostgreSQL check${NC}"
fi

# Check if NATS is accessible
if nc -z $(echo $NATS_URL | sed 's|nats://||' | cut -d: -f1) $(echo $NATS_URL | sed 's|nats://||' | cut -d: -f2) 2>/dev/null; then
    echo -e "${GREEN}✓ NATS connection OK${NC}"
else
    echo -e "${YELLOW}⚠ NATS not accessible (service may fail to start)${NC}"
    echo -e "${YELLOW}  Install NATS: brew install nats-server${NC}"
    echo -e "${YELLOW}  Run NATS: nats-server${NC}"
fi

echo ""
echo -e "${GREEN}Starting service on $SERVER_ADDR...${NC}"
echo ""

# Run the service
exec ./target/release/users_service
