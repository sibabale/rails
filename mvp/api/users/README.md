# Rails Users Service

A Spring Boot microservice for user management in the Rails platform.

## Quick Start

### Prerequisites

- Java 21 or higher
- Maven 3.6+
- Access to Neon PostgreSQL database

### Running the Application

You have several options to run the application:

#### Option 1: Using the Development Script (Recommended)

**Linux/macOS:**
```bash
./run-dev.sh
```

**Windows:**
```cmd
run-dev.bat
```

#### Option 2: Using Maven Profile
```bash
mvn spring-boot:run -Pdev
```

#### Option 3: Using Environment Variables
```bash
# Set environment variables
export DATABASE_URL="jdbc:postgresql://your-neon-host/neondb?user=username&password=password&sslmode=require&channelBinding=require"
export NATS_ENABLED=false
export SPRING_PROFILES_ACTIVE=local

# Run the application
mvn spring-boot:run
```

#### Option 4: Using application-local.properties
The application includes `application-local.properties` with pre-configured development settings. Simply activate the `local` profile:

```bash
mvn spring-boot:run -Dspring.profiles.active=local
```

## Configuration

### Database Configuration

The application uses Neon PostgreSQL. Configure your database connection using one of these methods:

1. **Environment Variable (Recommended):**
   ```bash
   DATABASE_URL="jdbc:postgresql://your-host/database?user=username&password=password&sslmode=require&channelBinding=require"
   ```

2. **Application Properties:**
   Update `src/main/resources/application-local.properties` with your database details.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL JDBC connection string | Required |
| `NATS_ENABLED` | Enable/disable NATS messaging | `false` |
| `PORT` | Server port | `8080` |
| `SPRING_PROFILES_ACTIVE` | Spring profile to activate | `default` |
| `JWT_ISSUER` | JWT token issuer | `rails-users` |
| `ACCOUNTS_GRPC_HOST` | Accounts service gRPC host | `localhost` |
| `ACCOUNTS_GRPC_PORT` | Accounts service gRPC port | `9090` |

## Development

### Building the Project
```bash
mvn clean compile
```

### Running Tests
```bash
mvn test
```

### Packaging
```bash
mvn clean package
```

## API Documentation

Once the application is running, you can access:

- **Application:** http://localhost:8080
- **Health Check:** http://localhost:8080/actuator/health
- **Metrics:** http://localhost:8080/actuator/prometheus

## Project Structure

```
src/
├── main/
│   ├── java/com/rails/users/
│   │   ├── api/          # API controllers and DTOs
│   │   ├── client/       # External service clients
│   │   ├── config/       # Configuration classes
│   │   ├── controller/   # REST controllers
│   │   ├── event/        # Event handling
│   │   ├── model/        # JPA entities
│   │   ├── repository/   # Data access layer
│   │   ├── security/     # Security configuration
│   │   ├── service/      # Business logic
│   │   └── util/         # Utility classes
│   ├── proto/            # Protocol Buffer definitions
│   └── resources/
│       ├── db/changelog/ # Liquibase database migrations
│       └── application.yml
└── test/                 # Test classes
```

## Database Migrations

This project uses Liquibase for database schema management. Migration files are located in `src/main/resources/db/changelog/`.

## Docker Support

A Dockerfile is included for containerized deployments:

```bash
# Build the image
docker build -t rails-users-service .

# Run the container
docker run -p 8080:8080 \
  -e DATABASE_URL="your-connection-string" \
  -e NATS_ENABLED=false \
  rails-users-service
```

## Troubleshooting

### Common Issues

1. **"URL must start with 'jdbc'" error:**
   - Ensure your `DATABASE_URL` starts with `jdbc:postgresql://`
   - Check that special characters in the URL are properly encoded

2. **Connection timeout:**
   - Verify your Neon database is accessible
   - Check firewall settings and network connectivity

3. **Maven build fails:**
   - Ensure Java 21+ is installed and `JAVA_HOME` is set correctly
   - Clear Maven cache: `rm -rf ~/.m2/repository`

### Logs

The application uses structured logging. Key loggers:

- `com.rails.users` - Application logs
- `org.springframework` - Spring Framework logs
- `org.hibernate` - Database/JPA logs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is part of the Rails platform and follows the project's licensing terms.