use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateTransactionRequest, TransactionResponse};
use crate::services::TransactionService;

#[derive(Deserialize)]
pub struct ListTransactionsQuery {
    pub limit: Option<i64>,
}

pub async fn get_transaction(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<TransactionResponse>, AppError> {
    let transaction = TransactionService::get_transaction(&pool, id).await?;
    Ok(Json(transaction.into()))
}

pub async fn create_transaction(
    State(pool): State<PgPool>,
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
        TransactionService::create_transaction(&pool, request, &idempotency_key).await?;
    Ok((StatusCode::CREATED, Json(transaction.into())))
}

pub async fn list_account_transactions(
    State(pool): State<PgPool>,
    Path(account_id): Path<Uuid>,
    Query(query): Query<ListTransactionsQuery>,
) -> Result<Json<Vec<TransactionResponse>>, AppError> {
    let transactions = TransactionService::get_account_transactions(
        &pool,
        account_id,
        query.limit,
    ).await?;

    Ok(Json(transactions.into_iter().map(Into::into).collect()))
}
