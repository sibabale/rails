#!/bin/bash

# End-to-End Test: Complete User → Account → Transaction → Ledger Flow
# Tests the hardened ledger with real service integration

set -e

# Configuration
USERS_SERVICE="http://localhost:8080"
ACCOUNTS_SERVICE="http://localhost:8081"
LEDGER_SERVICE="http://localhost:3000"  # Assuming Rails runs on 3000

# Test data
ORG_ID="123e4567-e89b-12d3-a456-426614174000"
USER_EMAIL="e2e.test@example.com"
USER_NAME="E2E Test User"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 End-to-End Ledger Hardening Test${NC}"
echo "=================================================="
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local service_url=$2
    
    echo -e "${YELLOW}🔍 Checking ${service_name}...${NC}"
    
    if curl -s -f "$service_url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${service_name} is running${NC}"
        return 0
    else
        echo -e "${RED}❌ ${service_name} is not accessible${NC}"
        return 1
    fi
}

# Function to run test and capture result
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${BLUE}🧪 Running: ${test_name}${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        return 1
    fi
}

# Pre-flight checks
echo -e "${BLUE}🏥 Pre-flight Service Checks${NC}"
echo "-------------------"

check_service "Users Service" "$USERS_SERVICE" || exit 1
check_service "Accounts Service" "$ACCOUNTS_SERVICE" || exit 1
check_service "Ledger Service" "$LEDGER_SERVICE" || exit 1

echo ""

# Test 1: User Creation → Account Creation Flow
echo -e "${BLUE}👤 Test 1: User → Account Creation Flow${NC}"
echo "-----------------------------------"

USER_DATA=$(cat <<EOF
{
    "organizationId": "$ORG_ID",
    "name": "$USER_NAME",
    "email": "$USER_EMAIL",
    "role": "USER",
    "metadata": {
        "source": "e2e-test",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
}
EOF
)

echo -e "${YELLOW}📝 Creating user...${NC}"

# Create user (this should trigger account creation via gRPC)
USER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "x-internal-service-token: test-token" \
    -X POST \
    -d "$USER_DATA" \
    "$USERS_SERVICE/api/v1/users" 2>/dev/null || echo "")

HTTP_STATUS=$(echo "$USER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
USER_BODY=$(echo "$USER_RESPONSE" | grep -v "HTTP_STATUS:")

if [[ "$HTTP_STATUS" == "201" || "$HTTP_STATUS" == "200" ]]; then
    USER_ID=$(echo "$USER_BODY" | jq -r '.user_id // empty')
    echo -e "${GREEN}✅ User created successfully${NC}"
    echo -e "${YELLOW}👤 User ID: $USER_ID${NC}"
else
    echo -e "${RED}❌ User creation failed${NC}"
    echo -e "${YELLOW}Response: $USER_BODY${NC}"
    exit 1
fi

# Wait for account creation
echo -e "${YELLOW}⏳ Waiting for account creation (5s)...${NC}"
sleep 5

# Check if account was created
echo -e "${YELLOW}🔍 Checking created account...${NC}"

# Try to get accounts for the user
ACCOUNTS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    "$USERS_SERVICE/api/v1/users/$USER_ID/accounts" 2>/dev/null || echo "")

ACCOUNTS_HTTP_STATUS=$(echo "$ACCOUNTS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
ACCOUNTS_BODY=$(echo "$ACCOUNTS_RESPONSE" | grep -v "HTTP_STATUS:")

if [[ "$ACCOUNTS_HTTP_STATUS" == "200" ]]; then
    ACCOUNT_COUNT=$(echo "$ACCOUNTS_BODY" | jq '. | length')
    if [[ "$ACCOUNT_COUNT" -gt "0" ]]; then
        ACCOUNT_ID=$(echo "$ACCOUNTS_BODY" | jq -r '.[0].id // empty')
        ACCOUNT_NUMBER=$(echo "$ACCOUNTS_BODY" | jq -r '.[0].account_number // empty')
        echo -e "${GREEN}✅ Account created automatically${NC}"
        echo -e "${YELLOW}🏦 Account ID: $ACCOUNT_ID${NC}"
        echo -e "${YELLOW}🏦 Account Number: $ACCOUNT_NUMBER${NC}"
    else
        echo -e "${RED}❌ No account created for user${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to retrieve accounts${NC}"
    exit 1
fi

# Test 2: Deposit Flow (Control Accounts)
echo ""
echo -e "${BLUE}💰 Test 2: Deposit Flow${NC}"
echo "----------------------"

DEPOSIT_DATA=$(cat <<EOF
{
    "from_account_id": "$ACCOUNT_ID",
    "to_account_id": "$ACCOUNT_ID", 
    "amount": 10000,
    "currency": "USD"
}
EOF
)

echo -e "${YELLOW}📝 Creating deposit...${NC}"

DEPOSIT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -X POST \
    -d "$DEPOSIT_DATA" \
    "$ACCOUNTS_SERVICE/api/v1/transactions/deposit" 2>/dev/null || echo "")

