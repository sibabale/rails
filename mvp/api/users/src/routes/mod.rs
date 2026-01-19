pub mod business;
pub mod environment;
pub mod apikey;
pub mod user;
pub mod auth;

use axum::{Router, routing::{post, get}};
use axum::body::Body;
use axum::http::Request;
use axum::middleware::{from_fn, Next};
use axum::response::Response;
use crate::db::Db;
use crate::nats::NatsClient;
use crate::grpc::GrpcClients;
use crate::error::AppError;

#[derive(Clone)]
pub struct AppState {
    pub db: Db,
    pub nats: NatsClient,
    pub grpc: GrpcClients,
}

pub fn register_routes(db: Db, nats: NatsClient, grpc: GrpcClients) -> Router {
    let state = AppState { db, nats, grpc };
    let public = Router::new()
        .route("/api/v1/business/register", post(business::register_business))
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/refresh", post(auth::refresh_token))
        .route("/api/v1/auth/revoke", post(auth::revoke_token));

    let protected = Router::new()
        .route("/api/v1/users", post(user::create_user))
        .route("/api/v1/me", get(user::me));

    public
        .merge(protected)
        .layer(from_fn(correlation_id_middleware))
        .layer(from_fn(internal_caller_middleware))
        .with_state(state)
}

async fn internal_caller_middleware(req: Request<Body>, next: Next) -> Result<Response, AppError> {
    let path = req.uri().path();

    let is_sensitive = path == "/api/v1/auth/login" || path == "/api/v1/business/register";
    if !is_sensitive {
        return Ok(next.run(req).await);
    }

    let allowlist_raw = std::env::var("INTERNAL_SERVICE_TOKEN_ALLOWLIST").unwrap_or_default();
    if allowlist_raw.trim().is_empty() {
        return Ok(next.run(req).await);
    }

    let provided_token = req
        .headers()
        .get("x-internal-service-token")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .trim();

    let allowed_tokens: Vec<String> = allowlist_raw
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();

    if provided_token.is_empty() || !allowed_tokens.iter().any(|t| t == provided_token) {
        return Err(AppError::UnrecognizedSource);
    }

    Ok(next.run(req).await)
}

async fn correlation_id_middleware(req: Request<Body>, next: Next) -> Result<Response, AppError> {
    let path = req.uri().path().to_string();
    let method = req.method().to_string();

    if !path.starts_with("/api/") {
        return Ok(next.run(req).await);
    }

    let correlation_id = req
        .headers()
        .get("x-correlation-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or_else(|| AppError::BadRequest("x-correlation-id header is required".to_string()))?;

    let start = std::time::Instant::now();
    tracing::info!(correlation_id = %correlation_id, %method, %path, "start");

    let res = next.run(req).await;
    let status = res.status().as_u16();
    let duration_ms = start.elapsed().as_millis();
    let outcome = if status >= 400 { "failed" } else { "success" };

    if status >= 500 {
        tracing::error!(correlation_id = %correlation_id, %method, %path, status = status, duration_ms = duration_ms as u64, outcome = outcome, "finish");
    } else if status >= 400 {
        tracing::warn!(correlation_id = %correlation_id, %method, %path, status = status, duration_ms = duration_ms as u64, outcome = outcome, "finish");
    } else {
        tracing::info!(correlation_id = %correlation_id, %method, %path, status = status, duration_ms = duration_ms as u64, outcome = outcome, "finish");
    }

    Ok(res)
}
