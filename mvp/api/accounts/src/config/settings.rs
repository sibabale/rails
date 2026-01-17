use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
    pub database_url: String,
    pub port: u16,
    pub grpc_port: u16,
    pub nats_url: String,
    pub nats_stream: String,
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

        let grpc_port = std::env::var("GRPC_PORT")
            .unwrap_or_else(|_| "9090".to_string())
            .parse()
            .unwrap_or(9090);

        let nats_url = std::env::var("NATS_URL")
            .unwrap_or_else(|_| "nats://localhost:4222".to_string());

        let nats_stream = std::env::var("NATS_STREAM")
            .unwrap_or_else(|_| "rails_events".to_string());

        let host = std::env::var("HOST")
            .unwrap_or_else(|_| "0.0.0.0".to_string());

        let log_level = std::env::var("RUST_LOG")
            .unwrap_or_else(|_| "info".to_string());

        Ok(Settings {
            database_url,
            port,
            grpc_port,
            nats_url,
            nats_stream,
            host,
            log_level,
        })
    }
}
