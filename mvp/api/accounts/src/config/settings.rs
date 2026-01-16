use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
    pub database_url: String,
    pub port: u16,
    #[allow(dead_code)]
    pub host: String,
    pub log_level: String,
}

impl Settings {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        dotenv::dotenv().ok();

        let database_url = std::env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set");

        let port = std::env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse()
            .unwrap_or(8080);

        let host = std::env::var("HOST")
            .unwrap_or_else(|_| "0.0.0.0".to_string());

        let log_level = std::env::var("RUST_LOG")
            .unwrap_or_else(|_| "info".to_string());

        Ok(Settings {
            database_url,
            port,
            host,
            log_level,
        })
    }
}
