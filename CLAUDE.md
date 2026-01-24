# Rails API Project Context

## Project Overview
This is a financial API proof-of-concept (POC) that has transitioned to an MVP. The project handles transaction processing, ledger management, and banking integrations. The POC uses Node.js/Express, while the MVP uses a microservices architecture with Rust services and a Ruby on Rails ledger service.

**AI-Assisted Development:** This project uses Cursor IDE with AI assistance and MCP (Model Context Protocol) servers to accelerate development. See `AI_WORKFLOW.md` for detailed workflow examples and `MCP_COMMANDS.md` for available MCP commands.

## Tech Stack

### POC (Proof of Concept)
- **Backend:** Node.js/Express 5.x with Prisma ORM and Supabase (PostgreSQL)
- **Frontend:** React 18 with TypeScript, Vite, Tailwind CSS, Atomic Design, Redux Toolkit
- **Database:** Supabase (PostgreSQL) with connection pooling
- **Testing:** Jest, Supertest (backend), Vitest, React Testing Library (frontend)
- **Analytics:** PostHog for event tracking
- **Queue Processing:** In-memory transaction queue with cluster mode support

### MVP (Minimum Viable Product)
- **Backend Services:**
  - **Accounts Service:** Rust (Axum, SQLx, gRPC)
  - **Users Service:** Rust (Axum, SQLx, gRPC)
  - **Ledger Service:** Ruby on Rails 7.1.3 (PostgreSQL)
  - **Client Server:** TypeScript/Express (API gateway/proxy)
- **Frontend:**
  - **rails-web:** React 19 with Vite, Redux Toolkit, TypeScript
  - **web:** Full-stack app with Express backend, React 18 frontend, Drizzle ORM
- **Database:** PostgreSQL (Neon) with SQLx migrations (Rust services) and ActiveRecord migrations (Rails)
- **Testing:** Rust native testing, Rails testing framework
- **Documentation:** MDX-based documentation site (rails-docs)
- **SDK:** Auto-generated SDKs in multiple languages (rails-sdks)

## Project Structure
```
rails/
├── poc/                          # POC implementation
│   ├── api/                      # Node.js/Express API
│   │   ├── src/
│   │   │   ├── ledger/          # Ledger logic
│   │   │   ├── queue/           # Transaction queue
│   │   │   ├── metrics/         # Financial calculations
│   │   │   ├── routes/          # API endpoints
│   │   │   └── services/       # Business services
│   │   ├── prisma/              # Prisma schema and migrations
│   │   └── tests/               # Test suites
│   └── client/                  # React frontend
│       ├── components/         # Atomic design components
│       │   ├── atoms/
│       │   ├── molecules/
│       │   ├── organisms/
│       │   └── pages/
│       └── lib/                # API client, Redux store
├── mvp/                          # MVP implementation
│   ├── api/
│   │   ├── accounts/           # Rust accounts microservice
│   │   │   ├── src/
│   │   │   │   ├── handlers/   # HTTP handlers
│   │   │   │   ├── services/   # Business logic
│   │   │   │   ├── repositories/ # Data access
│   │   │   │   └── grpc/       # gRPC service
│   │   │   └── migrations/     # SQLx migrations
│   │   ├── users/              # Rust users microservice
│   │   │   ├── src/
│   │   │   │   ├── routes/    # API routes
│   │   │   │   ├── models/    # Domain models
│   │   │   │   └── auth/      # Authentication
│   │   │   └── migrations/     # SQLx migrations
│   │   └── ledger/             # Ruby on Rails ledger service
│   │       ├── app/
│   │       │   ├── models/    # ActiveRecord models
│   │       │   ├── services/  # Business services
│   │       │   └── grpc/      # gRPC handlers
│   │       └── db/            # Rails migrations
│   ├── rails-client-server/    # TypeScript Express API gateway
│   ├── rails-docs/             # MDX documentation site
│   ├── rails-sdks/             # Auto-generated SDKs (multi-language)
│   ├── rails-web/              # React 19 frontend (Vite)
│   └── web/                    # Full-stack app (Express + React)
│       ├── server/            # Express backend with Drizzle ORM
│       └── client/           # React frontend
├── .claude/                    # Claude Code context
├── .cursor/                    # Cursor rules
├── CLAUDE.md                   # Unified context file (this file)
├── AI_WORKFLOW.md              # AI-assisted development workflow guide
└── MCP_COMMANDS.md             # MCP commands reference
```

