#!/bin/bash

# Test script for creating a user via the Rails Users Service API
# This script will test the full user creation flow with NATS messaging

set -e

USER_SERVICE_URL="http://localhost:8080"
ORG_ID="123e4567-e89b-12d3-a456-426614174000"
USER_EMAIL="test.user@example.com"
USER_NAME="Test User"
USER_PHONE="+1234567890"

echo "🧪 Testing Rails Users Service - User Creation Flow"
echo "================================================"
echo ""

# Check if the users service is running
echo "🔍 Checking if Users Service is running..."
if ! curl -s "$USER_SERVICE_URL/actuator/health" > /dev/null; then
    echo "❌ Error: Users Service is not running on $USER_SERVICE_URL"
    echo "Please start the service with: ./run-dev.sh"
    exit 1
fi

echo "✅ Users Service is running"
echo ""

# Test user creation
echo "👤 Creating a new user..."
echo "Organization ID: $ORG_ID"
echo "Name: $USER_NAME"
echo "Email: $USER_EMAIL"
echo "Phone: $USER_PHONE"
echo ""

# Create the user via POST request
RESPONSE=$(curl -s -X POST "$USER_SERVICE_URL/users" \
    -H "Content-Type: application/json" \
    -d "{
        \"organizationId\": \"$ORG_ID\",
        \"name\": \"$USER_NAME\",
        \"email\": \"$USER_EMAIL\",
        \"phone\": \"$USER_PHONE\",
        \"role\": \"USER\",
        \"metadata\": {
            \"source\": \"test-script\",
            \"createdAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }
    }" \
    -w "\nHTTP_STATUS:%{http_code}")

# Extract HTTP status code
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "📡 API Response:"
echo "HTTP Status: $HTTP_STATUS"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Check if user creation was successful
if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ User created successfully!"

    # Extract user ID from response
    USER_ID=$(echo "$RESPONSE_BODY" | jq -r '.id' 2>/dev/null || echo "unknown")
    echo "📋 User ID: $USER_ID"
    echo ""

    echo "📡 Expected NATS Messages:"
    echo "- Subject: users.user.created"
    echo "- Stream: rails_events"
    echo "- Payload should contain user details"
    echo ""

    echo "🔗 Expected gRPC Call to Accounts Service:"
    echo "- Service: AccountService.CreateAccount"
    echo "- Should create a default account for the user"
    echo ""

    # Test retrieving the created user
    echo "🔍 Retrieving created user..."
    if [ "$USER_ID" != "unknown" ] && [ "$USER_ID" != "null" ]; then
        USER_DETAILS=$(curl -s "$USER_SERVICE_URL/users/$USER_ID" || echo "Failed to fetch user")
        echo "📋 User Details:"
        echo "$USER_DETAILS" | jq '.' 2>/dev/null || echo "$USER_DETAILS"
    else
        echo "⚠️  Cannot retrieve user - ID not found in response"
    fi

else
    echo "❌ User creation failed!"
    echo "Expected HTTP 200/201, got: $HTTP_STATUS"

    if echo "$RESPONSE_BODY" | jq '.' >/dev/null 2>&1; then
        echo "Error details:"
        echo "$RESPONSE_BODY" | jq '.'
    else
        echo "Raw response: $RESPONSE_BODY"
    fi
    exit 1
fi

echo ""
echo "🎉 Test completed successfully!"
echo ""
echo "Next steps to verify full integration:"
echo "1. Check NATS server logs for published messages"
echo "2. Start the Accounts Service to handle gRPC calls"
echo "3. Verify account creation in the database"
echo ""
echo "To monitor NATS messages in real-time:"
echo "nats sub 'users.user.created' --server=nats://localhost:4222"
echo ""
