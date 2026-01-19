use axum::{Json, extract::State};
use uuid::Uuid;
use crate::{error::AppError};
use crate::routes::AppState;
use serde::{Deserialize, Serialize};
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{SaltString, rand_core::OsRng};
use sqlx::Row;

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub environment_id: Uuid,
    pub email: String,
    pub password: String
}

#[derive(Serialize)]
pub struct CreateUserResponse {
    pub user_id: Uuid,
    pub status: String
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>
) -> Result<Json<CreateUserResponse>, AppError> {
    let user_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|_| AppError::Internal)?
        .to_string();

    // Find business_id for the environment
    let rec = sqlx::query("SELECT business_id FROM environments WHERE id = $1")
        .bind(&payload.environment_id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| AppError::BadRequest("Invalid environment_id".to_string()))?;
    let business_id: Uuid = rec.get("business_id");

    sqlx::query(
        "INSERT INTO users (id, business_id, environment_id, email, password_hash, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, 'user', 'active', $6, $6)"
    )
    .bind(&user_id)
    .bind(&business_id)
    .bind(&payload.environment_id)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        if let Some(db_err) = e.as_database_error() {
            if db_err.message().contains("unique_email") {
                return AppError::BadRequest("Email already exists".to_string());
            }
        }
        AppError::Internal
    })?;

    // Publish NATS event
    let event = serde_json::json!({
        "event": "users.user.created",
        "user_id": user_id,
        "business_id": business_id,
        "environment_id": payload.environment_id,
        "email": payload.email,
        "created_at": now,
    });
    let subject = std::env::var("NATS_SUBJECT_USER_CREATED").unwrap_or_else(|_| "users.user.created".to_string());
    let _ = state.nats.publish(subject, serde_json::to_vec(&event).unwrap().into()).await;

    Ok(Json(CreateUserResponse {
        user_id,
        status: "active".to_string(),
    }))
}
