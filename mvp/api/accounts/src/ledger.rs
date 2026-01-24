use crate::errors::AppError;
use crate::models::Transaction;

pub trait LedgerAdapter {
    async fn notify_ledger(
        &self,
        transaction: &Transaction,
        environment: &str,
    ) -> Result<(), AppError>;
}

pub struct NoopLedgerAdapter;

impl LedgerAdapter for NoopLedgerAdapter {
    async fn notify_ledger(
        &self,
        _transaction: &Transaction,
        _environment: &str,
    ) -> Result<(), AppError> {
        Ok(())
    }
}
