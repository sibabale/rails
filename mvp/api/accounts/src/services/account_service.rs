use tracing::info;
use crate::errors::AppError;
use crate::models::{Account, AccountStatus, CreateAccountRequest};
use crate::repositories::{AccountRepository, TransactionRepository};
use crate::utils::generate_account_number;
use sqlx::types::BigDecimal;
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

        let account = AccountRepository::create(
            pool,
            &account_number,
            request.account_type,
            request.organization_id,
            &request.environment.unwrap_or_else(|| "default".to_string()),
            request.user_id,
            &request.currency,
        )
        .await?;

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

    pub async fn get_accounts_by_admin(
        pool: &PgPool,
        admin_user_id: Uuid,
        _organization_id: Option<Uuid>,
        _environment: Option<&str>,
    ) -> Result<Vec<Account>, AppError> {
        // TODO: Implement with proper filtering for admin accounts
        // For now, just get accounts for the user
        AccountRepository::find_by_user_id(pool, admin_user_id).await
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

    pub async fn create_account_with_hierarchy(
        &self,
        _request: CreateAccountRequest,
        _admin_user_id: Option<Uuid>,
        _user_role: String,
    ) -> Result<Account, AppError> {
        // This is a placeholder - implement based on your hierarchy logic
        let _account_number = generate_account_number(&PgPool::connect("").await.map_err(|_| AppError::Internal("Failed to get pool".to_string()))?, 12)
            .await?;
        
        Err(AppError::NotImplemented("create_account_with_hierarchy - needs proper implementation".to_string()))
    }

    pub async fn update_account_permissions_for_admin(
        &self,
        user_id: Uuid,
    ) -> Result<(), AppError> {
        // This is a placeholder - implement based on your permission logic
        info!("Updating account permissions for admin: {}", user_id);
        Ok(())
    }

    pub async fn update_account_permissions_for_customer(
        &self,
        user_id: Uuid,
        new_admin_id: Option<Uuid>,
    ) -> Result<(), AppError> {
        // This is a placeholder - implement based on your permission logic
        info!(
            "Updating account permissions for customer: {}, new_admin: {:?}",
            user_id, new_admin_id
        );
        Ok(())
    }

    pub async fn reassign_customer_accounts(
        &self,
        user_id: Uuid,
        new_admin_id: Option<Uuid>,
    ) -> Result<(), AppError> {
        // This is a placeholder - implement based on your reassignment logic
        info!(
            "Reassigning customer {} accounts to new admin: {:?}",
            user_id, new_admin_id
        );
        Ok(())
    }

    pub async fn deposit(
        pool: &PgPool,
        account_id: Uuid,
        amount: sqlx::types::BigDecimal,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        let mut account = AccountRepository::find_by_id(pool, account_id).await?;

        if account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }

        // Start transaction
        let mut tx = pool.begin().await?;

        // Update balance
            // Parse balance to BigDecimal
            let balance_str = account.balance.as_ref().ok_or_else(|| AppError::Internal("Account balance is None".to_string()))?;
            let current_balance = sqlx::types::BigDecimal::parse_bytes(balance_str.as_bytes(), 10)
                .ok_or_else(|| AppError::Internal("Failed to parse account balance".to_string()))?;
            let new_balance = current_balance + amount.clone();
            let new_balance_str = new_balance.to_string();

        // Create transaction record
        let transaction = TransactionRepository::create(
            &mut *tx,
            account_id,
            crate::models::TransactionType::Deposit,
            amount.to_string(),
            account.currency.as_deref().unwrap_or("USD"),
            new_balance_str.clone(),
            None,
            None,
            None,
            None,
        ).await?;

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
        amount: sqlx::types::BigDecimal,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        let account = AccountRepository::find_by_id(pool, account_id).await?;

        if account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }

            // Parse balance to BigDecimal
            let balance_str = account.balance.as_ref().ok_or_else(|| AppError::Internal("Account balance is None".to_string()))?;
            let current_balance = sqlx::types::BigDecimal::parse_bytes(balance_str.as_bytes(), 10)
                .ok_or_else(|| AppError::Internal("Failed to parse account balance".to_string()))?;
            if current_balance < amount {
                return Err(AppError::InsufficientFunds);
            }

        // Start transaction
        let mut tx = pool.begin().await?;

        // Update balance
            let new_balance = current_balance - amount.clone();
            let new_balance_str = new_balance.to_string();
            let account = AccountRepository::update_balance(&mut *tx, account_id, new_balance_str.clone()).await?;

        // Create transaction record
        let transaction = TransactionRepository::create(
            &mut *tx,
            account_id,
            crate::models::TransactionType::Withdrawal,
            amount.to_string(),
            account.currency.as_deref().unwrap_or("USD"),
            new_balance_str.clone(),
            None,
            None,
            None,
            None,
        ).await?;

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
        amount: sqlx::types::BigDecimal,
        description: Option<String>,
    ) -> Result<(Account, Account, crate::models::Transaction), AppError> {
        let from_account = AccountRepository::find_by_id(pool, from_account_id).await?;

        if from_account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }


        let to_account = AccountRepository::find_by_id(pool, to_account_id).await?;

        if to_account.status != Some(AccountStatus::Active) {
            return Err(AppError::AccountNotActive);
        }

        let from_balance_str = from_account.balance.as_ref().ok_or_else(|| AppError::Internal("From account balance is None".to_string()))?;
        let to_balance_str = to_account.balance.as_ref().ok_or_else(|| AppError::Internal("To account balance is None".to_string()))?;
        let from_balance = sqlx::types::BigDecimal::parse_bytes(from_balance_str.as_bytes(), 10)
            .ok_or_else(|| AppError::Internal("Failed to parse from_account balance".to_string()))?;
        let to_balance = sqlx::types::BigDecimal::parse_bytes(to_balance_str.as_bytes(), 10)
            .ok_or_else(|| AppError::Internal("Failed to parse to_account balance".to_string()))?;
        if from_balance < amount {
            return Err(AppError::InsufficientFunds);
        }

        // Start transaction
        let mut tx = pool.begin().await?;

        // Update balance
            let from_new_balance = from_balance - amount.clone();
            let from_new_balance_str = from_new_balance.to_string();
            let to_new_balance = to_balance + amount.clone();
            let to_new_balance_str = to_new_balance.to_string();
            let from_account = AccountRepository::update_balance(&mut *tx, from_account_id, from_new_balance_str.clone()).await?;
            let to_account = AccountRepository::update_balance(&mut *tx, to_account_id, to_new_balance_str.clone()).await?;

        // Create transaction record
        let transaction = TransactionRepository::create(
            &mut *tx,
            from_account_id,
            crate::models::TransactionType::Transfer,
            amount.to_string(),
            from_account.currency.as_deref().unwrap_or("USD"),
            from_new_balance_str.clone(),
            Some(to_account_id),
            None,
            None,
            None,
        ).await?;

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
