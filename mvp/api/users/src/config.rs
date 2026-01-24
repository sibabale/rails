#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub server_addr: String,
    pub accounts_grpc_url: String,
    pub sentry_dsn: Option<String>,
    pub environment: String,
}

pub fn load() -> Result<Config, anyhow::Error> {
    let mut database_url = std::env::var("DATABASE_URL")
        .map_err(|_| anyhow::anyhow!(
            "DATABASE_URL environment variable is required. \
            Set it to your PostgreSQL connection string (e.g., Supabase, Neon, or local PostgreSQL). \
            Example: postgresql://user:password@host:5432/database"
        ))?;

    if let Some(stripped) = database_url.strip_prefix("jdbc:") {
        database_url = stripped.to_string();
    }

    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = std::env::var("PORT").ok().and_then(|p| p.parse::<u16>().ok());
    let server_addr = if let Some(port) = port {
        format!("{}:{}", host, port)
    } else {
        std::env::var("SERVER_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".to_string())
    };

    let accounts_grpc_url = std::env::var("ACCOUNTS_GRPC_URL")
        .unwrap_or_else(|_| "http://localhost:50052".to_string());
    
    let sentry_dsn = std::env::var("SENTRY_DSN").ok();
    let environment = std::env::var("ENVIRONMENT")
        .unwrap_or_else(|_| "development".to_string());
    
    Ok(Config {
        database_url,
        server_addr,
        accounts_grpc_url,
        sentry_dsn,
        environment,
    })
}