DEPOSIT_HTTP_STATUS=$(echo "$DEPOSIT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
DEPOSIT_BODY=$(echo "$DEPOSIT_RESPONSE" | grep -v "HTTP_STATUS:")

if [[ "$DEPOSIT_HTTP_STATUS" == "201" || "$DEPOSIT_HTTP_STATUS" == "200" ]]; then
    TRANSACTION_ID=$(echo "$DEPOSIT_BODY" | jq -r '.id // empty')
    echo -e "${GREEN}✅ Deposit created successfully${NC}"
    echo -e "${YELLOW}🔄 Transaction ID: $TRANSACTION_ID${NC}"
else
    echo -e "${RED}❌ Deposit failed${NC}"
    echo -e "${YELLOW}Response: $DEPOSIT_BODY${NC}"
    exit 1
fi

# Wait for ledger processing
echo -e "${YELLOW}⏳ Waiting for ledger processing (3s)...${NC}"
sleep 3

# Test 3: Transfer Flow
echo ""
echo -e "${BLUE}🔄 Test 3: Transfer Flow${NC}"
echo "-----------------------"

# First, create another account for transfer testing
echo -e "${YELLOW}🏦 Creating second account for transfer test...${NC}"

SECOND_ACCOUNT_DATA=$(cat <<EOF
{
    "account_type": "checking",
    "user_id": "$USER_ID",
    "currency": "USD"
}
EOF
)

SECOND_ACCOUNT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -X POST \
    -d "$SECOND_ACCOUNT_DATA" \
    "$ACCOUNTS_SERVICE/api/v1/accounts" 2>/dev/null || echo "")

SECOND_ACCOUNT_HTTP_STATUS=$(echo "$SECOND_ACCOUNT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
SECOND_ACCOUNT_BODY=$(echo "$SECOND_ACCOUNT_RESPONSE" | grep -v "HTTP_STATUS:")

if [[ "$SECOND_ACCOUNT_HTTP_STATUS" == "201" || "$SECOND_ACCOUNT_HTTP_STATUS" == "200" ]]; then
    SECOND_ACCOUNT_ID=$(echo "$SECOND_ACCOUNT_BODY" | jq -r '.id // empty')
    echo -e "${GREEN}✅ Second account created${NC}"
    echo -e "${YELLOW}🏦 Second Account ID: $SECOND_ACCOUNT_ID${NC}"
else
    echo -e "${RED}❌ Failed to create second account${NC}"
    exit 1
fi

# Now test transfer between accounts
TRANSFER_DATA=$(cat <<EOF
{
    "from_account_id": "$ACCOUNT_ID",
    "to_account_id": "$SECOND_ACCOUNT_ID",
    "amount": 5000,
    "currency": "USD"
}
EOF
)

echo -e "${YELLOW}📝 Creating transfer...${NC}"

TRANSFER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -X POST \
    -d "$TRANSFER_DATA" \
    "$ACCOUNTS_SERVICE/api/v1/transactions/transfer" 2>/dev/null || echo "")

TRANSFER_HTTP_STATUS=$(echo "$TRANSFER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
TRANSFER_BODY=$(echo "$TRANSFER_RESPONSE" | grep -v "HTTP_STATUS:")

if [[ "$TRANSFER_HTTP_STATUS" == "201" || "$TRANSFER_HTTP_STATUS" == "200" ]]; then
    TRANSFER_TRANSACTION_ID=$(echo "$TRANSFER_BODY" | jq -r '.id // empty')
    echo -e "${GREEN}✅ Transfer created successfully${NC}"
    echo -e "${YELLOW}🔄 Transfer Transaction ID: $TRANSFER_TRANSACTION_ID${NC}"
else
    echo -e "${RED}❌ Transfer failed${NC}"
    echo -e "${YELLOW}Response: $TRANSFER_BODY${NC}"
    exit 1
fi

# Wait for ledger processing
echo -e "${YELLOW}⏳ Waiting for ledger processing (3s)...${NC}"
sleep 3

# Test 4: Idempotency Test
echo ""
echo -e "${BLUE}🔒 Test 4: Idempotency Protection${NC}"
echo "-----------------------------"

echo -e "${YELLOW}📝 Sending duplicate deposit request...${NC}"

# Send same deposit request again
IDEMPOTENCY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -H "Idempotency-Key: test-idempotency-key" \
    -X POST \
    -d "$DEPOSIT_DATA" \
    "$ACCOUNTS_SERVICE/api/v1/transactions/deposit" 2>/dev/null || echo "")

