use axum::{Json, extract::State};
use uuid::Uuid;
use crate::{error::AppError};
use crate::routes::AppState;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateEnvironmentRequest {
    pub business_id: Uuid,
    pub r#type: String
}

#[derive(Serialize)]
pub struct CreateEnvironmentResponse {
    pub id: Uuid,
    pub r#type: String
}

pub async fn create_environment(
    State(_state): State<AppState>,
    Json(_payload): Json<CreateEnvironmentRequest>
) -> Result<Json<CreateEnvironmentResponse>, AppError> {
    // TODO: Implement environment creation logic
    Err(AppError::Internal)
}
