use thiserror::Error;
use axum::{http::StatusCode, response::{IntoResponse, Response}};

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Not found")] 
    NotFound,
    #[error("Unauthorized")] 
    Unauthorized,
    #[error("Forbidden")] 
    Forbidden,
    #[error("Bad request: {0}")]
    BadRequest(String),
    #[error("Internal server error")]
    Internal,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, details) = match &self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "not_found", None),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized", None),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", None),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", Some(msg.clone())),
            AppError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "internal", None),
        };
        let mut body = serde_json::json!({
            "error": self.to_string(),
            "code": code
        });
        if let Some(details) = details {
            body["details"] = serde_json::Value::String(details);
        }
        (status, axum::Json(body)).into_response()
    }
}
