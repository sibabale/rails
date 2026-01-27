use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use crate::errors::AppError;
use crate::models::{AccountResponse, CreateAccountRequest, UpdateAccountRequest, PaginatedAccountsResponse};
use crate::routes::api::AppState;
use crate::services::AccountService;

/// Extract and validate environment from X-Environment header
/// Defaults to "sandbox" if missing or invalid (safety: never defaults to production)
pub(crate) fn extract_environment(headers: &HeaderMap) -> String {
    let env = headers
        .get("x-environment")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.trim().to_lowercase())
        .filter(|s: &String| s == "sandbox" || s == "production")
        .unwrap_or_else(|| {
            tracing::warn!("Missing or invalid X-Environment header, defaulting to sandbox");
            "sandbox".to_string()
        });
    
    env
}

#[derive(Deserialize)]
pub struct ListAccountsQuery {
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
    pub admin_user_id: Option<Uuid>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

pub async fn create_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateAccountRequest>,
) -> Result<(StatusCode, Json<AccountResponse>), AppError> {
    // Extract environment from header (defaults to sandbox if missing)
    let environment = extract_environment(&headers);
    
    // Override request environment with header value (header takes precedence)
    let mut request = request;
    request.environment = Some(environment);
    
    // Account number is auto-generated, no validation needed
    let account = AccountService::create_account(&state.pool, request).await?;
    Ok((StatusCode::CREATED, Json(account.into())))
}

pub async fn get_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountResponse>, AppError> {
    let environment = extract_environment(&headers);
    let account = AccountService::get_account(&state.pool, id, &environment).await?;
    Ok(Json(account.into()))
}

pub async fn list_accounts(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<ListAccountsQuery>,
) -> Result<Json<PaginatedAccountsResponse>, AppError> {
    // Extract environment from header (defaults to sandbox if missing)
    let environment = extract_environment(&headers);
    
    // Parse and validate pagination params with defaults
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).min(100).max(1);

    // Support three filtering options:
    // 1. user_id: Get accounts owned by a specific user
    // 2. organization_id: Get all accounts in an organization (for admins)
    // 3. admin_user_id: Get accounts managed by an admin (customer accounts)
    let result = if let Some(user_id) = query.user_id {
        AccountService::get_accounts_by_user_paginated(&state.pool, user_id, &environment, page, per_page).await?
    } else if let Some(organization_id) = query.organization_id {
        AccountService::get_accounts_by_organization_paginated(&state.pool, organization_id, &environment, page, per_page).await?
    } else if let Some(admin_user_id) = query.admin_user_id {
        AccountService::get_accounts_by_admin_paginated(&state.pool, admin_user_id, &environment, page, per_page).await?
    } else {
        return Err(AppError::Validation(
            "One of user_id, organization_id, or admin_user_id query parameter is required".to_string()
        ));
    };

    Ok(Json(result))
}

pub async fn update_account_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateAccountRequest>,
) -> Result<Json<AccountResponse>, AppError> {
    let environment = extract_environment(&headers);
    
    let status = request.status.ok_or_else(|| {
        AppError::Validation("status field is required".to_string())
    })?;

    let account = AccountService::update_account_status(&state.pool, id, &environment, status).await?;
    Ok(Json(account.into()))
}

pub async fn close_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountResponse>, AppError> {
    let environment = extract_environment(&headers);
    let account = AccountService::close_account(&state.pool, id, &environment).await?;
    Ok(Json(account.into()))
}

pub async fn deposit(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(request): Json<crate::handlers::accounts::DepositRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let environment = extract_environment(&headers);
    
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.trim().to_string())
        .filter(|s: &String| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    if request.amount <= 0 {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let correlation_id = headers
        .get("x-correlation-id")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.trim().to_string())
        .filter(|s: &String| !s.is_empty());

    let (account, transaction) = AccountService::deposit_with_idempotency(
        &state.pool,
        id,
        &environment,
        request.amount,
        &idempotency_key,
        &state.ledger_grpc,
        correlation_id,
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "account": AccountResponse::from(account),
            "transaction": crate::models::TransactionResponse::from(transaction)
        })),
    ))
}

pub async fn withdraw(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(request): Json<crate::handlers::accounts::WithdrawRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let environment = extract_environment(&headers);
    
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.trim().to_string())
        .filter(|s: &String| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    if request.amount <= 0 {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let correlation_id = headers
        .get("x-correlation-id")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.trim().to_string())
        .filter(|s: &String| !s.is_empty());

    let (account, transaction) = AccountService::withdraw_with_idempotency(
        &state.pool,
        id,
        &environment,
        request.amount,
        &idempotency_key,
        &state.ledger_grpc,
        correlation_id,
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "account": AccountResponse::from(account),
            "transaction": crate::models::TransactionResponse::from(transaction)
        })),
    ))
}

pub async fn transfer(
    State(state): State<AppState>,
    Path(from_id): Path<Uuid>,
    headers: HeaderMap,
    Json(request): Json<crate::handlers::accounts::TransferRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let environment = extract_environment(&headers);
    
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.trim().to_string())
        .filter(|s: &String| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    if request.amount <= 0 {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let correlation_id = headers
        .get("x-correlation-id")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.trim().to_string())
        .filter(|s: &String| !s.is_empty());

    let (from_account, to_account, transaction) = AccountService::transfer_with_idempotency(
        &state.pool,
        from_id,
        &environment,
        request.to_account_id,
        request.amount,
        &idempotency_key,
        &state.ledger_grpc,
        correlation_id,
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "from_account": AccountResponse::from(from_account),
            "to_account": AccountResponse::from(to_account),
            "transaction": crate::models::TransactionResponse::from(transaction)
        })),
    ))
}

#[derive(Deserialize)]
pub struct DepositRequest {
    pub amount: i64,
    #[allow(dead_code)]
    pub description: Option<String>, // Reserved for future use
}

#[derive(Deserialize)]
pub struct WithdrawRequest {
    pub amount: i64,
    #[allow(dead_code)]
    pub description: Option<String>, // Reserved for future use
}

#[derive(Deserialize)]
pub struct TransferRequest {
    pub to_account_id: Uuid,
    pub amount: i64,
    #[allow(dead_code)]
    pub description: Option<String>, // Reserved for future use
}
