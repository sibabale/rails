mod config;
mod errors;
mod handlers;
mod models;
mod repositories;
mod routes;
mod services;
mod utils;

use axum::serve;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tracing::info;

use config::Settings;
use routes::create_router;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load configuration
    let settings = Settings::from_env()?;

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(&settings.log_level)
        .init();

    // Create database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(&settings.database_url)
        .await?;

    info!("Connected to database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    info!("Database migrations completed");

    // Create router
    let app = create_router(pool);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.port));
    info!("Server starting on {}", addr);

    let listener = TcpListener::bind(addr).await?;
    serve(listener, app.into_make_service()).await?;

    Ok(())
}
