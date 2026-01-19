//! Main entry point for the Users microservice

mod config;
mod db;
mod error;
mod models;
mod routes;
mod auth;
mod nats;
mod grpc;

use tracing_subscriber;
use crate::routes::register_routes;
use axum::serve;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();
    
    let config = config::load()?;
    tracing::info!("Loaded configuration");
    tracing::info!("  DATABASE_URL: {}", mask_url(&config.database_url));
    tracing::info!("  NATS_URL: {}", config.nats_url);
    tracing::info!("  SERVER_ADDR: {}", config.server_addr);
    
    tracing::info!("Connecting to database...");
    let db = db::init(&config.database_url).await
        .map_err(|e| anyhow::anyhow!("Failed to connect to database: {}. Make sure PostgreSQL is running and DATABASE_URL is correct.", e))?;
    tracing::info!("Database connection established");
    
    tracing::info!("Connecting to NATS...");
    let nats = nats::init(&config.nats_url).await?;
    // NATS is optional - service will continue even if connection fails
    
    tracing::info!("Initializing gRPC clients...");
    let grpc = grpc::init(&config).await?;
    tracing::info!("gRPC clients initialized");
    
    let app = register_routes(db.clone(), nats.clone(), grpc.clone());
    let addr: std::net::SocketAddr = config.server_addr.parse()
        .map_err(|e| anyhow::anyhow!("Failed to parse SERVER_ADDR '{}': {}", config.server_addr, e))?;
    
    tracing::info!("Binding to address {}...", addr);
    let listener = TcpListener::bind(&addr).await
        .map_err(|e| anyhow::anyhow!("Failed to bind to {}: {}", addr, e))?;
    
    tracing::info!("🚀 Users service started successfully on http://{}", addr);
    tracing::info!("Available endpoints:");
    tracing::info!("  POST /api/v1/business/register");
    tracing::info!("  POST /api/v1/users");
    tracing::info!("  POST /api/v1/auth/login");
    tracing::info!("  POST /api/v1/auth/refresh");
    tracing::info!("  POST /api/v1/auth/revoke");
    
    serve(listener, app).await?;
    Ok(())
}

fn mask_url(url: &str) -> String {
    if let Some(at_pos) = url.find('@') {
        format!("postgresql://***@{}", &url[at_pos+1..])
    } else {
        url.to_string()
    }
}
