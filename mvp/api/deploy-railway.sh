#!/bin/bash

# =============================================================================
# Rails Infrastructure - Railway Deployment Script
# =============================================================================
# This script automates the deployment of the Rails Banking Infrastructure
# to Railway, including NATS, Accounts Service, and Users Service.
#
# Usage:
#   ./deploy-railway.sh [command]
#
# Commands:
#   all         Deploy all services (NATS, Accounts, Users)
#   nats        Deploy NATS server only
#   accounts    Deploy Accounts service only
#   users       Deploy Users service only
#   status      Check status of all services
#   logs        View logs for a service
#   help        Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="rails-infrastructure"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI is not installed."
        echo "Install it with: npm install -g @railway/cli"
        echo "Or visit: https://docs.railway.app/develop/cli"
        exit 1
    fi
    log_success "Railway CLI is installed"
}

check_railway_auth() {
    if ! railway whoami &> /dev/null; then
        log_error "Not logged in to Railway."
        echo "Run: railway login"
        exit 1
    fi
    log_success "Authenticated with Railway"
}

print_banner() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}        Rails Banking Infrastructure Deployment           ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}                    Railway Platform                       ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# =============================================================================
# Deployment Functions
# =============================================================================

deploy_nats() {
    log_info "Deploying NATS server..."
    echo ""
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  NATS must be deployed via Railway Dashboard              ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Steps to deploy NATS:"
    echo ""
    echo "  1. Go to: https://railway.app/project/${PROJECT_NAME}"
    echo "     Or run: railway open"
    echo ""
    echo "  2. Click '+ New' → 'Docker Image'"
    echo ""
    echo "  3. Enter image: nats:latest"
    echo ""
    echo "  4. Name the service: nats"
    echo ""
    echo "  5. Add environment variable:"
    echo "     NATS_JETSTREAM=enabled"
    echo ""
    echo "  6. Click 'Deploy'"
    echo ""
    echo "  7. Wait for deployment to complete"
    echo ""
    echo "  8. Verify in logs:"
    echo "     - 'Listening for client connections on 0.0.0.0:4222'"
    echo "     - 'Server is ready'"
    echo ""
    read -p "Press Enter once NATS is deployed to continue..."
    log_success "NATS deployment acknowledged"
}

deploy_accounts() {
    log_info "Deploying Accounts service (Rust)..."

    cd "${SCRIPT_DIR}/accounts"

    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found in accounts directory"
        exit 1
    fi

    log_info "Linking to Railway project..."
    railway link

    log_info "Deploying Accounts service..."
    railway up --detach

    echo ""
    log_warn "Don't forget to set environment variables!"
    echo ""
    echo "Required variables for accounts-service:"
    echo "  DATABASE_URL=postgresql://...(your Neon connection string)"
    echo "  PORT=8081"
    echo "  GRPC_PORT=9090"
    echo "  HOST=0.0.0.0"
    echo "  NATS_URL=nats://\${{nats.RAILWAY_PRIVATE_DOMAIN}}:4222"
    echo "  NATS_STREAM=rails_events"
    echo "  RUST_LOG=info"
    echo ""
    echo "Set them in Railway Dashboard or with:"
    echo "  railway variables set KEY=value"
    echo ""

    log_success "Accounts service deployment initiated"
}

deploy_users() {
    log_info "Deploying Users service (Rust)..."

    cd "${SCRIPT_DIR}/users"

    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found in users directory"
        exit 1
    fi

    log_info "Linking to Railway project..."
    railway link

    log_info "Deploying Users service..."
    railway up --detach

    echo ""
    log_warn "Don't forget to set environment variables!"
    echo ""
    echo "Required variables for users-service:"
    echo "  PORT=8080"
    echo "  SERVER_ADDR=0.0.0.0:8080"
    echo "  DATABASE_URL=postgresql://...(your Neon connection string)"
    echo "  NATS_URL=nats://\${{nats.RAILWAY_PRIVATE_DOMAIN}}:4222"
    echo "  NATS_STREAM=rails_events"
    echo "  RUST_LOG=info"
    echo ""

    log_success "Users service deployment initiated"
}

deploy_all() {
    log_info "Deploying all services..."
    echo ""

    # Step 1: NATS
    echo "═══════════════════════════════════════════════════════════"
    echo "Step 1/3: NATS Server"
    echo "═══════════════════════════════════════════════════════════"
    deploy_nats
    echo ""

    # Step 2: Accounts
    echo "═══════════════════════════════════════════════════════════"
    echo "Step 2/3: Accounts Service"
    echo "═══════════════════════════════════════════════════════════"
    deploy_accounts
    echo ""

    # Wait for accounts to be ready
    log_info "Waiting for Accounts service to be ready..."
    echo "This is important because Users service depends on Accounts gRPC"
    read -p "Press Enter once Accounts service is running..."
    echo ""

    # Step 3: Users
    echo "═══════════════════════════════════════════════════════════"
    echo "Step 3/3: Users Service"
    echo "═══════════════════════════════════════════════════════════"
    deploy_users
    echo ""

    log_success "All services deployment initiated!"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "Next Steps:"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "1. Set environment variables for each service"
    echo "2. Generate public domain for users-service:"
    echo "   railway domain --service users-service"
    echo "3. Verify all services are healthy:"
    echo "   ./deploy-railway.sh status"
    echo "4. Test the deployment:"
    echo "   curl -X POST https://your-users-domain.railway.app/api/v1/business/register -H \"Content-Type: application/json\" -d '{\"name\":\"Test Business\",\"admin_email\":\"admin@test.com\",\"admin_password\":\"password123\"}'"
    echo ""
}

show_status() {
    log_info "Checking Railway project status..."
    railway status
}

show_logs() {
    echo "Available services:"
    echo "  1. nats"
    echo "  2. accounts-service"
    echo "  3. users-service"
    echo ""
    read -p "Enter service name: " service_name

    if [ -z "$service_name" ]; then
        log_error "No service name provided"
        exit 1
    fi

    log_info "Fetching logs for ${service_name}..."
    railway logs --service "$service_name"
}

generate_domain() {
    read -p "Enter service name (default: users-service): " service_name
    service_name=${service_name:-users-service}

    log_info "Generating domain for ${service_name}..."
    railway domain --service "$service_name"
}

show_help() {
    echo "Usage: ./deploy-railway.sh [command]"
    echo ""
    echo "Commands:"
    echo "  all         Deploy all services (NATS, Accounts, Users)"
    echo "  nats        Instructions for deploying NATS server"
    echo "  accounts    Deploy Accounts service"
    echo "  users       Deploy Users service"
    echo "  status      Check status of all services"
    echo "  logs        View logs for a service"
    echo "  domain      Generate public domain for a service"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy-railway.sh all        # Deploy everything"
    echo "  ./deploy-railway.sh accounts   # Deploy just accounts"
    echo "  ./deploy-railway.sh logs       # View service logs"
    echo ""
}

# =============================================================================
# Main Script
# =============================================================================

print_banner

# Check prerequisites
log_info "Checking prerequisites..."
check_railway_cli
check_railway_auth
echo ""

# Parse command
COMMAND=${1:-help}

case $COMMAND in
    all)
        deploy_all
        ;;
    nats)
        deploy_nats
        ;;
    accounts)
        deploy_accounts
        ;;
    users)
        deploy_users
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    domain)
        generate_domain
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
