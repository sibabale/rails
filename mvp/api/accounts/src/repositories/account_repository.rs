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
        organization_id: Option<Uuid>,
        environment: &str,
        user_id: Uuid,
        currency: &str,
    ) -> Result<Account, AppError> {
        let account_type_str: &str = match account_type {
            AccountType::Checking => "checking",
            AccountType::Saving => "saving",
        };

        let row = sqlx::query(
            r#"
            INSERT INTO accounts (account_number, account_type, organization_id, environment, user_id, currency)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, account_number, account_type, organization_id, environment, user_id, currency, status, created_at, updated_at
            "#,
        )
        .bind(account_number)
        .bind(account_type_str)
        .bind(organization_id)
        .bind(environment)
        .bind(user_id)
        .bind(currency)
        .fetch_one(pool)
        .await?;

        Ok(Self::row_to_account(&row)?)
    }

    pub async fn create_with_hierarchy(
        executor: impl sqlx::Executor<'_, Database = sqlx::Postgres>,
        account_number: &str,
        account_type: AccountType,
        organization_id: Option<Uuid>,
        environment: &str,
        user_id: Uuid,
        admin_user_id: Option<Uuid>,
        user_role: Option<String>,
        currency: &str,
    ) -> Result<Account, sqlx::Error> {
        let account_type_str: &str = match account_type {
            AccountType::Checking => "checking",
            AccountType::Saving => "saving",
        };

        let row = sqlx::query(
            r#"
            INSERT INTO accounts (account_number, account_type, organization_id, environment, user_id, admin_user_id, user_role, currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, account_number, account_type, organization_id, environment, user_id, admin_user_id, user_role, currency, status, created_at, updated_at
            "#,
        )
        .bind(account_number)
        .bind(account_type_str)
        .bind(organization_id)
        .bind(environment)
        .bind(user_id)
        .bind(admin_user_id)
        .bind(user_role)
        .bind(currency)
        .fetch_one(executor)
        .await?;

        Ok(Self::row_to_account(&row).map_err(|e| sqlx::Error::Protocol(e.to_string().into()))?)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Account, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, account_number, account_type, organization_id, environment, user_id, currency, status, created_at, updated_at
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

    pub async fn find_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Vec<Account>, AppError> {
        let rows = sqlx::query(
            r#"
            SELECT id, account_number, account_type, organization_id, environment, user_id, currency, status, created_at, updated_at
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
            RETURNING id, account_number, account_type, organization_id, environment, user_id, currency, status, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(status_str)
        .fetch_one(pool)
        .await?;

        Ok(Self::row_to_account(&row)?)
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

        Ok(Account {
            id: row.get("id"),
            account_number: row.get("account_number"),
            account_type,
            organization_id: row.get("organization_id"),
            environment: row.get("environment"),
            user_id: row.get("user_id"),
            admin_user_id: row.try_get("admin_user_id").ok(),
            user_role: row.try_get("user_role").ok(),
            currency: Some(row.get("currency")),
            status: Some(status),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}
