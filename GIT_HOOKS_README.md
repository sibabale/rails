# Git Hooks Setup for Rails Project

This document describes the automated testing and linting git hooks that have been set up for the Rails project.

## Overview

Two git hooks have been configured to maintain code quality:

1. **Pre-commit hook** - Runs quick checks before commits
2. **Pre-push hook** - Runs comprehensive checks before pushes

## Hook Configuration

### Pre-commit Hook
**Location:** `.git/hooks/pre-commit`
**Runs:**
- Client ESLint linting
- TypeScript type checking

### Pre-push Hook
**Location:** `.git/hooks/pre-push`
**Runs:**
- API unit tests
- Client ESLint linting
- TypeScript type checking
- Client tests

## Operating Modes

### Lenient Mode (Default)
- Failures show as warnings but don't block commits/pushes
- Allows development to continue while highlighting issues
- Recommended during active development

### Strict Mode
- Failures block commits/pushes
- Enforces quality gates
- Recommended for production branches

## Usage

### Enable Strict Mode
```bash
# For current session
export STRICT_HOOKS=1

# For permanent setup (add to ~/.bashrc or ~/.zshrc)
echo 'export STRICT_HOOKS=1' >> ~/.bashrc
```

### Disable Strict Mode
```bash
unset STRICT_HOOKS
# or
export STRICT_HOOKS=0
```

### Bypass Hooks (Emergency)
```bash
# Bypass pre-commit hook
git commit --no-verify -m "Emergency commit"

# Bypass pre-push hook
git push --no-verify
```

## Example Output

### Lenient Mode Success
```
🔍 Running pre-commit checks...
🔓 LENIENT mode - failures show warnings only
🎨 Running client linting...
✅ Client linting passed
🔍 Running type checking...
✅ Type checking passed
✅ Pre-commit checks passed!
```

### Lenient Mode with Warnings
```
🔍 Running pre-commit checks...
🔓 LENIENT mode - failures show warnings only
🎨 Running client linting...
⚠️  Client linting failed (warning only)
🔍 Running type checking...
✅ Type checking passed
⚠️  Some checks failed, but proceeding (lenient mode)
ℹ️  Enable strict mode: export STRICT_HOOKS=1
```

### Strict Mode Blocking
```
🔍 Running pre-commit checks...
🔒 STRICT mode - failures will block commits
🎨 Running client linting...
❌ Client linting failed
💡 Run these commands to see detailed errors:
  - Client linting: cd poc/client && npm run lint
ℹ️  Use 'git commit --no-verify' to bypass checks
```

## Troubleshooting

### Hook Not Running
1. Check if hook files exist and are executable:
   ```bash
   ls -la .git/hooks/pre-commit .git/hooks/pre-push
   ```

2. Make hooks executable if needed:
   ```bash
   chmod +x .git/hooks/pre-commit .git/hooks/pre-push
   ```

### Performance Issues
- Hooks include timeouts to prevent hanging
- Pre-commit: 30 second timeout per check
- Pre-push: 60 second timeout per check

### Common Error Messages
- **"timeout 30s: command not found"** - Install `coreutils` on macOS: `brew install coreutils`
- **Hook takes too long** - Dependencies might need installing: `cd poc/client && npm install`

## Customization

### Adding New Checks
Edit the hook files in `.git/hooks/` to add additional checks:
- Add new commands in the appropriate section
- Use the `print_status` function for consistent output
- Include timeout for long-running commands

### Modifying Timeout Values
Change the timeout values in the hook files:
```bash
timeout 30s npm run lint > /dev/null 2>&1  # Change 30s to desired value
```

## Project-Specific Commands

### API Commands
```bash
cd poc/api
npm test              # Run all tests
npm run test:unit     # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:coverage # Run with coverage report
```

### Client Commands
```bash
cd poc/client
npm run lint          # ESLint linting
npm run type-check    # TypeScript type checking
npm run test          # Run tests (watch mode)
npm run test:run      # Run tests (single run)
npm run build         # Build for production
```

## Best Practices

1. **Fix warnings promptly** - Even in lenient mode, address issues highlighted by hooks
2. **Use strict mode for releases** - Enable strict mode when preparing for production deployments
3. **Keep dependencies updated** - Ensure all npm packages are installed and up to date
4. **Test hook changes** - After modifying hooks, test with a small commit first

## Maintenance

The hooks are stored in `.git/hooks/` and are not tracked by git. If you clone the repository, you'll need to set up the hooks again by following this setup process.

Consider adding hook setup to your project's setup documentation or creating a setup script for new developers.