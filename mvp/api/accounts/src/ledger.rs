use crate::errors::AppError;
use crate::models::Transaction;

pub trait LedgerAdapter {
    fn notify_ledger(&self, transaction: &Transaction) -> Result<(), AppError>;
}

pub struct NoopLedgerAdapter;

impl LedgerAdapter for NoopLedgerAdapter {
    fn notify_ledger(&self, _transaction: &Transaction) -> Result<(), AppError> {
        Ok(())
    }
}
