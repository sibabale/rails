use crate::errors::AppError;
use crate::models::RecurringPayment;
use sqlx::PgPool;

pub struct RecurringPaymentRepository;

impl RecurringPaymentRepository {
    // Placeholder - will implement full CRUD operations
    pub async fn create(_pool: &PgPool, _payment: &RecurringPayment) -> Result<RecurringPayment, AppError> {
        todo!("Implement recurring payment creation")
    }
}
