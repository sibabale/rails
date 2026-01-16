use crate::errors::AppError;
use crate::models::Transaction;
use crate::repositories::TransactionRepository;
use sqlx::PgPool;
use uuid::Uuid;

pub struct TransactionService;

impl TransactionService {
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
