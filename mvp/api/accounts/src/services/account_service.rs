use crate::errors::AppError;
use crate::models::{Account, AccountStatus, CreateAccountRequest};
use crate::repositories::{AccountRepository, TransactionRepository};
use crate::utils::generate_account_number;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

pub struct AccountService;

impl AccountService {
    pub async fn create_account(
        pool: &PgPool,
        request: CreateAccountRequest,
    ) -> Result<Account, AppError> {
        // Auto-generate unique account number (12 digits with Luhn checksum)
        let account_number = generate_account_number(pool, 12).await?;

        // Create account with generated number
        let account = AccountRepository::create(
            pool,
            &account_number,
            request.account_type,
            request.organization_id,
            request.environment.as_deref().unwrap_or("production"),
            request.user_id,
            &request.currency,
        )
        .await?;

        Ok(account)
    }

    /// Creates an account with organizational hierarchy context
    pub async fn create_account_with_hierarchy(
        &self,
        request: CreateAccountRequest,
        admin_user_id: Option<Uuid>,
        user_role: String,
    ) -> Result<Account, sqlx::Error> {
        let account_number = Self::generate_account_number(&request.user_id);

        let mut tx = self.pool.begin().await?;

        let account = AccountRepository::create_with_hierarchy(
            &mut tx,
            &account_number,
            request.account_type,
            request.organization_id,
            request.environment.as_deref().unwrap_or("production"),
            request.user_id,
            admin_user_id,
            &user_role,
            &request.currency,
        )
        .await?;

        tx.commit().await?;

        info!(
            "Created account {} for user {} (role: {}, admin: {:?})",
            account.account_number, account.user_id, user_role, admin_user_id
        );

        Ok(account)
    }

    /// Updates account permissions for a user promoted to admin
    pub async fn update_account_permissions_for_admin(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<Account>, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        // Update all accounts for this user to reflect admin permissions
        let accounts = sqlx::query_as!(
            Account,
            r#"
            UPDATE accounts
            SET user_role = 'ADMIN',
                admin_user_id = NULL,
                updated_at = NOW()
            WHERE user_id = $1
            RETURNING id, account_number, account_type as "account_type: _",
                     organization_id, environment, user_id, admin_user_id,
                     user_role, balance, currency, status as "status: _",
                     created_at, updated_at
            "#,
            user_id
        )
        .fetch_all(&mut *tx)
        .await?;

        tx.commit().await?;

        info!(
            "Updated {} accounts for user {} promoted to admin",
            accounts.len(),
            user_id
        );

        Ok(accounts)
    }

    /// Updates account permissions for a user demoted to customer
    pub async fn update_account_permissions_for_customer(
        &self,
        user_id: Uuid,
        new_admin_id: Option<Uuid>,
    ) -> Result<Vec<Account>, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let accounts = if let Some(admin_id) = new_admin_id {
            // Assign to specific admin
            sqlx::query_as!(
                Account,
                r#"
                UPDATE accounts
                SET user_role = 'CUSTOMER',
                    admin_user_id = $2,
                    updated_at = NOW()
                WHERE user_id = $1
                RETURNING id, account_number, account_type as "account_type: _",
                         organization_id, environment, user_id, admin_user_id,
                         user_role, balance, currency, status as "status: _",
                         created_at, updated_at
                "#,
                user_id,
                admin_id
            )
            .fetch_all(&mut *tx)
            .await?
        } else {
            // Just update role, admin assignment handled elsewhere
            sqlx::query_as!(
                Account,
                r#"
                UPDATE accounts
                SET user_role = 'CUSTOMER',
                    updated_at = NOW()
                WHERE user_id = $1
                RETURNING id, account_number, account_type as "account_type: _",
                         organization_id, environment, user_id, admin_user_id,
                         user_role, balance, currency, status as "status: _",
                         created_at, updated_at
                "#,
                user_id
            )
            .fetch_all(&mut *tx)
            .await?
        };

        tx.commit().await?;

        info!(
            "Updated {} accounts for user {} demoted to customer (admin: {:?})",
            accounts.len(),
            user_id,
            new_admin_id
        );

