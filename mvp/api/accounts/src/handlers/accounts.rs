use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use crate::errors::AppError;
use crate::models::{AccountResponse, CreateAccountRequest, UpdateAccountRequest};
use crate::routes::api::AppState;
use crate::services::AccountService;

#[derive(Deserialize)]
pub struct ListAccountsQuery {
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
    pub admin_user_id: Option<Uuid>,
}

pub async fn create_account(
    State(state): State<AppState>,
    Json(request): Json<CreateAccountRequest>,
) -> Result<(StatusCode, Json<AccountResponse>), AppError> {
    // Account number is auto-generated, no validation needed
    let account = AccountService::create_account(&state.pool, request).await?;
    Ok((StatusCode::CREATED, Json(account.into())))
}

pub async fn get_account(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountResponse>, AppError> {
    let account = AccountService::get_account(&state.pool, id).await?;
    Ok(Json(account.into()))
}

pub async fn list_accounts(
    State(state): State<AppState>,
    Query(query): Query<ListAccountsQuery>,
) -> Result<Json<Vec<AccountResponse>>, AppError> {
    // Support three filtering options:
    // 1. user_id: Get accounts owned by a specific user
    // 2. organization_id: Get all accounts in an organization (for admins)
    // 3. admin_user_id: Get accounts managed by an admin (customer accounts)
    let accounts = if let Some(user_id) = query.user_id {
        AccountService::get_accounts_by_user(&state.pool, user_id).await?
    } else if let Some(organization_id) = query.organization_id {
        AccountService::get_accounts_by_organization(&state.pool, organization_id).await?
    } else if let Some(admin_user_id) = query.admin_user_id {
        AccountService::get_accounts_by_admin(&state.pool, admin_user_id).await?
    } else {
        return Err(AppError::Validation(
            "One of user_id, organization_id, or admin_user_id query parameter is required".to_string()
        ));
    };

    Ok(Json(accounts.into_iter().map(Into::into).collect()))
}

pub async fn update_account_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateAccountRequest>,
) -> Result<Json<AccountResponse>, AppError> {

    let status = request.status.ok_or_else(|| {
        AppError::Validation("status field is required".to_string())
    })?;

    let account = AccountService::update_account_status(&state.pool, id, status).await?;
    Ok(Json(account.into()))
}

pub async fn close_account(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountResponse>, AppError> {
    let account = AccountService::close_account(&state.pool, id).await?;
    Ok(Json(account.into()))
}

pub async fn deposit(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(request): Json<crate::handlers::accounts::DepositRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    if request.amount <= 0 {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let correlation_id = headers
        .get("x-correlation-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let (account, transaction) = AccountService::deposit_with_idempotency(
        &state.pool,
        id,
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
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    if request.amount <= 0 {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let correlation_id = headers
        .get("x-correlation-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let (account, transaction) = AccountService::withdraw_with_idempotency(
        &state.pool,
        id,
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
    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::Validation("Idempotency-Key header is required".to_string()))?;

    if request.amount <= 0 {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let correlation_id = headers
        .get("x-correlation-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let (from_account, to_account, transaction) = AccountService::transfer_with_idempotency(
        &state.pool,
        from_id,
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
