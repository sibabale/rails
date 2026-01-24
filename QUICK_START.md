# Quick Start Guide

## Documentation Files

- **CLAUDE.md** - Main project context and architecture
- **AI_WORKFLOW.md** - AI-assisted development workflow with examples
- **MCP_COMMANDS.md** - Complete MCP commands reference
- **QUICK_START.md** - This file (quick reference)

## AI-Assisted Development Quick Reference

### Custom Cursor Commands

- `/conventionalcommits` - Format commit messages
- `/edge-cases` - Analyze edge cases and performance
- `/explain` - Simple explanations with examples
- `/nocode` - Explanations without code
- `/regression-check` - Check for breaking changes
- `/short` - Brief, concise answers

### Available MCP Servers

1. **PostHog** - Analytics, dashboards, feature flags
2. **Neon** - Database operations, migrations, query tuning
3. **Railway** - Deployment and infrastructure
4. **Browser** - Frontend testing and automation

### Common Workflows

#### Create New Feature
```
1. Ask Cursor: "Create [feature] following pattern in [file]"
2. Review generated code
3. Generate tests: "Create tests for [feature]"
4. Use Neon MCP for database changes
5. Deploy via Railway MCP
```

#### Database Changes
```
1. Ask Cursor: "Add [column] to [table]"
2. Use Neon MCP: prepare_database_migration
3. Test in branch
4. Use Neon MCP: complete_database_migration
```

#### Frontend Testing
```
1. Use Browser MCP: navigate to localhost
2. Use Browser MCP: snapshot to see page
3. Use Browser MCP: click/interact with elements
4. Use Browser MCP: take_screenshot for visual testing
```

#### Feature Flag Rollout
```
1. PostHog MCP: create_feature_flag
2. Deploy code with flag check
3. Railway MCP: deploy
4. PostHog MCP: monitor usage
5. Gradually increase rollout percentage
```

#### Before Committing
```
1. Use /edge-cases to check for potential issues
2. Use /regression-check to verify no breaking changes
3. Use /conventionalcommits to format commit message
4. Commit and push
```

## Valu Repo Integration

The valu repo provides:
- **Financial Intelligence Service** (FastAPI) - AI-powered fundamental analysis
- **Extract to Text Service** (FastAPI) - Document extraction

These services can be integrated with Rails API for:
- Financial data analysis
- Investment insights
- Document processing
- Value investing metrics

## Key Commands

### PostHog
- Create dashboard: `mcp_PostHog_dashboard-create`
- Create insight: `mcp_PostHog_insight-create-from-query`
- Create feature flag: `mcp_PostHog_create-feature-flag`

### Neon
- Run SQL: `mcp_Neon_run_sql`
- Create migration: `mcp_Neon_prepare_database_migration`
- Tune query: `mcp_Neon_prepare_query_tuning`

### Railway
- Deploy: `mcp_Railway_deploy`
- View logs: `mcp_Railway_get-logs`
- Set variables: `mcp_Railway_set-variables`

### Browser
- Navigate: `mcp_cursor-ide-browser_browser_navigate`
- Snapshot: `mcp_cursor-ide-browser_browser_snapshot`
- Click: `mcp_cursor-ide-browser_browser_click`

## Getting Help

- See `AI_WORKFLOW.md` for detailed examples
- See `MCP_COMMANDS.md` for complete command reference
- See `CLAUDE.md` for project architecture
