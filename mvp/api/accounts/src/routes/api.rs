use axum::{
    body::Body,
    http::Request,
    middleware::{from_fn, Next},
    response::Response,
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::handlers::{
    accounts::*,
    transactions::{create_transaction, get_transaction, list_account_transactions, list_transactions},
    health::health_check,
};

use crate::errors::AppError;
use crate::ledger_grpc::LedgerGrpc;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub ledger_grpc: LedgerGrpc,
}

pub fn create_router(pool: PgPool, ledger_grpc: LedgerGrpc) -> Router {
    let state = AppState { pool, ledger_grpc };
    Router::<AppState>::new()
        .route("/health", get(health_check))
        .nest("/api/v1", create_api_routes())
        .layer(from_fn(correlation_id_middleware))
        .with_state(state)
}

fn create_api_routes() -> Router<AppState> {
    let standard_routes = Router::<AppState>::new()
        .route("/accounts", post(create_account).get(list_accounts))
        .route("/accounts/:id", get(get_account).patch(update_account_status).delete(close_account))
        .route("/accounts/:id/withdraw", post(withdraw))
        .route("/accounts/:account_id/transactions", get(list_account_transactions))
        .route("/transactions", post(create_transaction).get(list_transactions))
        .route("/transactions/:id", get(get_transaction));

    let money_mutations = Router::<AppState>::new()
        .route("/accounts/:id/deposit", post(deposit))
        .route("/accounts/:id/transfer", post(transfer))
        .layer(from_fn(money_rate_limit_middleware));

    standard_routes.merge(money_mutations)
}

async fn correlation_id_middleware(
    req: Request<Body>,
    next: Next,
) -> Result<Response, AppError> {
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

    let correlation_id = existing
        .as_deref()
        .map(ToString::to_string)
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let mut req = req;
    if existing.is_none() {
        req.headers_mut().insert(
            "x-correlation-id",
            correlation_id
                .parse()
                .map_err(|_| AppError::Internal("Failed to set correlation id".to_string()))?,
        );
    }

    let start = std::time::Instant::now();
    tracing::info!(correlation_id = %correlation_id, %method, %path, "start");

    let mut res = next.run(req).await;
    res.headers_mut().insert(
        "x-correlation-id",
        correlation_id
            .parse()
            .map_err(|_| AppError::Internal("Failed to set correlation id".to_string()))?,
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

static MONEY_RATE_LIMITER: OnceLock<Mutex<HashMap<String, RateLimitWindow>>> = OnceLock::new();
static MONEY_RATE_LIMIT_CONFIG: OnceLock<RateLimitConfig> = OnceLock::new();

fn money_rate_limit_config() -> &'static RateLimitConfig {
    MONEY_RATE_LIMIT_CONFIG.get_or_init(|| {
        let window_seconds = std::env::var("ACCOUNTS_MONEY_RATE_LIMIT_WINDOW_SECONDS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .filter(|v| *v > 0)
            .unwrap_or(60);
        let max_requests = std::env::var("ACCOUNTS_MONEY_RATE_LIMIT_MAX")
            .ok()
            .and_then(|v| v.parse::<u32>().ok())
            .filter(|v| *v > 0)
            .unwrap_or(20);
        RateLimitConfig {
            window: Duration::from_secs(window_seconds),
            max: max_requests,
        }
    })
}

fn money_rate_limit_store() -> &'static Mutex<HashMap<String, RateLimitWindow>> {
    MONEY_RATE_LIMITER.get_or_init(|| Mutex::new(HashMap::new()))
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

fn money_rate_limit_allow(client_key: &str) -> bool {
    let config = money_rate_limit_config();
    let mut store = money_rate_limit_store()
        .lock()
        .expect("money rate limiter lock poisoned");
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

async fn money_rate_limit_middleware(req: Request<Body>, next: Next) -> Result<Response, AppError> {
    let client_key = extract_client_key(&req);
    if !money_rate_limit_allow(&client_key) {
        return Err(AppError::TooManyRequests);
    }
    Ok(next.run(req).await)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_money_rate_limiter() {
        if let Some(store) = MONEY_RATE_LIMITER.get() {
            store.lock().unwrap().clear();
        }
    }

    #[test]
    fn money_rate_limit_blocks_after_max() {
        reset_money_rate_limiter();
        let config = money_rate_limit_config();
        let client = "10.0.0.1";
        for _ in 0..config.max {
            assert!(money_rate_limit_allow(client));
        }
        assert!(!money_rate_limit_allow(client));
    }
}
