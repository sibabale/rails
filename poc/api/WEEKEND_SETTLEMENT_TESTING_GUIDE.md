# Weekend Settlement Testing Guide

## Overview
This guide will help you test weekend settlements for your newly created bank (ZBank). The system allows banks to process transactions during weekends when traditional banking systems are offline.

## Prerequisites
- ✅ Bank created and activated (ZBank - ZBN001)
- ✅ Test transactions created
- ✅ API server running

## Testing Steps

### 1. Create Test Transactions
```bash
cd poc/api
node scripts/create-test-transactions.js
```
This creates 3 test transactions with different amounts and types.

### 2. Test Basic Settlement
```bash
node scripts/test-settlement.js
```
This tests the core settlement functionality:
- Checks pending transactions
- Triggers settlement with admin authorization
- Verifies all transactions are settled
- Checks audit logs
- Shows performance metrics

### 3. Simulate Complete Weekend Cycle
```bash
node scripts/simulate-weekend.js
```
This simulates a full weekend settlement cycle:
- Friday: Creates weekend transactions
- Saturday: Checks pending transactions and triggers settlement
- Sunday: Verifies settlement completion
- Monday: Prepares for clearing

### 4. Test Through Web Interface

#### Start the Frontend
```bash
cd ../client
npm run dev
```

#### Access Bank Dashboard
1. Navigate to `http://localhost:5173`
2. Login with your bank credentials:
   - Email: `jojasibabale@gmail.com`
   - Bank Code: `ZBN001`

#### Test Settlement Button
1. Look for the "Start Weekend Settlement" button
2. Click it to see the confirmation dialog
3. Confirm the settlement
4. Verify transactions are processed

### 5. API Testing

#### Check Pending Transactions
```bash
curl -X GET http://localhost:3000/api/ledger/pending
```

#### Trigger Settlement
```bash
curl -X POST http://localhost:3000/api/ledger/settle \
  -H "Content-Type: application/json" \
  -d '{"authorized_by": "jojasibabale@gmail.com", "force": false}'
```

#### Check Dashboard Metrics
```bash
curl -X GET http://localhost:3000/api/dashboard/metrics
```

## Expected Results

### Successful Settlement
- All pending transactions marked as "completed"
- Settlement timestamp recorded
- Audit logs created
- 100% success rate
- Total amount settled matches pending amount

### Performance Metrics
- Settlement completion time: < 5 seconds
- Transaction processing: Atomic (all or nothing)
- Audit trail: Complete with timestamps
- Error handling: Graceful with proper error codes

## Monitoring and Verification

### Database Verification
```sql
-- Check settled transactions
SELECT COUNT(*) as settled_count, SUM(amount) as total_amount 
FROM transactions 
WHERE status = 'completed' AND settled = true;

-- Check audit logs
SELECT action, details, timestamp 
FROM audit_logs 
WHERE action = 'settlement_completed' 
ORDER BY timestamp DESC;
```

### Log Files
Check the following log files for settlement activity:
- `logs/audit.json` - Settlement audit logs
- `logs/combined.json` - General application logs
- `logs/error.json` - Error logs (should be empty for successful settlements)

## Troubleshooting

### Common Issues

1. **No Pending Transactions**
   - Run `create-test-transactions.js` first
   - Check bank status is 'active'

2. **Settlement Authorization Failed**
   - Verify admin email is correct
   - Check bank is active status

3. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env

4. **Frontend Not Loading**
   - Check if API server is running on port 3000
   - Verify CORS settings

### Error Codes
- `UNAUTHORIZED_SETTLEMENT`: Missing or invalid authorization
- `SETTLEMENT_FAILED`: Database transaction failed
- `QUERY_FAILED`: Database query error

## Next Steps

After successful testing:

1. **Production Deployment**
   - Set up proper environment variables
   - Configure production database
   - Set up monitoring and alerting

2. **Integration Testing**
   - Test with real bank APIs
   - Verify webhook notifications
   - Test error scenarios

3. **Performance Testing**
   - Load test with thousands of transactions
   - Monitor database performance
   - Test concurrent settlements

## Support

If you encounter issues:
1. Check the logs in `poc/api/logs/`
2. Verify database connectivity
3. Ensure all services are running
4. Review the error messages for specific issues

---

**Last Updated**: August 24, 2025
**Tested Bank**: ZBank (ZBN001)
**Admin Email**: jojasibabale@gmail.com
