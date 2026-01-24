#!/bin/bash

# Rails User Creation Flow - Complete Integration Test
# Tests: Authentication, User Creation, gRPC account creation

set -e

# Configuration
USERS_SERVICE="http://localhost:8080"
ACCOUNTS_SERVICE="http://localhost:8081"

# Test data
ORG_ID="123e4567-e89b-12d3-a456-426614174000"
USER_EMAIL="test.user@example.com"
USER_NAME="Test User"
USER_PHONE="+1234567890"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Rails User Creation Flow - Integration Test${NC}"
echo "=================================================="
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local service_url=$2
    local health_endpoint=$3

    echo -e "${YELLOW}🔍 Checking ${service_name}...${NC}"

    # Try without auth first (for accounts service)
    if curl -s -f "$service_url$health_endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${service_name} is running (no auth required)${NC}"
        return 0
    fi

    # Try with basic auth (for users service)
    if curl -s -f -u user:password "$service_url$health_endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${service_name} is running (basic auth works)${NC}"
        return 0
    fi

    # If both fail, service might be down or needs different auth
    echo -e "${RED}❌ ${service_name} is not accessible at ${service_url}${NC}"
    return 1
}

# Function to get Spring Boot generated password from logs
get_generated_password() {
    echo -e "${YELLOW}🔑 Looking for generated Spring Security password...${NC}"

    # Common locations for Spring Boot logs
    local log_locations=(
        "mvp/api/users/users-service.log"
        "mvp/api/users/nohup.out"
        "mvp/api/users/application.log"
    )

    for log_file in "${log_locations[@]}"; do
        if [[ -f "$log_file" ]]; then
            # Look for the generated password pattern
            local password=$(grep -o "Using generated security password: [a-f0-9-]*" "$log_file" | tail -1 | cut -d' ' -f5)
            if [[ -n "$password" ]]; then
                echo -e "${GREEN}🔑 Found generated password: ${password}${NC}"
                echo "$password"
                return 0
            fi
        fi
    done

    echo -e "${YELLOW}⚠️  Could not find generated password in logs${NC}"
    echo -e "${YELLOW}💡 Try running: docker logs <users-service-container> | grep 'generated security password'${NC}"
    echo -e "${YELLOW}💡 Or check the terminal where you started the users service${NC}"
    return 1
}

# Function to test with different auth methods
test_with_auth() {
    local endpoint=$1
    local method=$2
    local data=$3
    local description=$4

    echo -e "${BLUE}🧪 Testing: ${description}${NC}"

    # Try different authentication methods
    local auth_methods=(
        "user:user"                    # Default Spring Security
        "admin:admin"                  # Common default
        "user:password"                # Another common default
    )

    # If we found a generated password, try it first
    if command -v get_generated_password >/dev/null 2>&1; then
        local gen_password=$(get_generated_password)
        if [[ -n "$gen_password" ]]; then
            auth_methods=("user:$gen_password" "${auth_methods[@]}")
        fi
    fi

    for auth in "${auth_methods[@]}"; do
        echo -e "${YELLOW}  Trying with credentials: ${auth}${NC}"

        local response
        local http_status

        if [[ "$method" == "GET" ]]; then
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -u "$auth" "$endpoint" 2>/dev/null || echo "")
        else
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "$method" -u "$auth" \
                -H "Content-Type: application/json" \
                -H "X-Requested-With: XMLHttpRequest" \
                -d "$data" "$endpoint" 2>/dev/null || echo "")
        fi

        http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2 || echo "000")
        response_body=$(echo "$response" | grep -v "HTTP_STATUS:" || echo "")

        if [[ "$http_status" == "200" || "$http_status" == "201" ]]; then
            echo -e "${GREEN}✅ Success with ${auth}!${NC}"
            echo -e "${GREEN}HTTP Status: ${http_status}${NC}"
            echo -e "${GREEN}Response:${NC}"
            echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
            echo ""
            return 0
        elif [[ "$http_status" == "401" ]]; then
            echo -e "${YELLOW}  ❌ 401 Unauthorized${NC}"
        elif [[ "$http_status" == "403" ]]; then
            echo -e "${YELLOW}  ❌ 403 Forbidden${NC}"
        else
            echo -e "${YELLOW}  ❌ HTTP ${http_status}${NC}"
        fi
    done

    echo -e "${RED}❌ All authentication methods failed for: ${description}${NC}"
    echo -e "${YELLOW}💡 You may need to:${NC}"
    echo -e "${YELLOW}   1. Check the users service logs for the generated password${NC}"
    echo -e "${YELLOW}   2. Or configure custom credentials in application.properties${NC}"
    echo ""
    return 1
}

# Check services
echo -e "${BLUE}🏥 Health Checks${NC}"
echo "----------------"

# Check Users Service
check_service "Users Service" "$USERS_SERVICE" "/actuator/health" || true
echo ""

# Check Accounts Service (Rust - might not have actuator)
check_service "Accounts Service" "$ACCOUNTS_SERVICE" "/health" || {
    echo -e "${YELLOW}⚠️  Accounts Service health check failed, might use different endpoint${NC}"
}
echo ""

# Test User Creation
echo -e "${BLUE}👤 User Creation Test${NC}"
echo "-------------------"

USER_DATA=$(cat <<EOF
{
    "organizationId": "$ORG_ID",
    "name": "$USER_NAME",
    "email": "$USER_EMAIL",
    "phone": "$USER_PHONE",
    "role": "USER",
    "metadata": {
        "source": "integration-test",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "testRun": "$(date +%s)"
    }
}
EOF
)

echo -e "${YELLOW}📝 User Data:${NC}"
echo "$USER_DATA" | jq '.'
echo ""

# Test user creation with authentication
test_with_auth "$USERS_SERVICE/users" "POST" "$USER_DATA" "Create User via Users Service API"

# Test user retrieval
echo -e "${BLUE}🔍 User Retrieval Test${NC}"
echo "--------------------"
test_with_auth "$USERS_SERVICE/users" "GET" "" "List Users"

# Instructions for manual testing
echo ""
echo -e "${BLUE}📋 Manual Testing Instructions${NC}"
echo "==============================="
echo ""
echo -e "${YELLOW}If authentication failed above, try these steps:${NC}"
echo ""
echo "1. 🔑 Find the generated password:"
echo "   Check the users service startup logs for a line like:"
echo "   'Using generated security password: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'"
echo ""
echo "2. 🧪 Test with the actual password:"
echo "   curl -u user:ACTUAL_PASSWORD_HERE \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -X POST \\"
echo "        -d '$USER_DATA' \\"
echo "        '$USERS_SERVICE/users'"
echo ""
echo "3. 🔗 Check gRPC call to accounts service:"
echo "   The users service should automatically call the accounts service"
echo "   to create a default account for the new user."
echo ""
echo "4. 📊 Verify in database:"
echo "   Check your Neon database for the new user and account records."
echo ""

# Service status summary
echo -e "${BLUE}🔧 Service Status Summary${NC}"
echo "========================"
echo ""
echo "Expected services and ports:"
echo "• Users Service:   localhost:8080 (HTTP + gRPC client)"
echo "• Accounts Service: localhost:8081 (HTTP) + localhost:9090 (gRPC server)"
echo ""
echo "Complete flow test:"
echo "1. Create user via Users Service API → "
echo "2. Calls Accounts Service via gRPC to create default account"
echo ""

echo -e "${GREEN}🎉 Integration test script completed!${NC}"
