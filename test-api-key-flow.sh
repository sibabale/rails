#!/bin/bash

set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:8080}
CORRELATION_ID=${CORRELATION_ID:-test-$(date +%s)}

BUSINESS_NAME=${BUSINESS_NAME:-Acme Inc}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin+$(date +%s)@example.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-Password123!}

register_payload=$(jq -n \
  --arg name "$BUSINESS_NAME" \
  --arg admin_first_name "Admin" \
  --arg admin_last_name "User" \
  --arg admin_email "$ADMIN_EMAIL" \
  --arg admin_password "$ADMIN_PASSWORD" \
  '{name: $name, website: null, admin_first_name: $admin_first_name, admin_last_name: $admin_last_name, admin_email: $admin_email, admin_password: $admin_password}')

register_res=$(curl -sS -X POST "$BASE_URL/api/v1/business/register" \
  -H "content-type: application/json" \
  -H "x-correlation-id: $CORRELATION_ID" \
  -d "$register_payload")

SANDBOX_ENV_ID=$(echo "$register_res" | jq -r '.environments[] | select(.type=="sandbox") | .id')

login_payload=$(jq -n --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" --arg environment_id "$SANDBOX_ENV_ID" '{email:$email,password:$password,environment_id:$environment_id}')

login_res=$(curl -sS -X POST "$BASE_URL/api/v1/auth/login" \
  -H "content-type: application/json" \
  -H "x-correlation-id: $CORRELATION_ID" \
  -d "$login_payload")

ACCESS_TOKEN=$(echo "$login_res" | jq -r '.access_token')

create_key_payload=$(jq -n --arg environment_id "$SANDBOX_ENV_ID" '{environment_id:$environment_id}')

create_key_res=$(curl -sS -X POST "$BASE_URL/api/v1/api-keys" \
  -H "content-type: application/json" \
  -H "x-correlation-id: $CORRELATION_ID" \
  -H "x-environment-id: $SANDBOX_ENV_ID" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -d "$create_key_payload")

API_KEY=$(echo "$create_key_res" | jq -r '.key')

new_user_email="user+$(date +%s)@example.com"
create_user_payload=$(jq -n \
  --arg first_name "Test" \
  --arg last_name "User" \
  --arg email "$new_user_email" \
  --arg password "Password123!" \
  '{first_name:$first_name,last_name:$last_name,email:$email,password:$password}')

create_user_res=$(curl -sS -X POST "$BASE_URL/api/v1/users" \
  -H "content-type: application/json" \
  -H "x-correlation-id: $CORRELATION_ID" \
  -H "x-environment-id: $SANDBOX_ENV_ID" \
  -H "x-api-key: $API_KEY" \
  -d "$create_user_payload")

echo "$create_user_res" | jq '.'
