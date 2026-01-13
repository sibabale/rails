# Rails API Project Context

## Project Overview
This is a financial API proof-of-concept (POC) that will transition to an MVP. The project handles transaction processing, ledger management, and banking integrations.

## Tech Stack
- **Backend:** Node.js/Express with Prisma ORM and Supabase (PostgreSQL)
- **Frontend:** React 18 with TypeScript, Vite, Tailwind CSS, Atomic Design
- **Database:** Supabase (PostgreSQL) with connection pooling
- **Testing:** Jest, React Testing Library, Supertest
- **Analytics:** PostHog for event tracking
- **Documentation:** MDX-based documentation site
- **SDK:** Auto-generated TypeScript SDK via Speakeasy

## Project Structure
```
rails/
├── poc/                    # Current POC implementation
│   ├── api/               # Node.js/Express API
│   ├── client/            # React frontend
│   ├── documentation/     # MDX documentation site
│   └── rails-typescript/  # Auto-generated TypeScript SDK
├── mvp/                    # MVP implementation
│   ├── rails-docs/        # MDX-based documentation site
│   ├── rails-ts-sdk/      # Auto-generated TypeScript SDK
│   └── web/               # Next.js/React frontend
├── .claude/              # Claude Code context
├── .cursor/              # Cursor rules
└── CLAUDE.md            # Unified context file (this file)
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

#### Database Performance (Prisma + Supabase)
- Use Prisma's `select` to fetch only needed fields: `prisma.user.findMany({ select: { id: true, name: true } })`
- Implement pagination for large datasets: `prisma.transaction.findMany({ take: 20, skip: 0 })`
- Use `include` sparingly - prefer separate queries for related data to avoid N+1
- Add database indexes for frequently queried fields in `poc/api/prisma/schema.prisma`
- Use `findUnique` instead of `findFirst` when you have a unique constraint
- Batch operations using `prisma.$transaction` for multiple related operations

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
- **Unit tests:** `*.test.js` or `*.test.ts` alongside source files
- **Integration tests:** `tests/integration/*.test.js`
- **E2E tests:** `tests/e2e/*.test.js`
- **Test utilities:** `tests/setup.js`

#### Testing Requirements
- Minimum 80% coverage for all modules
- 100% coverage for critical business logic
- Cover edge cases and error conditions
- Test both success and failure paths
- Every new feature file must have a corresponding test file
- Every edit to a feature file must update the corresponding test file

#### Testing Tools
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP endpoint testing
- **React Testing Library** - Component testing
- **Prisma** - Database testing and seeding
- **MSW** - API mocking

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

#### API Design
- Use RESTful conventions
- Implement proper HTTP status codes
- Provide meaningful error messages
- Use consistent response formats
- Implement rate limiting and validation

## Important Files to Know

### Backend Core Files
- `poc/api/src/ledger/ledger.js` - Main ledger logic
- `poc/api/src/queue/queue.js` - Transaction processing queue
- `poc/api/src/metrics/metrics.js` - Financial calculations
- `poc/api/prisma/schema.prisma` - Database schema
- `poc/api/src/routes/` - API endpoints

### Frontend Core Files
- `poc/client/components/` - Atomic design components
- `poc/client/lib/api.ts` - API client
- `poc/client/App.tsx` - Main application component

### Configuration Files
- `poc/api/package.json` - Backend dependencies and scripts
- `poc/client/package.json` - Frontend dependencies
- `poc/api/.env` - Environment variables
- `poc/api/jest.config.js` - Test configuration

## Common Patterns

### Error Handling
```javascript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', { error: error.message, context });
  throw new LedgerError('Operation failed', 'OPERATION_FAILED', { originalError: error.message });
}
```

### Database Transactions
```javascript
const result = await prisma.$transaction(async (tx) => {
  // Multiple related operations
  return result;
});
```

### API Response Format
```javascript
res.json({
  success: true,
  data: result,
  timestamp: new Date().toISOString()
});
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

## MVP Transition Planning

### Scalability Considerations
- Design for horizontal scaling from the start
- Plan for microservices architecture if needed
- Consider CDN integration for static assets
- Plan for multiple environments (dev, staging, prod)

### Future Modules
- **Admin Dashboard:** Data-heavy operations
- **Mobile App:** Network efficiency and offline capabilities
- **Analytics Module:** Large data processing
- **Shared Libraries:** Performance across all modules

## Remember
- **Measure first, optimize second** - Always profile before implementing performance optimizations
- **Tests are documentation** - Write tests that clearly explain how your code should behave
- **Security by design** - Consider security implications in every decision
- **User experience first** - Performance and reliability directly impact user experience