        Ok(accounts)
    }

    /// Reassigns customer accounts to a new admin
    pub async fn reassign_customer_accounts(
        &self,
        customer_user_id: Uuid,
        new_admin_id: Option<Uuid>,
    ) -> Result<Vec<Account>, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let accounts = sqlx::query_as!(
            Account,
            r#"
            UPDATE accounts
            SET admin_user_id = $2,
                updated_at = NOW()
            WHERE user_id = $1 AND user_role = 'CUSTOMER'
            RETURNING id, account_number, account_type as "account_type: _",
                     organization_id, environment, user_id, admin_user_id,
                     user_role, balance, currency, status as "status: _",
                     created_at, updated_at
            "#,
            customer_user_id,
            new_admin_id
        )
        .fetch_all(&mut *tx)
        .await?;

        tx.commit().await?;

        info!(
            "Reassigned {} accounts for customer {} to new admin {:?}",
            accounts.len(),
            customer_user_id,
            new_admin_id
        );

        Ok(accounts)
    }

    /// Gets all accounts managed by an admin (including their own)
    pub async fn get_accounts_by_admin(
        &self,
        admin_user_id: Uuid,
        organization_id: Option<Uuid>,
        environment: Option<&str>,
    ) -> Result<Vec<Account>, sqlx::Error> {
        let accounts = sqlx::query_as!(
            Account,
            r#"
            SELECT id, account_number, account_type as "account_type: _",
                   organization_id, environment, user_id, admin_user_id,
                   user_role, balance, currency, status as "status: _",
                   created_at, updated_at
            FROM accounts
            WHERE (user_id = $1 OR admin_user_id = $1)
              AND ($2::uuid IS NULL OR organization_id = $2)
              AND ($3::text IS NULL OR environment = $3)
              AND status = 'active'
            ORDER BY created_at DESC
            "#,
            admin_user_id,
            organization_id,
            environment
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(accounts)
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

    pub async fn update_account_status(
        pool: &PgPool,
        id: Uuid,
        status: AccountStatus,
    ) -> Result<Account, AppError> {
        let account = AccountRepository::find_by_id(pool, id).await?;

        if account.status == AccountStatus::Closed && status != AccountStatus::Closed {
            return Err(AppError::BusinessLogic(
                "Cannot reactivate a closed account".to_string(),
            ));
        }

        AccountRepository::update_status(pool, id, status).await
    }

    pub async fn close_account(pool: &PgPool, id: Uuid) -> Result<Account, AppError> {
        Self::update_account_status(pool, id, AccountStatus::Closed).await
    }

    pub async fn deposit(
        pool: &PgPool,
        account_id: Uuid,
        amount: Decimal,
        description: Option<String>,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        let mut account = AccountRepository::find_by_id(pool, account_id).await?;

        if account.status != AccountStatus::Active {
            return Err(AppError::AccountNotActive);
        }

        // Start transaction
        let mut tx = pool.begin().await?;

        // Update balance
        let new_balance = account.balance + amount;
        account = AccountRepository::update_balance(&mut *tx, account_id, new_balance).await?;

        // Create transaction record
        let transaction = TransactionRepository::create(
            &mut *tx,
            account_id,
            crate::models::TransactionType::Deposit,
            amount,
            &account.currency,
            new_balance,
            None,
            None,
            None,
            description.as_deref(),
        )
        .await?;

        // Update transaction status to completed
        let transaction = TransactionRepository::update_status(
            &mut *tx,
            transaction.id,
            crate::models::TransactionStatus::Completed,
        )
        .await?;

        tx.commit().await?;

        Ok((account, transaction))
    }

    pub async fn withdraw(
        pool: &PgPool,
        account_id: Uuid,
        amount: Decimal,
        description: Option<String>,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        let account = AccountRepository::find_by_id(pool, account_id).await?;

        if account.status != AccountStatus::Active {
            return Err(AppError::AccountNotActive);
        }

        if account.balance < amount {
            return Err(AppError::InsufficientFunds);
        }

        // Start transaction
        let mut tx = pool.begin().await?;

        // Update balance
        let new_balance = account.balance - amount;
        let account = AccountRepository::update_balance(&mut *tx, account_id, new_balance).await?;

        // Create transaction record
        let transaction = TransactionRepository::create(
            &mut *tx,
            account_id,
            crate::models::TransactionType::Withdrawal,
            amount,
            &account.currency,
            new_balance,
            None,
            None,
            None,
            description.as_deref(),
        )
        .await?;

        // Update transaction status to completed
        let transaction = TransactionRepository::update_status(
            &mut *tx,
            transaction.id,
            crate::models::TransactionStatus::Completed,
        )
        .await?;

        tx.commit().await?;

        Ok((account, transaction))
    }

    pub async fn transfer(
        pool: &PgPool,
        from_account_id: Uuid,
        to_account_id: Uuid,
        amount: Decimal,
        description: Option<String>,
    ) -> Result<(Account, Account, crate::models::Transaction), AppError> {
        let from_account = AccountRepository::find_by_id(pool, from_account_id).await?;

        if from_account.status != AccountStatus::Active {
            return Err(AppError::AccountNotActive);
        }

        if from_account.balance < amount {
            return Err(AppError::InsufficientFunds);
        }

        let to_account = AccountRepository::find_by_id(pool, to_account_id).await?;

        if to_account.status != AccountStatus::Active {
            return Err(AppError::BusinessLogic(
                "Recipient account is not active".to_string(),
            ));
        }

        if from_account.currency != to_account.currency {
            return Err(AppError::BusinessLogic(
                "Cannot transfer between different currencies".to_string(),
            ));
        }

        // Start transaction
        let mut tx = pool.begin().await?;

        // Update balances
        let from_new_balance = from_account.balance - amount;
        let to_new_balance = to_account.balance + amount;

        let from_account =
            AccountRepository::update_balance(&mut *tx, from_account_id, from_new_balance).await?;
        let to_account =
            AccountRepository::update_balance(&mut *tx, to_account_id, to_new_balance).await?;

        // Create transaction record
        let transaction = TransactionRepository::create(
            &mut *tx,
            from_account_id,
            crate::models::TransactionType::Transfer,
            amount,
            &from_account.currency,
            from_new_balance,
            Some(to_account_id),
            None,
            None,
            description.as_deref(),
        )
        .await?;

        // Update transaction status to completed
        let transaction = TransactionRepository::update_status(
            &mut *tx,
            transaction.id,
            crate::models::TransactionStatus::Completed,
        )
        .await?;

        tx.commit().await?;

        Ok((from_account, to_account, transaction))
    }
}
