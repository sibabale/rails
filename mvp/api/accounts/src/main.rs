mod config;
mod errors;
mod grpc;
mod handlers;
mod models;
mod nats;
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

use grpc::accounts::AccountsGrpcService;
use grpc::proto::accounts_service_server::AccountsServiceServer;
use tonic::transport::Server;

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
    sqlx::migrate!("./migrations").run(&pool).await?;

    info!("Database migrations completed");

    // Create router
    let app = create_router(pool.clone());

    let grpc_addr = SocketAddr::from(([0, 0, 0, 0], settings.grpc_port));
    let grpc_service = AccountsGrpcService::new(pool.clone());

    let nats_pool = pool.clone();
    let nats_url = settings.nats_url.clone();
    let nats_stream = settings.nats_stream.clone();
    tokio::spawn(async move {
        if let Err(e) = crate::nats::run(nats_pool, nats_url, nats_stream).await {
            tracing::error!("Accounts NATS loop crashed: {}", e);
        }
    });

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.port));
    info!("Server starting on {}", addr);
    info!("gRPC server starting on {}", grpc_addr);

    let listener = TcpListener::bind(addr).await?;

    let http_task = async move {
        serve(listener, app.into_make_service())
            .await
            .map_err(|e| anyhow::anyhow!("HTTP server error: {}", e))
    };

    let grpc_task = async move {
        Server::builder()
            .add_service(AccountsServiceServer::new(grpc_service))
            .serve(grpc_addr)
            .await
            .map_err(|e| anyhow::anyhow!("gRPC server error: {}", e))
    };

    tokio::try_join!(http_task, grpc_task)?;

    Ok(())
}
