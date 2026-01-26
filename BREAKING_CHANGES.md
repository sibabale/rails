# Breaking Changes - Unused Code Cleanup

## Summary
Removed unused code causing compiler warnings in users and accounts services.

## Users Service

### Removed
- **`AppError::NotFound` variant** - Never constructed/used
- **`models.rs` module** - All structs (`Business`, `Environment`, `ApiKey`, `User`, `UserSession`) were unused. Routes define their own response structs.
- **`routes/environment.rs`** - Unused route handler and related structs (`CreateEnvironmentRequest`, `CreateEnvironmentResponse`)
- **`GrpcClients::accounts_grpc_url()` method** - Never called

### Modified
- **`JwtClaims` struct** - Added `#[allow(dead_code)]` to `exp` and `env` fields (used by jsonwebtoken library but not explicitly read)

### Breaking Changes
**None** - All removed code was unused internally. No external APIs affected.

## Accounts Service

### Removed
- **Error variants**: `InsufficientFunds`, `InvalidTransactionType`, `NotImplemented`
- **Models**: `RecurringPayment`, `FixedSavingsPlan` and all related enums/structs
- **Repositories**: `RecurringPaymentRepository`, `FixedSavingsRepository`
- **Service methods**: `get_accounts_by_admin()`, `update_account_permissions_for_admin()`, `update_account_permissions_for_customer()`, `reassign_customer_accounts()`
- **Repository methods**: `find_by_account_number()`, `batch_create()`, `find_by_idempotency_key()`, `find_by_status()`, `find_pending_older_than()` (organization-scoped version)
- **Utility function**: `validate_account_number()`

### Modified
- **Request structs**: Added `#[allow(dead_code)]` to `description` fields in `DepositRequest`, `WithdrawRequest`, `TransferRequest` (reserved for future use)
- **Error handling**: Fixed unused `should_report` variable warning

### Breaking Changes
**None** - All removed code was unused internally. No external APIs affected.

## Notes
- The `find_pending_older_than_any_org()` method was kept as it's used by the transaction retry worker
- All removed code was placeholders or unused implementations
- No public API endpoints were affected