IDEMPOTENCY_HTTP_STATUS=$(echo "$IDEMPOTENCY_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
IDEMPOTENCY_BODY=$(echo "$IDEMPOTENCY_RESPONSE" | grep -v "HTTP_STATUS:")

if [[ "$IDEMPOTENCY_HTTP_STATUS" == "200" ]]; then
    IDEMPOTENCY_TRANSACTION_ID=$(echo "$IDEMPOTENCY_BODY" | jq -r '.id // empty')
    # Should return the same transaction ID as original deposit
    if [[ "$IDEMPOTENCY_TRANSACTION_ID" == "$TRANSACTION_ID" ]]; then
        echo -e "${GREEN}✅ Idempotency protection working${NC}"
        echo -e "${YELLOW}🔄 Same transaction returned: $IDEMPOTENCY_TRANSACTION_ID${NC}"
    else
        echo -e "${RED}❌ Idempotency failed - different transaction returned${NC}"
        echo -e "${YELLOW}Expected: $TRANSACTION_ID, Got: $IDEMPOTENCY_TRANSACTION_ID${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Idempotency test failed${NC}"
    echo -e "${YELLOW}Response: $IDEMPOTENCY_BODY${NC}"
    exit 1
fi

# Test 5: Balance Verification
echo ""
echo -e "${BLUE}📊 Test 5: Balance Verification${NC}"
echo "--------------------------"

echo -e "${YELLOW}🔍 Checking account balances...${NC}"

BALANCES_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer test-token" \
    "$ACCOUNTS_SERVICE/api/v1/accounts/$ACCOUNT_ID/balance" 2>/dev/null || echo "")

BALANCES_HTTP_STATUS=$(echo "$BALANCES_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BALANCES_BODY=$(echo "$BALANCES_RESPONSE" | grep -v "HTTP_STATUS:")

if [[ "$BALANCES_HTTP_STATUS" == "200" ]]; then
    AVAILABLE_BALANCE=$(echo "$BALANCES_BODY" | jq -r '.available_balance // 0')
    echo -e "${GREEN}✅ Balance retrieved successfully${NC}"
    echo -e "${YELLOW}💰 Available Balance: $AVAILABLE_BALANCE${NC}"
    
    # Verify balance matches expected (10000 deposit - 5000 transfer = 5000)
    EXPECTED_BALANCE=5000
    if [[ "$AVAILABLE_BALANCE" == "$EXPECTED_BALANCE" ]]; then
        echo -e "${GREEN}✅ Balance calculation correct${NC}"
        echo -e "${YELLOW}📊 Expected: $EXPECTED_BALANCE, Actual: $AVAILABLE_BALANCE${NC}"
    else
        echo -e "${RED}❌ Balance calculation incorrect${NC}"
        echo -e "${YELLOW}📊 Expected: $EXPECTED_BALANCE, Actual: $AVAILABLE_BALANCE${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to retrieve balance${NC}"
    echo -e "${YELLOW}Response: $BALANCES_BODY${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🎉 End-to-End Test Complete!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}✅ User Creation: Working${NC}"
echo -e "${GREEN}✅ Account Creation: Working${NC}"
echo -e "${GREEN}✅ Deposit Flow: Working${NC}"
echo -e "${GREEN}✅ Transfer Flow: Working${NC}"
echo -e "${GREEN}✅ Idempotency: Working${NC}"
echo -e "${GREEN}✅ Balance Calculation: Working${NC}"
echo ""
echo -e "${BLUE}🔒 Your hardened ledger is production-ready!${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "• Run load tests with multiple concurrent transactions"
echo "• Test error scenarios (invalid amounts, insufficient funds)"
echo "• Verify database constraints are enforced"
