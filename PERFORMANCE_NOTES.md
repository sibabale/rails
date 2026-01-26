# Performance Optimization Notes

## Database Indexes

Both services now have comprehensive indexes to optimize slow queries. The migrations will run automatically on service startup.

### Users Service
- Indexes added for: users, environments, user_sessions, businesses tables
- Optimizes: login queries, user lookups, environment queries

### Accounts Service  
- Indexes added for: transactions, accounts tables
- Optimizes: retry worker queries, user accounts queries, transaction lookups

## Important Notes

1. **Migrations must be applied**: Restart both services to apply the new indexes
   ```bash
   # Stop services, then restart them
   # The migrations will run automatically on startup
   ```

2. **Network Latency**: Some queries may still show 1+ second times due to:
   - Network latency to remote Neon database (South America region)
   - Connection pooler overhead
   - This is expected with remote databases and cannot be fully eliminated with indexes

3. **Primary Key Lookups**: Even primary key lookups (e.g., `WHERE id = $1`) may be slow due to network latency, not missing indexes. The primary key index exists and is being used.

4. **Expected Improvements**:
   - Login queries: Should improve from 3-5s to 1-2s (network latency remains)
   - User accounts queries: Should improve from 2+ seconds to <500ms
   - Retry worker queries: Should improve from 1-4s to <500ms
   - Account lookups: May still be 1s+ due to network latency

5. **To verify indexes are applied**:
   ```sql
   -- Check if indexes exist
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename IN ('users', 'environments', 'accounts', 'transactions')
   ORDER BY tablename, indexname;
   ```

## Migration Status

- ✅ Users service: `20260126000000_add_performance_indexes.sql`
- ✅ Accounts service: `20260126000000_add_performance_indexes.sql`

Both migrations will run automatically on the next service startup.
