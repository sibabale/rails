use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Business logic error: {0}")]
    BusinessLogic(String),

    #[error("Insufficient funds")]
    InsufficientFunds,

    #[error("Account is not active")]
    AccountNotActive,

    #[error("Invalid account type")]
    InvalidAccountType,

    #[error("Invalid transaction type")]
    InvalidTransactionType,

    #[error("Not implemented: {0}")]
    NotImplemented(String),

    #[error("Internal server error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(ref e) => {
                tracing::error!("Database error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
            }
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::Validation(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::BusinessLogic(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::InsufficientFunds => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::AccountNotActive => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::InvalidAccountType => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::InvalidTransactionType => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::NotImplemented(_) => (StatusCode::NOT_IMPLEMENTED, self.to_string()),
            AppError::Internal(ref e) => {
                tracing::error!("Internal error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
            }
        };

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16()
        }));

        (status, body).into_response()
    }
}
