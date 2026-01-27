use tracing::info;
use crate::errors::AppError;
use crate::ledger_grpc::LedgerGrpc;
use crate::models::{Account, AccountStatus, CreateAccountRequest, TransactionKind, TransactionStatus, PaginatedAccountsResponse};
use crate::repositories::{AccountRepository, TransactionRepository};
use crate::utils::generate_account_number;
use sqlx::PgPool;
use uuid::Uuid;

pub struct AccountService;

impl AccountService {
    pub async fn create_account(
        pool: &PgPool,
        request: CreateAccountRequest,
    ) -> Result<Account, AppError> {
        let account_number = generate_account_number(pool, 12)
            .await?;

        // Use create_with_hierarchy if admin_user_id is provided (for customer accounts)
        let account = if let Some(admin_user_id) = request.admin_user_id {
            AccountRepository::create_with_hierarchy(
                pool,
                &account_number,
                request.account_type,
                request.organization_id,
                &request.environment.unwrap_or_else(|| "sandbox".to_string()),
                request.user_id,
                Some(admin_user_id),
                Some("CUSTOMER".to_string()),  // Customer accounts require admin
                &request.currency,
            )
            .await?
        } else {
            AccountRepository::create(
                pool,
                &account_number,
                request.account_type,
                request.organization_id,
                &request.environment.unwrap_or_else(|| "sandbox".to_string()),
                request.user_id,
                &request.currency,
            )
            .await?
        };

        info!(
            "Account created: id={}, account_number={}, user_id={}",
            account.id, account.account_number, request.user_id
        );

        Ok(account)
    }

    pub async fn get_account(pool: &PgPool, id: Uuid) -> Result<Account, AppError> {
        AccountRepository::find_by_id(pool, id).await
    }

