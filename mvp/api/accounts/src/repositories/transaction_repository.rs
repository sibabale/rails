use crate::errors::AppError;
use crate::models::{Transaction, TransactionStatus, TransactionType};
use sqlx::{PgPool, Row};
use std::str::FromStr;
use uuid::Uuid;

pub struct TransactionRepository;

impl TransactionRepository {
    pub async fn create(
        executor: impl sqlx::Executor<'_, Database = sqlx::Postgres>,
        account_id: Uuid,
        transaction_type: TransactionType,
        amount: String,
        currency: &str,
        balance_after: String,
        recipient_account_id: Option<Uuid>,
        external_recipient_id: Option<&str>,
        reference_id: Option<Uuid>,
        description: Option<&str>,
    ) -> Result<Transaction, AppError> {
        let transaction_type_str: &str = match transaction_type {
            TransactionType::Deposit => "deposit",
            TransactionType::Withdrawal => "withdrawal",
            TransactionType::Transfer => "transfer",
            TransactionType::RecurringPayment => "recurring_payment",
            TransactionType::SavingsWithdraw => "savings_withdraw",
        };

        let row = sqlx::query(
            r#"
            INSERT INTO transactions (
                account_id, transaction_type, amount, currency, balance_after,
                recipient_account_id, external_recipient_id, reference_id, description, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
            RETURNING id, account_id, transaction_type, amount::text, currency, balance_after::text,
                      recipient_account_id, external_recipient_id, reference_id, description,
                      status, created_at, updated_at
            "#,
        )
        .bind(account_id)
        .bind(transaction_type_str)
        .bind(&amount)
        .bind(currency)
        .bind(&balance_after)
        .bind(recipient_account_id)
        .bind(external_recipient_id)
        .bind(reference_id)
        .bind(description)
        .fetch_one(executor)
        .await?;

        Ok(Self::row_to_transaction(&row)?)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Transaction, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, account_id, transaction_type, amount::text, currency, balance_after::text,
                   recipient_account_id, external_recipient_id, reference_id, description,
                   status, created_at, updated_at
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
            SELECT id, account_id, transaction_type, amount::text, currency, balance_after::text,
                   recipient_account_id, external_recipient_id, reference_id, description,
                   status, created_at, updated_at
            FROM transactions
            WHERE account_id = $1
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

    pub async fn update_status(
        executor: impl sqlx::Executor<'_, Database = sqlx::Postgres>,
        id: Uuid,
        status: TransactionStatus,
    ) -> Result<Transaction, AppError> {
        let status_str: &str = match status {
            TransactionStatus::Pending => "pending",
            TransactionStatus::Completed => "completed",
            TransactionStatus::Failed => "failed",
            TransactionStatus::Cancelled => "cancelled",
        };

        let row = sqlx::query(
            r#"
            UPDATE transactions
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING id, account_id, transaction_type, amount::text, currency, balance_after::text,
                      recipient_account_id, external_recipient_id, reference_id, description,
                      status, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(status_str)
        .fetch_one(executor)
        .await?;

        Ok(Self::row_to_transaction(&row)?)
    }

    pub fn row_to_transaction(row: &sqlx::postgres::PgRow) -> Result<Transaction, AppError> {
        let transaction_type_str: String = row.get("transaction_type");
        let transaction_type = match transaction_type_str.as_str() {
            "deposit" => TransactionType::Deposit,
            "withdrawal" => TransactionType::Withdrawal,
            "transfer" => TransactionType::Transfer,
            "recurring_payment" => TransactionType::RecurringPayment,
            "savings_withdraw" => TransactionType::SavingsWithdraw,
            _ => return Err(AppError::InvalidTransactionType),
        };

        let status_str: String = row.get("status");
        let status = match status_str.as_str() {
            "pending" => TransactionStatus::Pending,
            "completed" => TransactionStatus::Completed,
            "failed" => TransactionStatus::Failed,
            "cancelled" => TransactionStatus::Cancelled,
            _ => return Err(AppError::Internal("Invalid transaction status".to_string())),
        };

        // Convert Decimal fields from PostgreSQL numeric type via String
        let amount_str: String = row.get("amount");
        let amount = rust_decimal::Decimal::from_str(&amount_str)
            .map_err(|_| AppError::Internal("Failed to parse amount".to_string()))?;

        let balance_after_str: String = row.get("balance_after");
        let balance_after = rust_decimal::Decimal::from_str(&balance_after_str)
            .map_err(|_| AppError::Internal("Failed to parse balance_after".to_string()))?;

        Ok(Transaction {
            id: row.get("id"),
            account_id: row.get("account_id"),
            transaction_type,
            amount,
            currency: row.get("currency"),
            balance_after,
            recipient_account_id: row.get("recipient_account_id"),
            external_recipient_id: row.get("external_recipient_id"),
            reference_id: row.get("reference_id"),
            description: row.get("description"),
            status,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}