## Key Business Logic

### Ledger System
- **Transaction Processing:** Handle incoming transactions via webhook
- **Reserve Management:** Track available funds and handle insufficient reserve scenarios
- **Settlement:** Batch process pending transactions
- **Audit Logging:** Track all operations for compliance

### Banking Integration
- **Bank Connections:** Manage connections to various banks (FNB, ABSA, etc.)
- **Transaction Routing:** Route transactions between banks
- **Status Tracking:** Monitor bank connection status

### Metrics & Analytics
- **Financial Metrics:** Revenue, completion rates, bank distribution
- **Performance Monitoring:** Transaction processing times, error rates
- **Business Intelligence:** Dashboard with real-time metrics

## Development Guidelines

### Performance Best Practices

#### Database Performance

**POC (Prisma + Supabase):**
- Use Prisma's `select` to fetch only needed fields: `prisma.user.findMany({ select: { id: true, name: true } })`
- Implement pagination for large datasets: `prisma.transaction.findMany({ take: 20, skip: 0 })`
- Use `include` sparingly - prefer separate queries for related data to avoid N+1
- Add database indexes for frequently queried fields in `poc/api/prisma/schema.prisma`
- Use `findUnique` instead of `findFirst` when you have a unique constraint
- Batch operations using `prisma.$transaction` for multiple related operations

**MVP (SQLx + ActiveRecord):**
- Use SQLx connection pooling with appropriate max connections
- Implement prepared statements for frequently executed queries
- Use database transactions for atomic operations
- Add indexes in migration files for frequently queried columns
- Use `SELECT` with specific columns instead of `SELECT *`
- Leverage SQLx compile-time query checking
- For Rails: Use `includes`/`preload`/`eager_load` appropriately to avoid N+1 queries

#### API Performance
- Implement pagination in all list endpoints
- Add field selection to allow clients to specify needed fields
- Use compression (gzip/brotli) for API responses
- Cache frequently accessed data (bank lists, reserve information)
- Validate early to reject invalid requests before processing

#### Frontend Performance (React + TypeScript)
- Use Vite's code splitting for route-based lazy loading
- Implement tree shaking to eliminate unused code
- Use React.memo() for expensive components
- Implement useMemo/useCallback for expensive calculations
- Avoid inline object/function creation in render methods
- Follow atomic design principles for component organization

#### Memory Management
- Avoid memory leaks in queue processing
- Use object pooling for frequently allocated objects
- Implement proper cleanup for graceful shutdown
- Use Map/Set instead of objects for large datasets
- Stream large datasets instead of loading everything into memory

### Testing Strategy

#### Test Structure

**POC:**
- **Unit tests:** `*.test.js` or `*.test.ts` alongside source files
- **Integration tests:** `tests/integration/*.test.js`
- **E2E tests:** `tests/e2e/*.test.js`
- **Test utilities:** `tests/setup.js`

**MVP:**
- **Rust:** Unit tests in `#[cfg(test)]` modules, integration tests in `tests/` directory
- **Rails:** Test files in `test/` directory (Minitest) or `spec/` (RSpec)
- **Frontend:** Vitest for React components, React Testing Library

#### Testing Requirements
- Minimum 80% coverage for all modules
- 100% coverage for critical business logic
- Cover edge cases and error conditions
- Test both success and failure paths
- Every new feature file must have a corresponding test file
- Every edit to a feature file must update the corresponding test file
- For Rust: Use `cargo test` to run all tests
- For Rails: Use `rails test` or `rspec` to run test suites

#### Testing Tools

**POC:**
- **Jest** - Test runner and assertion library (backend)
- **Supertest** - HTTP endpoint testing
- **Vitest** - Test runner for frontend
- **React Testing Library** - Component testing
- **Prisma** - Database testing and seeding
- **Nock** - HTTP mocking