    pub async fn get_accounts_by_user(
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Vec<Account>, AppError> {
        AccountRepository::find_by_user_id(pool, user_id).await
    }

    pub async fn get_accounts_by_organization(
        pool: &PgPool,
        organization_id: Uuid,
    ) -> Result<Vec<Account>, AppError> {
        AccountRepository::find_by_organization_id(pool, organization_id).await
    }

    pub async fn get_accounts_by_admin(
        pool: &PgPool,
        admin_user_id: Uuid,
    ) -> Result<Vec<Account>, AppError> {
        AccountRepository::find_by_admin_user_id(pool, admin_user_id).await
    }

    pub async fn get_accounts_by_user_paginated(
        pool: &PgPool,
        user_id: Uuid,
        page: u32,
        per_page: u32,
    ) -> Result<PaginatedAccountsResponse, AppError> {
        AccountRepository::find_by_user_id_paginated(pool, user_id, page, per_page).await
    }

    pub async fn get_accounts_by_organization_paginated(
        pool: &PgPool,
        organization_id: Uuid,
        page: u32,
        per_page: u32,
    ) -> Result<PaginatedAccountsResponse, AppError> {
        AccountRepository::find_by_organization_id_paginated(pool, organization_id, page, per_page).await
    }

    pub async fn get_accounts_by_admin_paginated(
        pool: &PgPool,
        admin_user_id: Uuid,
        page: u32,
        per_page: u32,
    ) -> Result<PaginatedAccountsResponse, AppError> {
        AccountRepository::find_by_admin_user_id_paginated(pool, admin_user_id, page, per_page).await
    }

    pub async fn update_account_status(
        pool: &PgPool,
        id: Uuid,
        status: AccountStatus,
    ) -> Result<Account, AppError> {
        let account = AccountRepository::find_by_id(pool, id).await?;

        if account.status == Some(AccountStatus::Closed) && status != AccountStatus::Closed {
            return Err(AppError::BusinessLogic(
                "Cannot reactivate a closed account".to_string(),
            ));
        }

        info!(
            "Updating account {} status to {:?}",
            id, status
        );

        AccountRepository::update_status(pool, id, status).await
    }

    pub async fn close_account(pool: &PgPool, id: Uuid) -> Result<Account, AppError> {
        Self::update_account_status(pool, id, AccountStatus::Closed).await
    }

    pub async fn deposit_with_idempotency(
        pool: &PgPool,
        account_id: Uuid,
        amount: i64,
        idempotency_key: &str,
        ledger_grpc: &LedgerGrpc,
        correlation_id: Option<String>,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        if idempotency_key.trim().is_empty() {
            return Err(AppError::Validation("Idempotency-Key header is required".to_string()));
        }

        let account = AccountRepository::find_by_id(pool, account_id).await?;

        if account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }

        let organization_id = account
            .organization_id
            .ok_or_else(|| AppError::Validation("organization_id is required".to_string()))?;

        let currency = account
            .currency
            .clone()
            .unwrap_or_else(|| "USD".to_string());

        let environment = account
            .environment
            .clone()
            .unwrap_or_else(|| "sandbox".to_string());

        let mut tx = pool.begin().await?;

        let transaction = TransactionRepository::create_or_get_by_idempotency(
            &mut *tx,
            organization_id,
            account_id,
            account_id,
            amount,
            &currency,
            TransactionKind::Deposit,
            idempotency_key,
        )
        .await?;

        tx.commit().await?;

        info!(
            organization_id = %organization_id,
            transaction_id = %transaction.id,
            from_account_id = %transaction.from_account_id,
            to_account_id = %transaction.to_account_id,
            status = ?transaction.status,
            "transaction_intent_created"
        );

        // Attempt to post to Ledger via gRPC (eventual consistency: keep pending on failure)
        let correlation_id = correlation_id.unwrap_or_else(|| transaction.id.to_string());
        let post_result = ledger_grpc
            .post_transaction(
                organization_id,
                &environment,
                "SYSTEM_CASH_CONTROL".to_string(),
                account_id.to_string(),
                amount,
                currency.clone(),
                transaction.id,
                transaction.idempotency_key.clone(),
                correlation_id,
            )
            .await;

        let transaction = match post_result {
            Ok(()) => {
                TransactionRepository::update_status(pool, transaction.id, TransactionStatus::Posted, None).await?
            }
            Err(e) => {
                let reason = format!("{}", e);
                tracing::warn!(
                    transaction_id = %transaction.id,
                    error = %reason,
                    "Ledger gRPC post failed; leaving transaction pending"
                );
                TransactionRepository::update_status(
                    pool,
                    transaction.id,
                    TransactionStatus::Pending,
                    Some(&reason),
                )
                .await?
            }
        };

        Ok((account, transaction))
    }

    pub async fn withdraw_with_idempotency(
        pool: &PgPool,
        account_id: Uuid,
        amount: i64,
        idempotency_key: &str,
        ledger_grpc: &LedgerGrpc,
        correlation_id: Option<String>,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        // Note: Withdrawals are negative amounts, but we store as positive
        // The ledger will handle the debit/credit logic
        if idempotency_key.trim().is_empty() {
            return Err(AppError::Validation("Idempotency-Key header is required".to_string()));
        }

        let account = AccountRepository::find_by_id(pool, account_id).await?;

        if account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }

        let organization_id = account
            .organization_id
            .ok_or_else(|| AppError::Validation("organization_id is required".to_string()))?;

        let currency = account
            .currency
            .clone()
            .unwrap_or_else(|| "USD".to_string());

        let environment = account
            .environment
            .clone()
            .unwrap_or_else(|| "sandbox".to_string());

        let mut tx = pool.begin().await?;

        let transaction = TransactionRepository::create_or_get_by_idempotency(
            &mut *tx,
            organization_id,
            account_id,
            account_id,
            amount,
            &currency,
            TransactionKind::Withdraw,
            idempotency_key,
        )
        .await?;

        tx.commit().await?;

        info!(
            organization_id = %organization_id,
            transaction_id = %transaction.id,
            from_account_id = %transaction.from_account_id,
            to_account_id = %transaction.to_account_id,
            status = ?transaction.status,
            "transaction_intent_created"
        );

