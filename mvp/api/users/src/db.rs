use sqlx::{Pool, Postgres};
use sqlx::postgres::PgPoolOptions;

pub type Db = Pool<Postgres>;

pub async fn init(database_url: &str) -> Result<Db, sqlx::Error> {
    // Configure connection pool with reasonable defaults
    // For Supabase/Neon, use the pooler URL (ends with -pooler) for better performance
    PgPoolOptions::new()
        .max_connections(10) // Reasonable default for a microservice
        .acquire_timeout(std::time::Duration::from_secs(5)) // Fail fast if DB is unavailable
        .connect(database_url)
        .await
}
