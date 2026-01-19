#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub nats_url: String,
    pub server_addr: String,
}

pub fn load() -> Result<Config, anyhow::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .map_err(|_| anyhow::anyhow!(
            "DATABASE_URL environment variable is required. \
            Set it to your PostgreSQL connection string (e.g., Supabase, Neon, or local PostgreSQL). \
            Example: postgresql://user:password@host:5432/database"
        ))?;
    
    Ok(Config {
        database_url,
        nats_url: std::env::var("NATS_URL")
            .unwrap_or_else(|_| "nats://localhost:4222".to_string()),
        server_addr: std::env::var("SERVER_ADDR")
            .unwrap_or_else(|_| "0.0.0.0:8080".to_string()),
    })
}
