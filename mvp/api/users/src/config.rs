#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub nats_url: String,
    pub server_addr: String,
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

    let nats_url = std::env::var("NATS_URL")
        .ok()
        .filter(|v| !v.trim().is_empty())
        .unwrap_or_else(|| "nats://localhost:4222".to_string());
    
    Ok(Config {
        database_url,
        nats_url,
        server_addr,
    })
}
