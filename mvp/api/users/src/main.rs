//! Main entry point for the Users microservice

mod config;
mod db;
mod error;
mod models;
mod routes;
mod auth;
mod grpc;

use tracing_subscriber::prelude::*;
use crate::routes::register_routes;
use axum::serve;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    
    let config = config::load()?;
    
    // Initialize Sentry before tracing to capture all errors
    let _guard = if let Some(dsn) = &config.sentry_dsn {
        tracing::info!("Initializing Sentry error tracking");
        Some(sentry::init((
            dsn.clone(),
            sentry::ClientOptions {
                release: sentry::release_name!(),
                environment: Some(config.environment.clone().into()),
                traces_sample_rate: 0.1, // Sample 10% of transactions for MVP
                ..Default::default()
            },
        )))
    } else {
        tracing::info!("Sentry DSN not configured, skipping error tracking");
        None
    };
    
    // Initialize tracing with Sentry integration
    if config.sentry_dsn.is_some() {
        tracing_subscriber::registry()
            .with(tracing_subscriber::fmt::layer())
            .with(sentry_tracing::layer())
            .init();
    } else {
        tracing_subscriber::fmt::init();
    }
    tracing::info!("Loaded configuration");
    tracing::info!("  DATABASE_URL: {}", mask_url(&config.database_url));
    tracing::info!("  SERVER_ADDR: {}", config.server_addr);
    tracing::info!("  ACCOUNTS_GRPC_URL: {}", config.accounts_grpc_url);
    
    tracing::info!("Connecting to database...");
    let db = db::init(&config.database_url).await
        .map_err(|e| anyhow::anyhow!("Failed to connect to database: {}. Make sure PostgreSQL is running and DATABASE_URL is correct.", e))?;
    tracing::info!("Database connection established");
    
    // Run migrations
    tracing::info!("Running database migrations...");
    let mut migrator = sqlx::migrate!("./migrations");
    migrator.set_ignore_missing(true);
    if let Err(e) = migrator.run(&db).await {
        match e {
            sqlx::migrate::MigrateError::VersionMissing(_)
            | sqlx::migrate::MigrateError::VersionMismatch(_) => {
                tracing::warn!(
                    "Skipping SQLx migration failure (shared prod DB / hash drift): {}",
                    e
                );
            }
            _ => {
                tracing::error!("Migration failed: {}", e);
                return Err(anyhow::anyhow!("Migration failed: {}", e));
            }
        }
    }
    tracing::info!("Database migrations completed");
    
    tracing::info!("Initializing gRPC clients...");
    let grpc = grpc::init(&config).await?;
    tracing::info!("gRPC clients initialized");
    
    let app = register_routes(db.clone(), grpc.clone());
    let addr: std::net::SocketAddr = config.server_addr.parse()
        .map_err(|e| anyhow::anyhow!("Failed to parse SERVER_ADDR '{}': {}", config.server_addr, e))?;
    
    tracing::info!("Binding to address {}...", addr);
    let listener = TcpListener::bind(&addr).await
        .map_err(|e| anyhow::anyhow!("Failed to bind to {}: {}", addr, e))?;
    
    tracing::info!("🚀 Users service started successfully on http://{}", addr);
    tracing::info!("Available endpoints:");
    tracing::info!("  GET  /health");
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
