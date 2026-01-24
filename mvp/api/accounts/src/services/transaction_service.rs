use crate::errors::AppError;
use crate::ledger::{LedgerAdapter, NoopLedgerAdapter};
use crate::models::{CreateTransactionRequest, Transaction, TransactionKind};
use crate::repositories::{AccountRepository, TransactionRepository};
use sqlx::PgPool;
use tracing::info;
use uuid::Uuid;

pub struct TransactionService;

impl TransactionService {
    pub async fn create_transaction(
        pool: &PgPool,
        request: CreateTransactionRequest,
        idempotency_key: &str,
    ) -> Result<Transaction, AppError> {
        if idempotency_key.trim().is_empty() {
            return Err(AppError::Validation("Idempotency-Key header is required".to_string()));
        }

        let from_account = AccountRepository::find_by_id(pool, request.from_account_id).await?;
        let to_account = AccountRepository::find_by_id(pool, request.to_account_id).await?;

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

        if request.currency != from_currency || request.currency != to_currency {
            return Err(AppError::Validation(
                "currency must match both accounts".to_string(),
            ));
        }

        if request.amount <= 0 {
            return Err(AppError::Validation(
                "amount must be greater than zero".to_string(),
            ));
        }

        let mut tx = pool.begin().await?;
        let transaction = TransactionRepository::create_or_get_by_idempotency(
            &mut *tx,
            from_org,
            request.from_account_id,
            request.to_account_id,
            request.amount,
            &request.currency,
            TransactionKind::Transfer,
            idempotency_key,
        )
        .await?;

        tx.commit().await?;

        // Get environment from from_account for ledger notification
        let environment = from_account
            .environment
            .clone()
            .unwrap_or_else(|| "production".to_string());

        let ledger = NoopLedgerAdapter;
        // Ledger notifications for direct transaction creation are handled via NoopLedgerAdapter
        // For now, transactions created via this endpoint won't be sent to ledger
        let _ = ledger.notify_ledger(&transaction, &environment).await;

        info!(
            organization_id = %transaction.organization_id,
            transaction_id = %transaction.id,
            from_account_id = %transaction.from_account_id,
            to_account_id = %transaction.to_account_id,
            status = ?transaction.status,
            "transaction_intent_created"
        );
        Ok(transaction)
    }

    pub async fn get_transaction(pool: &PgPool, id: Uuid) -> Result<Transaction, AppError> {
        TransactionRepository::find_by_id(pool, id).await
    }

    pub async fn get_account_transactions(
        pool: &PgPool,
        account_id: Uuid,
        limit: Option<i64>,
    ) -> Result<Vec<Transaction>, AppError> {
        TransactionRepository::find_by_account_id(pool, account_id, limit).await
    }
}
