pub mod business;
pub mod apikey;
pub mod user;
pub mod auth;
pub mod health;
pub mod password_reset;
pub mod beta;

use axum::{Router, routing::{post, get}};
use axum::body::Body;
use axum::http::Request;
use axum::middleware::{from_fn, Next};
use axum::response::Response;
use crate::db::Db;
use crate::grpc::GrpcClients;
use crate::error::AppError;
use crate::email::EmailService;
use uuid::Uuid;
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

#[derive(Clone)]
pub struct AppState {
    pub db: Db,
    pub grpc: GrpcClients,
    pub email: Option<EmailService>,
}

pub fn register_routes(db: Db, grpc: GrpcClients, email: Option<EmailService>) -> Router {
    let state = AppState { db, grpc, email };
    let public = Router::new()
        .route("/health", get(health::health_check))
        .route("/api/v1/business/register", post(business::register_business))
        .route("/api/v1/auth/refresh", post(auth::refresh_token))
        .route("/api/v1/auth/revoke", post(auth::revoke_token));

    let auth_limited = Router::new()
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/password-reset/request", post(password_reset::request_password_reset))
        .route("/api/v1/auth/password-reset/reset", post(password_reset::reset_password))
        .route("/api/v1/beta/apply", post(beta::apply_for_beta))
        .layer(from_fn(auth_rate_limit_middleware));

    let protected = Router::new()
        .route("/api/v1/users", post(user::create_user).get(user::list_users))
        .route("/api/v1/api-keys", post(apikey::create_api_key))
        .route("/api/v1/api-keys", get(apikey::list_api_keys))
        .route("/api/v1/api-keys/:api_key_id/revoke", post(apikey::revoke_api_key))
        .route("/api/v1/me", get(user::me));

    public
        .merge(auth_limited)
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

    let existing = req
        .headers()
        .get("x-correlation-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let should_set_header = existing.is_none();
    let correlation_id = existing.unwrap_or_else(|| Uuid::new_v4().to_string());

    let mut req = req;
    if should_set_header {
        req.headers_mut().insert(
            "x-correlation-id",
            correlation_id
                .parse()
                .map_err(|_| AppError::Internal)?,
        );
    }

    let start = std::time::Instant::now();
    tracing::info!(correlation_id = %correlation_id, %method, %path, "start");

    let mut res = next.run(req).await;
    res.headers_mut().insert(
        "x-correlation-id",
        correlation_id
            .parse()
            .map_err(|_| AppError::Internal)?,
    );
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

struct RateLimitWindow {
    start: Instant,
    count: u32,
}

struct RateLimitConfig {
    window: Duration,
    max: u32,
}

static AUTH_RATE_LIMITER: OnceLock<Mutex<HashMap<String, RateLimitWindow>>> = OnceLock::new();
static AUTH_RATE_LIMIT_CONFIG: OnceLock<RateLimitConfig> = OnceLock::new();

fn auth_rate_limit_config() -> &'static RateLimitConfig {
    AUTH_RATE_LIMIT_CONFIG.get_or_init(|| {
        let window_seconds = std::env::var("USERS_AUTH_RATE_LIMIT_WINDOW_SECONDS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .filter(|v| *v > 0)
            .unwrap_or(60);
        let max_requests = std::env::var("USERS_AUTH_RATE_LIMIT_MAX")
            .ok()
            .and_then(|v| v.parse::<u32>().ok())
            .filter(|v| *v > 0)
            .unwrap_or(10);
        RateLimitConfig {
            window: Duration::from_secs(window_seconds),
            max: max_requests,
        }
    })
}

fn auth_rate_limit_store() -> &'static Mutex<HashMap<String, RateLimitWindow>> {
    AUTH_RATE_LIMITER.get_or_init(|| Mutex::new(HashMap::new()))
}

fn extract_client_key(req: &Request<Body>) -> String {
    let forwarded_for = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|value| value.split(',').next().unwrap_or("").trim().to_string())
        .filter(|value| !value.is_empty());

    if let Some(value) = forwarded_for {
        return value;
    }

    let real_ip = req
        .headers()
        .get("x-real-ip")
        .and_then(|v| v.to_str().ok())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    real_ip.unwrap_or_else(|| "unknown".to_string())
}

fn auth_rate_limit_allow(client_key: &str) -> bool {
    let config = auth_rate_limit_config();
    let mut store = auth_rate_limit_store()
        .lock()
        .expect("auth rate limiter lock poisoned");
    let now = Instant::now();
    let entry = store
        .entry(client_key.to_string())
        .or_insert(RateLimitWindow { start: now, count: 0 });

    if now.duration_since(entry.start) > config.window {
        entry.start = now;
        entry.count = 0;
    }

    if entry.count >= config.max {
        return false;
    }

    entry.count += 1;
    true
}

async fn auth_rate_limit_middleware(req: Request<Body>, next: Next) -> Result<Response, AppError> {
    let client_key = extract_client_key(&req);
    if !auth_rate_limit_allow(&client_key) {
        return Err(AppError::TooManyRequests);
    }
    Ok(next.run(req).await)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_auth_rate_limiter() {
        if let Some(store) = AUTH_RATE_LIMITER.get() {
            store.lock().unwrap().clear();
        }
    }

    #[test]
    fn auth_rate_limit_blocks_after_max() {
        reset_auth_rate_limiter();
        let config = auth_rate_limit_config();
        let client = "127.0.0.1";
        for _ in 0..config.max {
            assert!(auth_rate_limit_allow(client));
        }
        assert!(!auth_rate_limit_allow(client));
    }
}
