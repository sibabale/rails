use axum::{
    body::Body,
    http::Request,
    middleware::{from_fn, Next},
    response::Response,
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::handlers::{
    accounts::*,
    transactions::*,
    health::health_check,
};

use crate::errors::AppError;

pub fn create_router(pool: PgPool) -> Router {
    Router::<PgPool>::new()
        .route("/health", get(health_check))
        .nest("/api/v1", create_api_routes())
        .layer(from_fn(correlation_id_middleware))
        .with_state(pool)
}

fn create_api_routes() -> Router<PgPool> {
    Router::<PgPool>::new()
        .route("/accounts", post(create_account).get(list_accounts))
        .route("/accounts/:id", get(get_account).patch(update_account_status).delete(close_account))
        .route("/accounts/:id/deposit", post(deposit))
        .route("/accounts/:id/withdraw", post(withdraw))
        .route("/accounts/:id/transfer", post(transfer))
        .route("/accounts/:account_id/transactions", get(list_account_transactions))
        .route("/transactions", post(create_transaction))
        .route("/transactions/:id", get(get_transaction))
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
