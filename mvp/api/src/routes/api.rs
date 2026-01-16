use axum::{
    routing::{delete, get, patch, post},
    Router,
};
use sqlx::PgPool;

use crate::handlers::{
    accounts::*,
    transactions::*,
    health::health_check,
};

pub fn create_router(pool: PgPool) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1", create_api_routes(pool))
}

fn create_api_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/accounts", post(create_account).get(list_accounts))
        .route("/accounts/:id", get(get_account).patch(update_account_status).delete(close_account))
        .route("/accounts/:id/deposit", post(deposit))
        .route("/accounts/:id/withdraw", post(withdraw))
        .route("/accounts/:id/transfer", post(transfer))
        .route("/accounts/:account_id/transactions", get(list_account_transactions))
        .route("/transactions/:id", get(get_transaction))
        .with_state(pool)
}