**MVP:**
- **Rust native testing** - Built-in `#[cfg(test)]` modules and `cargo test`
- **Rails testing** - Minitest or RSpec (as configured)
- **SQLx offline mode** - Compile-time query checking

### Code Quality Standards

#### General Principles
- Follow consistent naming conventions
- Use TypeScript for type safety
- Implement proper error handling
- Write self-documenting code
- Keep functions focused and single-purpose
- Use conventional commit format

#### Component Architecture (Atomic Design)
- **Atoms:** Basic building blocks (Button, Input, AnimatedCounter)
- **Molecules:** Simple combinations (FormField)
- **Organisms:** Complex components (Navigation, Footer, HeroSection)
- **Pages:** Page-level components (HomePage, DashboardPage)
- **Templates:** Layout templates (DashboardLayout, HomeLayout)

**Note:** POC client uses strict Atomic Design. MVP frontends may use different patterns.

#### Rust Service Architecture
- **Handlers:** HTTP request handlers (Axum route handlers)
- **Services:** Business logic layer
- **Repositories:** Data access layer (SQLx queries)
- **Models:** Domain models and DTOs
- **Errors:** Custom error types with `anyhow` and `thiserror`
- **Config:** Environment-based configuration loading

#### Rails Service Architecture
- **Models:** ActiveRecord models with business logic
- **Services:** Service objects for complex operations
- **Controllers:** Request handling (if REST API endpoints exist)
- **gRPC Handlers:** gRPC service implementations
- **Jobs:** Background job processing (if configured)

#### API Design
- Use RESTful conventions
- Implement proper HTTP status codes
- Provide meaningful error messages
- Use consistent response formats
- Implement rate limiting and validation

## Important Files to Know

### POC Backend Core Files
- `poc/api/index.js` - Cluster mode entry point
- `poc/api/start-single.js` - Single process entry point
- `poc/api/src/ledger/ledger.js` - Main ledger logic
- `poc/api/src/queue/queue.js` - Transaction processing queue
- `poc/api/src/metrics/metrics.js` - Financial calculations
- `poc/api/prisma/schema.prisma` - Database schema
- `poc/api/src/routes/` - API endpoints
- `poc/api/src/services/` - Business services (accounts, auth, email)

### POC Frontend Core Files
- `poc/client/App.tsx` - Main application component
- `poc/client/main.tsx` - Application entry point
- `poc/client/components/` - Atomic design components (atoms, molecules, organisms, pages)
- `poc/client/lib/api.ts` - API client
- `poc/client/lib/store.ts` - Redux store configuration
- `poc/client/lib/slices/` - Redux slices

### MVP Backend Core Files
- `mvp/api/accounts/src/main.rs` - Accounts service entry point
- `mvp/api/accounts/src/handlers/` - HTTP request handlers
- `mvp/api/accounts/src/services/` - Business logic
- `mvp/api/accounts/src/repositories/` - Data access layer
- `mvp/api/users/src/main.rs` - Users service entry point
- `mvp/api/users/src/routes/` - API routes
- `mvp/api/ledger/app/models/` - ActiveRecord models
- `mvp/api/ledger/app/services/` - Business services
- `mvp/rails-client-server/src/index.ts` - API gateway entry point

### MVP Frontend Core Files
- `mvp/rails-web/App.tsx` - Main application component
- `mvp/rails-web/state/store.ts` - Redux store
- `mvp/web/server/index.ts` - Express backend entry point
- `mvp/web/server/routes.ts` - API routes
- `mvp/web/client/` - React frontend components

### Configuration Files
- `poc/api/package.json` - POC backend dependencies
- `poc/client/package.json` - POC frontend dependencies
- `poc/api/jest.config.js` - Jest test configuration
- `poc/client/vitest.config.ts` - Vitest configuration
- `mvp/api/accounts/Cargo.toml` - Accounts service dependencies
- `mvp/api/users/Cargo.toml` - Users service dependencies
- `mvp/api/ledger/Gemfile` - Rails ledger dependencies

## Common Patterns

### Error Handling

**POC (JavaScript/Node.js):**
```javascript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', { error: error.message, context });
  throw new LedgerError('Operation failed', 'OPERATION_FAILED', { originalError: error.message });
}
```

