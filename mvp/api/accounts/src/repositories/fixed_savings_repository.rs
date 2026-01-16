use crate::errors::AppError;
use crate::models::FixedSavingsPlan;
use sqlx::PgPool;

pub struct FixedSavingsRepository;

impl FixedSavingsRepository {
    // Placeholder - will implement full CRUD operations
    pub async fn create(_pool: &PgPool, _plan: &FixedSavingsPlan) -> Result<FixedSavingsPlan, AppError> {
        todo!("Implement fixed savings plan creation")
    }
}
