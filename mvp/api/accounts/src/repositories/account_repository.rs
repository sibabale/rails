use crate::errors::AppError;
use crate::models::{Account, AccountStatus, AccountType};
use sqlx::{PgPool, Row};
use uuid::Uuid;

pub struct AccountRepository;

impl AccountRepository {
    pub async fn create(
        pool: &PgPool,
        account_number: &str,
        account_type: AccountType,
        user_id: Uuid,
        currency: &str,
    ) -> Result<Account, AppError> {
        let account_type_str: &str = match account_type {
            AccountType::Checking => "checking",
            AccountType::Saving => "saving",
        };

        let row = sqlx::query(
            r#"
            INSERT INTO accounts (account_number, account_type, user_id, currency)
            VALUES ($1, $2, $3, $4)
            RETURNING id, account_number, account_type, user_id, balance::text, currency, status, created_at, updated_at
            "#,
        )
        .bind(account_number)
        .bind(account_type_str)
        .bind(user_id)
        .bind(currency)
        .fetch_one(pool)
        .await?;

        Ok(Self::row_to_account(&row)?)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Account, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, account_number, account_type, user_id, balance::text, currency, status, created_at, updated_at
            FROM accounts
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Account with id {} not found", id)))?;

        Ok(Self::row_to_account(&row)?)
    }

    pub async fn find_by_account_number(
        pool: &PgPool,
        account_number: &str,
    ) -> Result<Account, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, account_number, account_type, user_id, balance::text, currency, status, created_at, updated_at
            FROM accounts
            WHERE account_number = $1
            "#,
        )
        .bind(account_number)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Account {} not found", account_number)))?;

        Ok(Self::row_to_account(&row)?)
    }

    pub async fn find_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Vec<Account>, AppError> {
        let rows = sqlx::query(
            r#"
            SELECT id, account_number, account_type, user_id, balance::text, currency, status, created_at, updated_at
            FROM accounts
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        let accounts = rows
            .iter()
            .map(|row| Self::row_to_account(row))
            .collect::<Result<Vec<_>, _>>()?;

        Ok(accounts)
    }

    pub async fn update_balance(
        executor: impl sqlx::Executor<'_, Database = sqlx::Postgres>,
        id: Uuid,
        new_balance: rust_decimal::Decimal,
    ) -> Result<Account, AppError> {
        let row = sqlx::query(
            r#"
            UPDATE accounts
            SET balance = $2::numeric, updated_at = NOW()
            WHERE id = $1
            RETURNING id, account_number, account_type, user_id, balance::text, currency, status, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(new_balance.to_string())
        .fetch_one(executor)
        .await?;

        Ok(Self::row_to_account(&row)?)
    }

    pub async fn update_status(
        pool: &PgPool,
        id: Uuid,
        status: AccountStatus,
    ) -> Result<Account, AppError> {
        let status_str: &str = match status {
            AccountStatus::Active => "active",
            AccountStatus::Suspended => "suspended",
            AccountStatus::Closed => "closed",
        };

        let row = sqlx::query(
            r#"
            UPDATE accounts
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING id, account_number, account_type, user_id, balance::text, currency, status, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(status_str)
        .fetch_one(pool)
        .await?;

        Ok(Self::row_to_account(&row)?)
    }

    pub async fn batch_create(
        pool: &PgPool,
        accounts: Vec<(String, AccountType, Uuid, String)>,
    ) -> Result<Vec<Account>, AppError> {
        let mut created_accounts = Vec::new();

        for (account_number, account_type, user_id, currency) in accounts {
            let account = Self::create(pool, &account_number, account_type, user_id, &currency)
                .await?;
            created_accounts.push(account);
        }

        Ok(created_accounts)
    }

    fn row_to_account(row: &sqlx::postgres::PgRow) -> Result<Account, AppError> {
        let account_type_str: String = row.get("account_type");
        let account_type = match account_type_str.as_str() {
            "checking" => AccountType::Checking,
            "saving" => AccountType::Saving,
            _ => return Err(AppError::InvalidAccountType),
        };

        let status_str: String = row.get("status");
        let status = match status_str.as_str() {
            "active" => AccountStatus::Active,
            "suspended" => AccountStatus::Suspended,
            "closed" => AccountStatus::Closed,
            _ => return Err(AppError::Internal("Invalid account status".to_string())),
        };

        // Convert Decimal from PostgreSQL numeric type (stored as string)
        let balance_str: String = row.get("balance");
        let balance = rust_decimal::Decimal::from_str_exact(&balance_str)
            .map_err(|e| AppError::Internal(format!("Failed to parse balance: {}", e)))?;

        Ok(Account {
            id: row.get("id"),
            account_number: row.get("account_number"),
            account_type,
            user_id: row.get("user_id"),
            balance,
            currency: row.get("currency"),
            status,
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}
