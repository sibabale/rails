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
            request
                .environment
                .as_deref()
                .unwrap_or("production"),
            request.user_id,
            &request.currency,
        )
        .await?;

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

        let from_account = AccountRepository::update_balance(&mut *tx, from_account_id, from_new_balance).await?;
        let to_account = AccountRepository::update_balance(&mut *tx, to_account_id, to_new_balance).await?;

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
