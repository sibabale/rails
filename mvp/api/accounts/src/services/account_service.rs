use tracing::info;
use crate::errors::AppError;
use crate::models::{Account, AccountStatus, CreateAccountRequest};
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
        amount: i64,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        let idempotency_key = Uuid::new_v4().to_string();
        Self::deposit_with_idempotency(pool, account_id, amount, &idempotency_key).await
    }

    pub async fn deposit_with_idempotency(
        pool: &PgPool,
        account_id: Uuid,
        amount: i64,
        idempotency_key: &str,
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

        let mut tx = pool.begin().await?;

        let transaction = TransactionRepository::create_or_get_by_idempotency(
            &mut *tx,
            organization_id,
            account_id,
            account_id,
            amount,
            &currency,
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

        Ok((account, transaction))
    }

    pub async fn withdraw(
        pool: &PgPool,
        account_id: Uuid,
        amount: i64,
    ) -> Result<(Account, crate::models::Transaction), AppError> {
        let idempotency_key = Uuid::new_v4().to_string();
        Self::withdraw_with_idempotency(pool, account_id, amount, &idempotency_key).await
    }

    pub async fn withdraw_with_idempotency(
        pool: &PgPool,
        account_id: Uuid,
        amount: i64,
        idempotency_key: &str,
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

        let mut tx = pool.begin().await?;
        let idempotency_key = Uuid::new_v4().to_string();

        let transaction = TransactionRepository::create_or_get_by_idempotency(
            &mut *tx,
            organization_id,
            account_id,
            account_id,
            amount,
            &currency,
            &idempotency_key,
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

        Ok((account, transaction))
    }

    pub async fn transfer(
        pool: &PgPool,
        from_account_id: Uuid,
        to_account_id: Uuid,
        amount: i64,
        _description: Option<String>,
    ) -> Result<(Account, Account, crate::models::Transaction), AppError> {
        let idempotency_key = Uuid::new_v4().to_string();
        Self::transfer_with_idempotency(pool, from_account_id, to_account_id, amount, &idempotency_key).await
    }

    pub async fn transfer_with_idempotency(
        pool: &PgPool,
        from_account_id: Uuid,
        to_account_id: Uuid,
        amount: i64,
        idempotency_key: &str,
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

        let mut tx = pool.begin().await?;

        let transaction = TransactionRepository::create_or_get_by_idempotency(
            &mut *tx,
            from_org,
            from_account_id,
            to_account_id,
            amount,
            &from_currency,
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

        Ok((from_account, to_account, transaction))
    }
}
