use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateTransactionRequest, TransactionResponse, PaginatedTransactionsResponse};
use crate::routes::api::AppState;
use crate::services::TransactionService;

/// Extract and validate environment from X-Environment header
/// Defaults to "sandbox" if missing or invalid (safety: never defaults to production)
fn extract_environment(headers: &HeaderMap) -> String {
    let env = headers
        .get("x-environment")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_lowercase())
        .filter(|s| s == "sandbox" || s == "production")
        .unwrap_or_else(|| {
            tracing::warn!("Missing or invalid X-Environment header, defaulting to sandbox");
            "sandbox".to_string()
        });
    
    env
}

#[derive(Deserialize)]
pub struct ListTransactionsQuery {
    pub limit: Option<i64>,
    pub organization_id: Option<Uuid>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

pub async fn get_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<TransactionResponse>, AppError> {
    let environment = extract_environment(&headers);
    let transaction = TransactionService::get_transaction(&state.pool, id, &environment).await?;
    Ok(Json(transaction.into()))
}

pub async fn create_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateTransactionRequest>,
) -> Result<(StatusCode, Json<TransactionResponse>), AppError> {
    let environment = extract_environment(&headers);
    
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    let transaction =
        TransactionService::create_transaction(&state.pool, request, &environment, &idempotency_key).await?;
    Ok((StatusCode::CREATED, Json(transaction.into())))
}

pub async fn list_account_transactions(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(account_id): Path<Uuid>,
    Query(query): Query<ListTransactionsQuery>,
) -> Result<Json<Vec<TransactionResponse>>, AppError> {
    let environment = extract_environment(&headers);
    
    let transactions = TransactionService::get_account_transactions(
        &state.pool,
        account_id,
        &environment,
        query.limit,
    ).await?;

    Ok(Json(transactions.into_iter().map(Into::into).collect()))
}

pub async fn list_transactions(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<ListTransactionsQuery>,
) -> Result<Json<PaginatedTransactionsResponse>, AppError> {
    let environment = extract_environment(&headers);
    
    let organization_id = query.organization_id.ok_or_else(|| {
        AppError::Validation("organization_id query parameter is required".to_string())
    })?;
    
    // Parse and validate pagination params with defaults
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).min(100).max(1);
    
    let (transactions, pagination) = TransactionService::get_transactions_by_organization_paginated(
        &state.pool,
        organization_id,
        &environment,
        page,
        per_page,
    ).await?;
    
    Ok(Json(PaginatedTransactionsResponse {
        data: transactions.into_iter().map(Into::into).collect(),
        pagination,
    }))
}
