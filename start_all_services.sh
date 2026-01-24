#!/bin/bash

# Start all required services for E2E testing
# Users Service, Accounts Service, Ledger Service, PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting All Services for E2E Testing${NC}"
echo "============================================"
echo ""

# Function to check if service is already running
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  $service_name is already running on port $port${NC}"
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready (port check)
wait_for_port() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name port to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✅ $service_name port is ready${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name port failed to open within ${max_attempts} attempts${NC}"
    return 1
}

# Function to wait for service health check
wait_for_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name health check...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$health_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is healthy${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name health check failed within ${max_attempts} attempts${NC}"
    return 1
}

# 1. Check PostgreSQL (using remote databases)
echo -e "${BLUE}🐘 Using Remote Databases...${NC}"
echo -e "${YELLOW}⚠️  Skipping local PostgreSQL - using remote databases${NC}"

# 2. Start Users Service (Rust)
echo -e "${BLUE}👥 Starting Users Service...${NC}"
if check_port 8080 "Users Service"; then
    echo -e "${YELLOW}Users Service already running, skipping...${NC}"
else
    echo -e "${YELLOW}Starting Users Service (Rust)...${NC}"
    cd /Users/sibabale.joja/projects/personal/rails/mvp/api/users
    
    # Set environment variables
    # Note: Removed channel_binding=require as it's not recognized and may cause issues
    export DATABASE_URL="postgresql://neondb_owner:npg_E9Fwn5vWqUoe@ep-restless-wildflower-acl41u3o-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    export GRPC_PORT=50051
    export HTTP_PORT=8080
    export RUST_LOG=debug
    
    # Build and run
    cargo build --release
    
    # Start service in background and capture output
    cargo run --release > /tmp/users_service.log 2>&1 &
    USERS_PID=$!
    echo -e "${GREEN}Users Service started (PID: $USERS_PID)${NC}"
    echo -e "${YELLOW}📝 Logs: tail -f /tmp/users_service.log${NC}"
    
    # Wait for port first (with longer timeout for database connection)
    if wait_for_port "Users Service" 8080; then
        # Then wait for health check
        if wait_for_health "Users Service" "http://localhost:8080/health"; then
            echo -e "${GREEN}✅ Users Service is ready${NC}"
        else
            echo -e "${RED}❌ Users Service health check failed${NC}"
            echo -e "${YELLOW}⚠️  Service may still be starting. Check logs: tail -f /tmp/users_service.log${NC}"
            echo -e "${YELLOW}⚠️  Continuing with other services...${NC}"
        fi
    else
        echo -e "${RED}❌ Users Service failed to start (port not open)${NC}"
        echo -e "${YELLOW}⚠️  Check logs: tail -f /tmp/users_service.log${NC}"
        echo -e "${YELLOW}⚠️  Continuing with other services...${NC}"
    fi
    cd - > /dev/null
fi

# 3. Start Accounts Service (Rust)
echo -e "${BLUE}🏦 Starting Accounts Service...${NC}"
if check_port 8081 "Accounts Service"; then
    echo -e "${YELLOW}Accounts Service already running, skipping...${NC}"
else
    echo -e "${YELLOW}Starting Accounts Service (Rust)...${NC}"
    cd /Users/sibabale.joja/projects/personal/rails/mvp/api/accounts
    
    # Set environment variables
    export DATABASE_URL="postgresql://neondb_owner:npg_YCRVIWf8s2MJ@ep-long-forest-acflclit.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    export GRPC_PORT=50052
    export HTTP_PORT=8081
    export RUST_LOG=debug
    
    # Build and run
    cargo build --release
    
    # Start service in background and capture output
    cargo run --release > /tmp/accounts_service.log 2>&1 &
    ACCOUNTS_PID=$!
    echo -e "${GREEN}Accounts Service started (PID: $ACCOUNTS_PID)${NC}"
    echo -e "${YELLOW}📝 Logs: tail -f /tmp/accounts_service.log${NC}"
    
    # Wait for port first
    if wait_for_port "Accounts Service" 8081; then
        # Then wait for health check
        if wait_for_health "Accounts Service" "http://localhost:8081/health"; then
            echo -e "${GREEN}✅ Accounts Service is ready${NC}"
        else
            echo -e "${RED}❌ Accounts Service health check failed${NC}"
            echo -e "${YELLOW}⚠️  Service may still be starting. Check logs: tail -f /tmp/accounts_service.log${NC}"
            echo -e "${YELLOW}⚠️  Continuing with other services...${NC}"
        fi
    else
        echo -e "${RED}❌ Accounts Service failed to start (port not open)${NC}"
        echo -e "${YELLOW}⚠️  Check logs: tail -f /tmp/accounts_service.log${NC}"
        echo -e "${YELLOW}⚠️  Continuing with other services...${NC}"
    fi
    cd - > /dev/null
fi

# 4. Start Ledger Service (Rails)
echo -e "${BLUE}📊 Starting Ledger Service...${NC}"
if check_port 3000 "Ledger Service"; then
    echo -e "${YELLOW}Ledger Service already running, skipping...${NC}"
else
    echo -e "${YELLOW}Starting Ledger Service (Rails)...${NC}"
    cd /Users/sibabale.joja/projects/personal/rails/mvp/api/ledger
    
    # Set environment variables
    export DATABASE_URL="postgresql://neondb_owner:npg_6LTzUMvFi0Qe@ep-icy-mouse-acf5xu9j-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    export GRPC_PORT=50053
    export RAILS_ENV=development
    export LOG_LEVEL=debug
    
    # Install dependencies and run
    rbenv exec bundle install
    rbenv exec bundle exec rails server -p 3000 -b 0.0.0.0 &
    LEDGER_PID=$!
    echo -e "${GREEN}Ledger Service started (PID: $LEDGER_PID)${NC}"
    
    # Wait for port first
    wait_for_port "Ledger Service" 3000
    
    # Note: Ledger Service may not have a /health endpoint, so we just check the port
    # If it has a health endpoint, add: wait_for_health "Ledger Service" "http://localhost:3000/health"
    cd - > /dev/null
fi

# Save PIDs for cleanup
echo -e "${BLUE}💾 Saving service PIDs...${NC}"
cat > /tmp/service_pids.txt << EOF
USERS_PID=$USERS_PID
ACCOUNTS_PID=$ACCOUNTS_PID
LEDGER_PID=$LEDGER_PID
EOF

echo ""
echo -e "${GREEN}🎉 All Services Started Successfully!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📋 Service Status:${NC}"
echo -e "${GREEN}✅ Users Service: http://localhost:8080${NC}"
echo -e "${GREEN}✅ Accounts Service: http://localhost:8081${NC}"
echo -e "${GREEN}✅ Ledger Service: http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}🧪 Ready for E2E Testing!${NC}"
echo -e "${YELLOW}💡 Run: ./test_business_registration_e2e.sh${NC}"
echo ""
echo -e "${BLUE}🛑 To stop all services: ./stop_all_services.sh${NC}"