        // Attempt to post to Ledger via gRPC (withdraw = account -> SYSTEM_CASH_CONTROL)
        let correlation_id = correlation_id.unwrap_or_else(|| transaction.id.to_string());
        let post_result = ledger_grpc
            .post_transaction(
                organization_id,
                &environment,
                account_id.to_string(),
                "SYSTEM_CASH_CONTROL".to_string(),
                amount,
                currency.clone(),
                transaction.id,
                transaction.idempotency_key.clone(),
                correlation_id,
            )
            .await;

        let transaction = match post_result {
            Ok(()) => {
                TransactionRepository::update_status(pool, transaction.id, TransactionStatus::Posted, None).await?
            }
            Err(e) => {
                let reason = format!("{}", e);
                tracing::warn!(
                    transaction_id = %transaction.id,
                    error = %reason,
                    "Ledger gRPC post failed; leaving transaction pending"
                );
                TransactionRepository::update_status(
                    pool,
                    transaction.id,
                    TransactionStatus::Pending,
                    Some(&reason),
                )
                .await?
            }
        };

        Ok((account, transaction))
    }

    pub async fn transfer_with_idempotency(
        pool: &PgPool,
        from_account_id: Uuid,
        to_account_id: Uuid,
        amount: i64,
        idempotency_key: &str,
        ledger_grpc: &LedgerGrpc,
        correlation_id: Option<String>,
    ) -> Result<(Account, Account, crate::models::Transaction), AppError> {
        if idempotency_key.trim().is_empty() {
            return Err(AppError::Validation("Idempotency-Key header is required".to_string()));
        }

        let from_account = AccountRepository::find_by_id(pool, from_account_id).await?;

        if from_account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }


        let to_account = AccountRepository::find_by_id(pool, to_account_id).await?;

        if to_account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }

        let from_org = from_account
            .organization_id
            .ok_or_else(|| AppError::Validation("organization_id is required".to_string()))?;
        let to_org = to_account
            .organization_id
            .ok_or_else(|| AppError::Validation("organization_id is required".to_string()))?;

        if from_org != to_org {
            return Err(AppError::Validation(
                "accounts must belong to the same organization".to_string(),
            ));
        }

        let from_currency = from_account
            .currency
            .clone()
            .unwrap_or_else(|| "USD".to_string());
        let to_currency = to_account
            .currency
            .clone()
            .unwrap_or_else(|| "USD".to_string());

        if from_currency != to_currency {
            return Err(AppError::Validation(
                "currency must match both accounts".to_string(),
            ));
        }

        let environment = from_account
            .environment
            .clone()
            .unwrap_or_else(|| "sandbox".to_string());

        let mut tx = pool.begin().await?;

        let transaction = TransactionRepository::create_or_get_by_idempotency(
            &mut *tx,
            from_org,
            from_account_id,
            to_account_id,
            amount,
            &from_currency,
            TransactionKind::Transfer,
            idempotency_key,
        )
        .await?;

        tx.commit().await?;

        info!(
            organization_id = %from_org,
            transaction_id = %transaction.id,
            from_account_id = %transaction.from_account_id,
            to_account_id = %transaction.to_account_id,
            status = ?transaction.status,
            "transaction_intent_created"
        );

        // Attempt to post to Ledger via gRPC (eventual consistency: keep pending on failure)
        let correlation_id = correlation_id.unwrap_or_else(|| transaction.id.to_string());
        let post_result = ledger_grpc
            .post_transaction(
                from_org,
                &environment,
                from_account_id.to_string(),
                to_account_id.to_string(),
                amount,
                from_currency.clone(),
                transaction.id,
                transaction.idempotency_key.clone(),
                correlation_id,
            )
            .await;

        let transaction = match post_result {
            Ok(()) => {
                TransactionRepository::update_status(pool, transaction.id, TransactionStatus::Posted, None).await?
            }
            Err(e) => {
                let reason = format!("{}", e);
                tracing::warn!(
                    transaction_id = %transaction.id,
                    error = %reason,
                    "Ledger gRPC post failed; leaving transaction pending"
                );
                TransactionRepository::update_status(
                    pool,
                    transaction.id,
                    TransactionStatus::Pending,
                    Some(&reason),
                )
                .await?
            }
        };

        Ok((from_account, to_account, transaction))
    }
}
