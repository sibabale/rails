use crate::errors::AppError;
use crate::models::{Transaction, TransactionKind, TransactionStatus};
use chrono::{DateTime, Duration, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

pub struct TransactionRepository;

impl TransactionRepository {
    pub async fn create_or_get_by_idempotency(
        executor: impl sqlx::Executor<'_, Database = sqlx::Postgres>,
        organization_id: Uuid,
        from_account_id: Uuid,
        to_account_id: Uuid,
        amount: i64,
        currency: &str,
        transaction_kind: TransactionKind,
        idempotency_key: &str,
    ) -> Result<Transaction, AppError> {
        let kind_str: &str = match transaction_kind {
            TransactionKind::Deposit => "deposit",
            TransactionKind::Withdraw => "withdraw",
            TransactionKind::Transfer => "transfer",
        };

        let row = sqlx::query(
            r#"
            INSERT INTO transactions (
                organization_id, from_account_id, to_account_id, amount, currency,
                transaction_kind, status, failure_reason, idempotency_key
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', NULL, $7)
            ON CONFLICT (organization_id, idempotency_key)
            DO UPDATE SET
                updated_at = transactions.updated_at
            RETURNING id, organization_id, from_account_id, to_account_id, amount, currency,
                      transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            "#,
        )
        .bind(organization_id)
        .bind(from_account_id)
        .bind(to_account_id)
        .bind(amount)
        .bind(currency)
        .bind(kind_str)
        .bind(idempotency_key)
        .fetch_one(executor)
        .await?;

        Ok(Self::row_to_transaction(&row)?)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Transaction, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, organization_id, from_account_id, to_account_id, amount, currency,
                   transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            FROM transactions
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Transaction with id {} not found", id)))?;

        Ok(Self::row_to_transaction(&row)?)
    }

    pub async fn find_by_account_id(
        pool: &PgPool,
        account_id: Uuid,
        limit: Option<i64>,
    ) -> Result<Vec<Transaction>, AppError> {
        let limit = limit.unwrap_or(100);

        let rows = sqlx::query(
            r#"
            SELECT id, organization_id, from_account_id, to_account_id, amount, currency,
                   transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            FROM transactions
            WHERE from_account_id = $1 OR to_account_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
        )
        .bind(account_id)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        let transactions = rows
            .iter()
            .map(|row| Self::row_to_transaction(row))
            .collect::<Result<Vec<_>, _>>()?;

        Ok(transactions)
    }

    pub async fn find_by_idempotency_key(
        pool: &PgPool,
        organization_id: Uuid,
        idempotency_key: &str,
    ) -> Result<Transaction, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, organization_id, from_account_id, to_account_id, amount, currency,
                   transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            FROM transactions
            WHERE organization_id = $1 AND idempotency_key = $2
            "#,
        )
        .bind(organization_id)
        .bind(idempotency_key)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| {
            AppError::NotFound(format!(
                "Transaction with organization_id {} and idempotency_key {} not found",
                organization_id, idempotency_key
            ))
        })?;

        Ok(Self::row_to_transaction(&row)?)
    }

    pub async fn find_by_status(
        pool: &PgPool,
        organization_id: Uuid,
        status: TransactionStatus,
        limit: Option<i64>,
    ) -> Result<Vec<Transaction>, AppError> {
        let status_str: &str = match status {
            TransactionStatus::Pending => "pending",
            TransactionStatus::Posted => "posted",
            TransactionStatus::Failed => "failed",
        };

        let limit = limit.unwrap_or(100);
        let rows = sqlx::query(
            r#"
            SELECT id, organization_id, from_account_id, to_account_id, amount, currency,
                   transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            FROM transactions
            WHERE organization_id = $1 AND status = $2
            ORDER BY created_at ASC
            LIMIT $3
            "#,
        )
        .bind(organization_id)
        .bind(status_str)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .iter()
            .map(|row| Self::row_to_transaction(row))
            .collect::<Result<Vec<_>, _>>()?)
    }

    pub async fn find_pending_older_than(
        pool: &PgPool,
        organization_id: Uuid,
        older_than: Duration,
        limit: Option<i64>,
    ) -> Result<Vec<Transaction>, AppError> {
        let cutoff: DateTime<Utc> = Utc::now() - older_than;
        let limit = limit.unwrap_or(100);

        let rows = sqlx::query(
            r#"
            SELECT id, organization_id, from_account_id, to_account_id, amount, currency,
                   transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            FROM transactions
            WHERE organization_id = $1 AND status = 'pending' AND created_at < $2
            ORDER BY created_at ASC
            LIMIT $3
            "#,
        )
        .bind(organization_id)
        .bind(cutoff)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .iter()
            .map(|row| Self::row_to_transaction(row))
            .collect::<Result<Vec<_>, _>>()?)
    }

    /// Find pending transactions across all organizations older than a cutoff.
    /// Used by the ledger retry worker (eventual consistency).
    pub async fn find_pending_older_than_any_org(
        pool: &PgPool,
        older_than: Duration,
        limit: Option<i64>,
    ) -> Result<Vec<Transaction>, AppError> {
        let cutoff: DateTime<Utc> = Utc::now() - older_than;
        let limit = limit.unwrap_or(100);

        let rows = sqlx::query(
            r#"
            SELECT id, organization_id, from_account_id, to_account_id, amount, currency,
                   transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            FROM transactions
            WHERE status = 'pending' AND created_at < $1
            ORDER BY created_at ASC
            LIMIT $2
            "#,
        )
        .bind(cutoff)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .iter()
            .map(|row| Self::row_to_transaction(row))
            .collect::<Result<Vec<_>, _>>()?)
    }

    pub async fn update_status(
        executor: impl sqlx::Executor<'_, Database = sqlx::Postgres>,
        id: Uuid,
        status: TransactionStatus,
        failure_reason: Option<&str>,
    ) -> Result<Transaction, AppError> {
        let status_str: &str = match status {
            TransactionStatus::Pending => "pending",
            TransactionStatus::Posted => "posted",
            TransactionStatus::Failed => "failed",
        };

        let row = sqlx::query(
            r#"
            UPDATE transactions
            SET status = $2, failure_reason = $3, updated_at = NOW()
            WHERE id = $1
            RETURNING id, organization_id, from_account_id, to_account_id, amount, currency,
                      transaction_kind, status, failure_reason, idempotency_key, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(status_str)
        .bind(failure_reason)
        .fetch_one(executor)
        .await?;

        Ok(Self::row_to_transaction(&row)?)
    }

    pub fn row_to_transaction(row: &sqlx::postgres::PgRow) -> Result<Transaction, AppError> {
        let kind_str: String = row.get("transaction_kind");
        let transaction_kind = match kind_str.as_str() {
            "deposit" => TransactionKind::Deposit,
            "withdraw" => TransactionKind::Withdraw,
            "transfer" => TransactionKind::Transfer,
            _ => return Err(AppError::Internal("Invalid transaction kind".to_string())),
        };

        let status_str: String = row.get("status");
        let status = match status_str.as_str() {
            "pending" => TransactionStatus::Pending,
            "posted" => TransactionStatus::Posted,
            "failed" => TransactionStatus::Failed,
            _ => return Err(AppError::Internal("Invalid transaction status".to_string())),
        };

        Ok(Transaction {
            id: row.get("id"),
            organization_id: row.get("organization_id"),
            from_account_id: row.get("from_account_id"),
            to_account_id: row.get("to_account_id"),
            amount: row.get("amount"),
            currency: row.get("currency"),
            transaction_kind,
            status,
            failure_reason: row.get("failure_reason"),
            idempotency_key: row.get("idempotency_key"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}
