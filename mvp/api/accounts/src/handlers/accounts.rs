use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;
use crate::errors::AppError;
use crate::models::{AccountResponse, CreateAccountRequest, UpdateAccountRequest};
use crate::services::AccountService;

#[derive(Deserialize)]
pub struct ListAccountsQuery {
    pub user_id: Option<Uuid>,
}

pub async fn create_account(
    State(pool): State<PgPool>,
    Json(request): Json<CreateAccountRequest>,
) -> Result<(StatusCode, Json<AccountResponse>), AppError> {
    // Account number is auto-generated, no validation needed
    let account = AccountService::create_account(&pool, request).await?;
    Ok((StatusCode::CREATED, Json(account.into())))
}

pub async fn get_account(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountResponse>, AppError> {
    let account = AccountService::get_account(&pool, id).await?;
    Ok(Json(account.into()))
}

pub async fn list_accounts(
    State(pool): State<PgPool>,
    Query(query): Query<ListAccountsQuery>,
) -> Result<Json<Vec<AccountResponse>>, AppError> {
    let accounts = if let Some(user_id) = query.user_id {
        AccountService::get_accounts_by_user(&pool, user_id).await?
    } else {
        return Err(AppError::Validation("user_id query parameter is required".to_string()));
    };

    Ok(Json(accounts.into_iter().map(Into::into).collect()))
}

pub async fn update_account_status(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateAccountRequest>,
) -> Result<Json<AccountResponse>, AppError> {

    let status = request.status.ok_or_else(|| {
        AppError::Validation("status field is required".to_string())
    })?;

    let account = AccountService::update_account_status(&pool, id, status).await?;
    Ok(Json(account.into()))
}

pub async fn close_account(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountResponse>, AppError> {
    let account = AccountService::close_account(&pool, id).await?;
    Ok(Json(account.into()))
}

pub async fn deposit(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(request): Json<crate::handlers::accounts::DepositRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    if request.amount <= rust_decimal::Decimal::ZERO {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let (account, transaction) = AccountService::deposit(
        &pool,
        id,
        request.amount,
        request.description,
    ).await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "account": AccountResponse::from(account),
            "transaction": crate::models::TransactionResponse::from(transaction)
        })),
    ))
}

pub async fn withdraw(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(request): Json<crate::handlers::accounts::WithdrawRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    if request.amount <= rust_decimal::Decimal::ZERO {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let (account, transaction) = AccountService::withdraw(
        &pool,
        id,
        request.amount,
        request.description,
    ).await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "account": AccountResponse::from(account),
            "transaction": crate::models::TransactionResponse::from(transaction)
        })),
    ))
}

pub async fn transfer(
    State(pool): State<PgPool>,
    Path(from_id): Path<Uuid>,
    Json(request): Json<crate::handlers::accounts::TransferRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    if request.amount <= rust_decimal::Decimal::ZERO {
        return Err(AppError::Validation("Amount must be greater than zero".to_string()));
    }

    let (from_account, to_account, transaction) = AccountService::transfer(
        &pool,
        from_id,
        request.to_account_id,
        request.amount,
        request.description,
    ).await?;

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
    pub amount: rust_decimal::Decimal,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct WithdrawRequest {
    pub amount: rust_decimal::Decimal,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct TransferRequest {
    pub to_account_id: Uuid,
    pub amount: rust_decimal::Decimal,
    pub description: Option<String>,
}
