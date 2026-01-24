# AI-Assisted Development Workflow

## Table of Contents

1. [Overview](#overview)
2. [Development Tools](#development-tools)
   - 2.1 [Primary IDE: Cursor](#primary-ide-cursor)
3. [MCP (Model Context Protocol) Servers](#mcp-model-context-protocol-servers)
   - 3.1 [PostHog MCP](#1-posthog-mcp)
   - 3.2 [Neon MCP](#2-neon-mcp)
   - 3.3 [Railway MCP](#3-railway-mcp)
   - 3.4 [Cursor IDE Browser MCP](#4-cursor-ide-browser-mcp)
4. [Custom Cursor Commands](#custom-cursor-commands)
   - 4.1 [`/conventionalcommits`](#conventionalcommits)
   - 4.2 [`/edge-cases`](#edge-cases)
   - 4.3 [`/explain`](#explain)
   - 4.4 [`/nocode`](#nocode)
   - 4.5 [`/regression-check`](#regression-check)
   - 4.6 [`/short`](#short)
5. [AI-Assisted Development Examples](#ai-assisted-development-examples)
   - 5.1 [Example 1: Creating a New API Endpoint](#example-1-creating-a-new-api-endpoint)
   - 5.2 [Example 2: Database Schema Changes](#example-2-database-schema-changes)
   - 5.3 [Example 3: Frontend Component Development](#example-3-frontend-component-development)
   - 5.4 [Example 4: Performance Optimization](#example-4-performance-optimization)
   - 5.5 [Example 5: Feature Flag Management](#example-5-feature-flag-management)
6. [Best Practices](#best-practices)
   - 6.1 [Provide Context](#1-provide-context)
   - 6.2 [Use MCPs Strategically](#2-use-mcps-strategically)
   - 6.3 [Iterate and Refine](#3-iterate-and-refine)
   - 6.4 [Maintain Code Quality](#4-maintain-code-quality)
   - 6.5 [Leverage Type Safety](#5-leverage-type-safety)
7. [Workflow Integration](#workflow-integration)
   - 7.1 [Daily Development](#daily-development)
   - 7.2 [Code Review](#code-review)
   - 7.3 [Debugging](#debugging)
8. [Valu Repo Integration](#valu-repo-integration)
   - 8.1 [Financial Intelligence Service](#financial-intelligence-service)
   - 8.2 [Extract to Text Service](#extract-to-text-service)
   - 8.3 [AI-Powered Analysis](#ai-powered-analysis)
9. [Tips for Effective AI-Assisted Development](#tips-for-effective-ai-assisted-development)
   - 9.1 [Command Usage Tips](#command-usage-tips)
10. [Resources](#resources)

---

## Overview
This project uses **Cursor IDE** with AI assistance to accelerate development. Cursor provides intelligent code completion, refactoring, and context-aware suggestions powered by Claude and other AI models.

## Development Tools

### Primary IDE: Cursor {#primary-ide-cursor}
- **AI Code Completion:** Context-aware suggestions based on project structure
- **Chat Interface:** Interactive AI assistant for code generation and debugging
- **Refactoring:** AI-powered code refactoring and optimization
- **Context Awareness:** Understands project structure, dependencies, and patterns

## MCP (Model Context Protocol) Servers

The project uses several MCP servers to extend Cursor's capabilities:

### 1. PostHog MCP
**Purpose:** Analytics and product insights integration

**Capabilities:**
- Create and manage dashboards
- Create and query insights
- Manage feature flags
- Track experiments
- Monitor errors and performance

**Use Cases:**
- Track user events and conversions
- A/B test features
- Monitor application errors
- Create business intelligence dashboards

### 2. Neon MCP
**Purpose:** PostgreSQL database management and operations

**Capabilities:**
- Database schema management
- Query execution and optimization
- Migration management
- Branch-based development
- Connection string management
- Query performance tuning

**Use Cases:**
- Create and manage database schemas
- Run SQL queries and transactions
- Create database branches for testing
- Optimize slow queries
- Compare schemas between branches

### 3. Railway MCP
**Purpose:** Deployment and infrastructure management

**Capabilities:**
- Deploy applications
- Manage environments
- View logs and deployments
- Manage environment variables
- Generate domains

**Use Cases:**
- Deploy services to Railway
- Manage staging and production environments
- Monitor deployments
- Configure environment variables

### 4. Cursor IDE Browser MCP
**Purpose:** Browser automation and testing

**Capabilities:**
- Navigate web pages
- Interact with elements
- Take screenshots
- Test user flows
- Debug frontend issues

**Use Cases:**
- Test frontend features
- Debug UI issues
- Automate user flows
- Visual regression testing

## Custom Cursor Commands

The project includes custom Cursor commands that streamline common development tasks. These commands are available in the Cursor chat interface with the `/` prefix.

### `/conventionalcommits` {#conventionalcommits}
**Purpose:** Generate commit messages following conventional commit principles

**When to Use:**
- Before committing code changes
- When you want consistent, standardized commit messages
- To ensure commits follow the project's commit message format

**Why It's Useful:**
- Maintains consistent commit history
- Makes it easier to generate changelogs
- Improves code review process
- Enables automated versioning

**Example Workflow:**
```
1. Make code changes
2. Use /conventionalcommits to format commit message
3. Review the generated message (max 2 bullet points)
4. Commit with the formatted message
```

**Example Output:**
```
feat(accounts): add balance validation endpoint

- Add GET /api/accounts/:id/balance endpoint with validation
- Include error handling for invalid account IDs
```

### `/edge-cases` {#edge-cases}
**Purpose:** Systematically analyze edge cases and stress test features

**When to Use:**
- Before deploying a new feature
- When reviewing code for potential issues
- After implementing complex business logic
- When optimizing performance-critical code

**Why It's Useful:**
- Identifies potential bugs before production
- Discovers performance bottlenecks
- Finds logic flow issues
- Ensures robust error handling
- Prevents production incidents

**What It Analyzes:**
- Input validation (null, empty, invalid types, boundaries)
- Error handling (network failures, timeouts, retries)
- Concurrency issues (race conditions, deadlocks)
- Resource limits (memory, quota, rate limits)
- Integration points (API failures, database issues)
- Performance patterns (loops, batch operations, query optimization)
- Logic flow (condition order, filtering, early exits)

**Example Workflow:**
```
1. Implement a new feature (e.g., transaction processing)
2. Use /edge-cases transaction-processing
3. Review identified edge cases and stress test scenarios
4. Choose an option:
   - [1] Generate test cases
   - [2] Create stress test scripts
   - [3] Get code improvement suggestions
   - [7] Optimize performance issues
```

**Example Output:**
- Identifies that checking account existence inside a loop causes N queries
- Suggests batch existence check before the loop
- Recommends early exit conditions
- Provides stress test scenarios (1000 concurrent requests, etc.)

### `/explain` {#explain}
**Purpose:** Explain code or concepts in simple terms with real-world examples

**When to Use:**
- When learning new code or patterns
- When onboarding new team members
- When documenting complex logic
- When you need a simple explanation without technical jargon

**Why It's Useful:**
- Makes complex code accessible
- Helps with knowledge sharing
- Improves code documentation
- Uses real-world analogies for clarity

**Example Workflow:**
```
1. Ask: /explain how the ledger double-entry system works
2. Get simple explanation with real-world examples
3. Code references are linked to actual files
4. Understand the concept without diving into implementation details
```

**Example Output:**
```
The ledger system works like a checkbook: every transaction has two sides.
When you deposit $100, your account balance increases (debit) and the bank's
reserve increases (credit). This ensures the books always balance.

See: poc/api/src/ledger/ledger.js for implementation
```

### `/nocode` {#nocode}
**Purpose:** Get explanations without code generation

**When to Use:**
- When you need to understand a concept before implementing
- When reviewing architecture decisions
- When planning features
- When you want to discuss approaches without code

**Why It's Useful:**
- Focuses on understanding over implementation
- Prevents premature coding
- Encourages design thinking
- Saves time when you just need explanations

**Example Workflow:**
```
1. Ask: /nocode How should we handle transaction retries?
2. Get explanation of different retry strategies
3. Discuss pros and cons
4. Then implement based on the discussion
```

### `/regression-check`
**Purpose:** Verify uncommitted changes don't introduce breaking changes

**When to Use:**
- Before committing code changes
- Before creating pull requests
- When refactoring existing code
- When modifying public APIs or contracts

**Why It's Useful:**
- Prevents breaking changes from reaching production
- Identifies missing test coverage
- Ensures backward compatibility
- Catches regressions early

**What It Checks:**
- API contract changes (endpoints, schemas, request/response)
- Function signature changes
- Database schema changes
- Environment variable changes
- Behavior changes with same inputs
- Error handling changes
- Performance or side-effect changes

**Example Workflow:**
```
1. Make changes to an API endpoint
2. Use /regression-check
3. Review the analysis:
   - ✅ Safe to commit
   - ⚠️ Risky – needs changes
   - ❌ Breaking – must fix or version
4. Address any issues before committing
```

**Example Output:**
```
Summary: Modified accounts endpoint response structure

Breaking Changes:
- Removed 'balance' field from response (breaking for existing clients)

Recommendations:
- Add 'balance' field back or version the API
- Update API documentation
- Add migration guide for clients

Final Verdict: ❌ Breaking – must fix or version
```

### `/short`
**Purpose:** Get brief, concise answers

**When to Use:**
- When you need quick answers
- When you already understand the context
- When you want to avoid lengthy explanations
- For simple questions that don't need detail

**Why It's Useful:**
- Saves time on simple queries
- Gets straight to the point
- Reduces information overload
- Faster iteration on questions

**Example Workflow:**
```
1. Ask: /short What's the difference between findUnique and findFirst?
2. Get brief answer: "findUnique uses unique constraints, findFirst doesn't"
3. Quick clarification without lengthy explanation
```

## AI-Assisted Development Examples

### Example 1: Creating a New API Endpoint

**Workflow:**
1. **Ask Cursor:** "Create a new endpoint to get account balance with proper error handling"
2. **Cursor generates:**
   - Route handler with validation
   - Error handling following project patterns
   - TypeScript types
   - Test file structure
3. **Review and refine:** Adjust generated code to match project conventions
4. **Test:** Use Cursor to generate test cases

**Benefits:**
- Reduces boilerplate code
- Ensures consistency with project patterns
- Generates tests automatically

### Example 2: Database Schema Changes

**Workflow:**
1. **Ask Cursor:** "Add a new column `last_login` to the users table with proper migration"
2. **Cursor uses Neon MCP:**
   - Creates migration SQL
   - Validates schema changes
   - Suggests indexes if needed
3. **Review:** Check generated migration
4. **Apply:** Use Neon MCP to apply migration to branch

**Benefits:**
- Type-safe migrations
- Automatic index suggestions
- Branch-based testing

### Example 3: Frontend Component Development

**Workflow:**
1. **Ask Cursor:** "Create a transaction list component following atomic design"
2. **Cursor generates:**
   - Component structure (atoms, molecules, organisms)
   - TypeScript interfaces
   - Redux integration
   - Styling with Tailwind
   - Test file
3. **Refine:** Adjust styling and behavior
4. **Test:** Use Browser MCP to test in actual browser

**Benefits:**
- Consistent component structure
- Type safety
- Test coverage
- Visual testing

### Example 4: Performance Optimization

**Workflow:**
1. **Identify:** "This query is slow, optimize it"
2. **Cursor uses Neon MCP:**
   - Analyzes query execution plan
   - Suggests indexes
   - Recommends query rewrites
3. **Apply:** Generate migration with optimizations
4. **Verify:** Test performance improvements

**Benefits:**
- Data-driven optimizations
- Automatic index creation
- Performance monitoring

### Example 5: Feature Flag Management

**Workflow:**
1. **Ask Cursor:** "Create a feature flag for the new payment flow"
2. **Cursor uses PostHog MCP:**
   - Creates feature flag
   - Sets up targeting rules
   - Generates code to check flag
3. **Deploy:** Use Railway MCP to deploy with flag
4. **Monitor:** Track flag usage in PostHog

**Benefits:**
- Safe feature rollouts
- A/B testing capabilities
- Real-time monitoring

## Best Practices

### 1. Provide Context
Always provide context when asking Cursor:
- ✅ "Create a new endpoint following the pattern in `poc/api/src/routes/accounts.js`"
- ❌ "Create an endpoint"

### 2. Use MCPs Strategically
- Use **Neon MCP** for database operations
- Use **PostHog MCP** for analytics and feature flags
- Use **Railway MCP** for deployment
- Use **Browser MCP** for frontend testing

### 3. Iterate and Refine
- Start with AI-generated code
- Review and refine
- Test thoroughly
- Document decisions

### 4. Maintain Code Quality
- Always review AI-generated code
- Ensure it follows project conventions
- Add tests for AI-generated features
- Update documentation

### 5. Leverage Type Safety
- Use TypeScript for type safety
- Let Cursor infer types from context
- Validate AI suggestions against types

## Workflow Integration

### Daily Development
1. **Start:** Ask Cursor for feature overview
2. **Develop:** Use AI assistance for implementation
3. **Test:** Generate and run tests
4. **Review:** Use `/regression-check` before committing
5. **Commit:** Use `/conventionalcommits` for commit message
6. **Deploy:** Use Railway MCP for deployment

### Code Review
1. **AI Review:** Ask Cursor to review code
2. **Edge Cases:** Use `/edge-cases` to identify potential issues
3. **Regression Check:** Use `/regression-check` to verify no breaking changes
4. **Suggestions:** Get AI-powered suggestions
5. **Refactor:** Use AI to refactor code
6. **Test:** Verify refactoring didn't break tests

### Debugging
1. **Error Analysis:** Ask Cursor to analyze errors
2. **Explanation:** Use `/explain` to understand the error in simple terms
3. **Root Cause:** Use AI to find root cause
4. **Fix:** Generate fix with AI assistance
5. **Edge Cases:** Use `/edge-cases` to ensure fix doesn't break other scenarios
6. **Verify:** Test the fix

## Valu Repo Integration

The **valu repo** contains additional AI-powered services:

### Financial Intelligence Service
- **Purpose:** AI-powered fundamental analysis for value investing
- **Technology:** FastAPI, Python
- **Capabilities:**
  - Extract financial data from documents
  - Analyze company fundamentals
  - Generate investment insights
  - Value investing metrics calculation

### Extract to Text Service
- **Purpose:** Extract text from financial documents
- **Technology:** FastAPI
- **Capabilities:**
  - PDF text extraction
  - Financial statement parsing
  - Document structure analysis
  - Data normalization

### AI-Powered Analysis
The valu repo uses AI to:
1. **Extract:** Pull financial data from various sources
2. **Analyze:** Apply value investing principles
3. **Derive:** Generate fundamental analysis
4. **Recommend:** Provide investment insights

**Integration Points:**
- Can be called from Rails API services
- Shares database schema for financial data
- Uses similar authentication patterns
- Follows microservices architecture

## Tips for Effective AI-Assisted Development

1. **Be Specific:** More context = better results
2. **Iterate:** Start broad, then refine
3. **Review:** Always review AI-generated code
4. **Test:** Generate tests alongside code
5. **Use Custom Commands:** Leverage `/edge-cases` and `/regression-check` before committing
6. **Document:** Document AI-assisted decisions
7. **Learn:** Use `/explain` to understand complex concepts
8. **Customize:** Adapt AI suggestions to project needs

### Command Usage Tips

- **Before Committing:** Always run `/regression-check` to catch breaking changes
- **Before Deploying:** Use `/edge-cases` to identify potential issues
- **When Learning:** Use `/explain` to understand code without diving into implementation
- **When Planning:** Use `/nocode` to discuss approaches before coding
- **When Committing:** Use `/conventionalcommits` for consistent commit messages
- **Quick Questions:** Use `/short` for brief answers when you need quick clarification

## Resources

- [Cursor Documentation](https://cursor.sh/docs)
- [MCP Protocol](https://modelcontextprotocol.io)
- [PostHog MCP](https://github.com/PostHog/mcp-server-posthog)
- [Neon MCP](https://github.com/neondatabase/mcp-server-neon)
- [Railway MCP](https://github.com/railwayapp/mcp-server-railway)