**MVP (Rust):**
```rust
use anyhow::{Result, Context};

async fn operation() -> Result<()> {
    // Operation
    Ok(())
}

// In handler
match operation().await {
    Ok(result) => Ok(Json(result)),
    Err(e) => {
        tracing::error!("Operation failed: {}", e);
        Err(AppError::InternalError(e.to_string()))
    }
}
```

**MVP (Rails):**
```ruby
begin
  # Operation
rescue StandardError => e
  Rails.logger.error("Operation failed: #{e.message}")
  raise LedgerError.new("Operation failed", "OPERATION_FAILED")
end
```

### Database Transactions

**POC (Prisma):**
```javascript
const result = await prisma.$transaction(async (tx) => {
  // Multiple related operations
  return result;
});
```

**MVP (Rust/SQLx):**
```rust
let mut tx = pool.begin().await?;
// Multiple operations using &mut tx
tx.commit().await?;
```

**MVP (Rails):**
```ruby
ActiveRecord::Base.transaction do
  # Multiple related operations
end
```

### API Response Format

**POC (Express):**
```javascript
res.json({
  success: true,
  data: result,
  timestamp: new Date().toISOString()
});
```

**MVP (Rust/Axum):**
```rust
#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: T,
    timestamp: String,
}

Ok(Json(ApiResponse {
    success: true,
    data: result,
    timestamp: Utc::now().to_rfc3339(),
}))
```

### React Component Pattern
```typescript
interface Props {
  // Define props
}

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX
  );
};
```

## Security Considerations

### Authentication & Authorization
- Implement JWT-based authentication
- Use role-based access control
- Validate all inputs thoroughly
- Implement rate limiting
- Log security events

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper session management
- Follow GDPR compliance requirements
- Regular security audits

## Development Workflow

### Git Workflow
- Use feature branches for development
- Write descriptive commit messages using conventional commit format
- Review code before merging
- Keep commits atomic and focused

### Environment Management
- Use environment variables for configuration
- Separate development, staging, and production
- Use .env files for local development
- Never commit sensitive data to version control

## MVP Architecture

### Microservices Architecture
The MVP uses a microservices architecture with the following services:

1. **Accounts Service (Rust):**
   - Handles account creation, deposits, withdrawals, transfers
   - Exposes HTTP REST API and gRPC interface
   - Uses SQLx for database access

2. **Users Service (Rust):**
   - Manages user accounts, authentication, API keys
   - Handles business registration and organizational hierarchy
   - JWT-based authentication
   - gRPC integration

3. **Ledger Service (Rails):**
   - Double-entry bookkeeping system
   - Transaction posting and balance management
   - gRPC interface for inter-service communication
   - PostgreSQL with ActiveRecord

4. **Client Server (TypeScript):**
   - API gateway/proxy layer
   - Routes requests to appropriate microservices
   - Handles CORS and request validation

### Communication Patterns
- **HTTP REST:** Primary API interface for external clients
- **gRPC:** Inter-service communication (accounts, users, ledger)
- **PostgreSQL:** Shared database with service-specific schemas

### Deployment
- Services can be deployed independently
- Railway deployment scripts available in `mvp/api/deploy-railway.sh`
- Docker support for containerized deployment
- Environment-specific configuration via environment variables

## Development Commands

### POC
```bash
# Backend
cd poc/api
npm run dev              # Development mode (nodemon)
npm start                 # Single process mode
npm run start:cluster     # Cluster mode (4 workers)
npm test                  # Run tests
npm run test:coverage     # Test coverage

# Frontend
cd poc/client
npm run dev               # Vite dev server
npm run build             # Production build
npm test                  # Run tests (Vitest)
```

### MVP
```bash
# Accounts Service (Rust)
cd mvp/api/accounts
cargo run                 # Development mode
cargo test                # Run tests
sqlx migrate run           # Run migrations

# Users Service (Rust)
cd mvp/api/users
cargo run                 # Development mode
cargo test                # Run tests

# Ledger Service (Rails)
cd mvp/api/ledger
rails server              # Development server
rails test                # Run tests
rails db:migrate          # Run migrations

# Client Server
cd mvp/rails-client-server
npm run dev               # Development mode
npm run build             # Build TypeScript

# Frontend (rails-web)
cd mvp/rails-web
npm run dev               # Vite dev server
npm run build             # Production build

# Full-stack App (web)
cd mvp/web
npm run dev               # Development mode (server + client)
npm run build             # Build both server and client
```

