@echo off
REM Rails Users Service - Development Startup Script (Windows)
REM This script sets up environment variables and starts the Spring Boot application

REM Set environment variables for development
set DATABASE_URL=jdbc:postgresql://ep-restless-wildflower-acl41u3o-pooler.sa-east-1.aws.neon.tech/neondb?user=neondb_owner&password=npg_E9Fwn5vWqUoe&sslmode=require&channelBinding=require
set NATS_ENABLED=false
set PORT=8080
set SPRING_PROFILES_ACTIVE=local

REM Optional: JWT Configuration (uncomment if needed)
REM set JWT_ISSUER=rails-users
REM set JWT_ACCESS_TTL_SECONDS=900
REM set JWT_REFRESH_TTL_SECONDS=2592000

REM Optional: NATS Configuration (uncomment if needed)
REM set NATS_URL=nats://localhost:4222
REM set NATS_STREAM=rails_events
REM set NATS_SUBJECT_USER_CREATED=users.user.created
REM set NATS_SUBJECT_ACCOUNT_CREATED=accounts.account.created

REM Optional: Accounts gRPC Configuration (uncomment if needed)
REM set ACCOUNTS_GRPC_HOST=localhost
REM set ACCOUNTS_GRPC_PORT=9090

echo 🚀 Starting Rails Users Service in development mode...
echo 📊 Database: Neon PostgreSQL
echo 🔌 Port: %PORT%
echo 📡 NATS: %NATS_ENABLED%
echo.

REM Run the Spring Boot application
mvn spring-boot:run
