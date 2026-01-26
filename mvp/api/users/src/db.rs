use sqlx::{Pool, Postgres};
use sqlx::postgres::PgPoolOptions;

pub type Db = Pool<Postgres>;

pub async fn init(database_url: &str) -> Result<Db, sqlx::Error> {
    // Configure connection pool with reasonable defaults
    // For Supabase/Neon, use the pooler URL (ends with -pooler) for better performance
    // Pooler connections are limited, so use fewer max_connections
    PgPoolOptions::new()
        .max_connections(5) // Reduced for pooler connections (Neon pooler has limits)
        .acquire_timeout(std::time::Duration::from_secs(30)) // Increased timeout for remote databases
        .idle_timeout(std::time::Duration::from_secs(600)) // 10 minutes
        .max_lifetime(std::time::Duration::from_secs(1800)) // 30 minutes
        .test_before_acquire(false) // Disable ping health checks to avoid connection errors
        .connect(database_url)
        .await
}
