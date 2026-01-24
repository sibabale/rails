use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateTransactionRequest, TransactionResponse};
use crate::routes::api::AppState;
use crate::services::TransactionService;

#[derive(Deserialize)]
pub struct ListTransactionsQuery {
    pub limit: Option<i64>,
}

pub async fn get_transaction(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<TransactionResponse>, AppError> {
    let transaction = TransactionService::get_transaction(&state.pool, id).await?;
    Ok(Json(transaction.into()))
}

pub async fn create_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateTransactionRequest>,
) -> Result<(StatusCode, Json<TransactionResponse>), AppError> {
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    let transaction =
        TransactionService::create_transaction(&state.pool, request, &idempotency_key).await?;
    Ok((StatusCode::CREATED, Json(transaction.into())))
}

pub async fn list_account_transactions(
    State(state): State<AppState>,
    Path(account_id): Path<Uuid>,
    Query(query): Query<ListTransactionsQuery>,
) -> Result<Json<Vec<TransactionResponse>>, AppError> {
    let transactions = TransactionService::get_account_transactions(
        &state.pool,
        account_id,
        query.limit,
    ).await?;

    Ok(Json(transactions.into_iter().map(Into::into).collect()))
}