## Related Projects

### Valu Repo
The **valu repo** contains AI-powered financial intelligence services that complement this Rails API:

#### Financial Intelligence Service
- **Technology:** FastAPI (Python)
- **Purpose:** AI-powered fundamental analysis for value investing
- **Capabilities:**
  - Extract and analyze financial data from documents
  - Calculate value investing metrics (P/E, P/B, DCF, etc.)
  - Generate fundamental analysis reports
  - Provide investment insights and recommendations
  - Analyze company financial health

#### Extract to Text Service
- **Technology:** FastAPI (Python)
- **Purpose:** Extract structured text from financial documents
- **Capabilities:**
  - PDF text extraction (financial statements, reports)
  - Document structure analysis
  - Financial data normalization
  - Multi-format support (PDF, images, scanned documents)
  - OCR for scanned documents

#### AI-Powered Value Investing Workflow
The valu repo uses AI to derive fundamental analysis through:

1. **Document Extraction:**
   - Extract text from financial documents (10-K, 10-Q, annual reports)
   - Parse financial statements (income statement, balance sheet, cash flow)
   - Extract key metrics and ratios

2. **Data Analysis:**
   - Apply value investing principles (Graham, Buffett methodologies)
   - Calculate intrinsic value using DCF models
   - Analyze financial ratios and trends
   - Identify red flags and opportunities

3. **AI Derivation:**
   - Use LLMs to interpret financial data
   - Generate investment thesis
   - Provide buy/hold/sell recommendations
   - Explain reasoning behind analysis

4. **Integration:**
   - Can be called from Rails API services
   - Shares authentication patterns
   - Follows microservices architecture
   - Uses similar database schemas for financial data

**Integration Points with Rails API:**
- Financial data can be stored in Rails database
- Analysis results can trigger transactions
- Investment decisions can be tracked via PostHog
- User accounts can access financial intelligence features

## AI-Assisted Development

### Cursor IDE Integration
This project uses **Cursor IDE** with AI assistance for:
- Code generation and completion
- Refactoring and optimization
- Test generation
- Documentation creation
- Debugging assistance

### MCP Servers
The following MCP servers are configured:

1. **PostHog MCP** - Analytics, feature flags, experiments, dashboards
2. **Neon MCP** - Database operations, migrations, query optimization
3. **Railway MCP** - Deployment, environment management, logs
4. **Cursor IDE Browser MCP** - Frontend testing, browser automation

See `AI_WORKFLOW.md` for detailed workflow examples and `MCP_COMMANDS.md` for complete command reference.

### AI Development Workflow Examples

**Example: Creating API Endpoint**
1. Ask Cursor: "Create endpoint following pattern in `poc/api/src/routes/accounts.js`"
2. Cursor generates route, validation, error handling, and tests
3. Review and refine generated code
4. Use Neon MCP to create database migration if needed

**Example: Database Optimization**
1. Identify slow query
2. Use Neon MCP to analyze execution plan
3. Cursor suggests indexes and optimizations
4. Apply changes via Neon MCP migration

**Example: Feature Flag Rollout**
1. Create feature flag via PostHog MCP
2. Deploy code with flag check via Railway MCP
3. Monitor usage via PostHog MCP
4. Gradually roll out to users

## Remember
- **Measure first, optimize second** - Always profile before implementing performance optimizations
- **Tests are documentation** - Write tests that clearly explain how your code should behave
- **Security by design** - Consider security implications in every decision
- **User experience first** - Performance and reliability directly impact user experience
- **Type safety matters** - Leverage TypeScript (frontend) and Rust's type system (backend) for safety
- **Microservices independence** - Each MVP service can be developed and deployed independently
- **AI assistance enhances, doesn't replace** - Always review and understand AI-generated code
- **Use MCPs strategically** - Leverage MCP servers for their specific strengths