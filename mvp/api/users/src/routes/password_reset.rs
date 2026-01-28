//! Password reset endpoints
//! Secure, single-use, time-limited password reset flow

use axum::{Json, extract::State};
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{rand_core::{OsRng, RngCore}, SaltString};
use chrono::{Utc, Duration};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use sha2::{Sha256, Digest};
use base64::engine::general_purpose::STANDARD as BASE64_ENGINE;
use base64::Engine;

use crate::{error::AppError, routes::AppState};

#[derive(Deserialize)]
pub struct RequestPasswordResetRequest {
    pub email: String,
}

#[derive(Serialize)]
pub struct RequestPasswordResetResponse {
    pub message: String,
}

#[derive(Deserialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub new_password: String,
}

#[derive(Serialize)]
pub struct ResetPasswordResponse {
    pub message: String,
}

/// Request password reset
/// Always returns success to prevent user enumeration
/// If user exists, generates token and sends email
pub async fn request_password_reset(
    State(state): State<AppState>,
    Json(payload): Json<RequestPasswordResetRequest>
) -> Result<Json<RequestPasswordResetResponse>, AppError> {
    // Always return success to prevent user enumeration
    // This is a security best practice
    
    // Find user by email (only active users)
    let user_row = sqlx::query(
        "SELECT id FROM users WHERE email = $1 AND status = 'active' LIMIT 1"
    )
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::Internal)?;

    // If user doesn't exist, still return success (no enumeration)
    let user_id: Uuid = match user_row {
        Some(row) => row.get("id"),
        None => {
            tracing::info!("Password reset requested for non-existent email: {}", payload.email);
            return Ok(Json(RequestPasswordResetResponse {
                message: "If an account exists with that email, a password reset link has been sent.".to_string(),
            }));
        }
    };

    // Generate secure random token (32 bytes = 256 bits)
    let mut token_bytes = [0u8; 32];
    OsRng.fill_bytes(&mut token_bytes);
    let raw_token = BASE64_ENGINE.encode(token_bytes);

    // Hash token before storing (never store raw tokens)
    let mut hasher = Sha256::new();
    hasher.update(raw_token.as_bytes());
    let token_hash = format!("{:x}", hasher.finalize());

    // Set expiry to 1 hour from now
    let expires_at = Utc::now() + Duration::hours(1);
    let token_id = Uuid::new_v4();

    // Invalidate all previous reset tokens for this user
    // This ensures only the latest token is usable
    sqlx::query(
        "UPDATE password_reset_tokens SET used_at = $1 WHERE user_id = $2 AND used_at IS NULL"
    )
    .bind(&Utc::now())
    .bind(&user_id)
    .execute(&state.db)
    .await
    .map_err(|_| AppError::Internal)?;

    // Store new token (hashed)
    sqlx::query(
        "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(&token_id)
    .bind(&user_id)
    .bind(&token_hash)
    .bind(&expires_at)
    .bind(&Utc::now())
    .execute(&state.db)
    .await
    .map_err(|_| AppError::Internal)?;

    // Send email (best-effort, don't fail if email fails)
    if let Some(email_service) = &state.email {
        match email_service.send_password_reset(&payload.email, &raw_token).await {
            Ok(_) => {
                tracing::info!("Password reset email sent successfully to {}", payload.email);
            }
            Err(e) => {
                // Log error but don't fail the request
                // User enumeration protection: still return success
                tracing::error!("Failed to send password reset email: {}", e);
            }
        }
    } else {
        tracing::warn!("Email service not configured, password reset email not sent");
    }

    Ok(Json(RequestPasswordResetResponse {
        message: "If an account exists with that email, a password reset link has been sent.".to_string(),
    }))
}

/// Reset password using token
/// Validates token, updates password, marks token as used
pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>
) -> Result<Json<ResetPasswordResponse>, AppError> {
    // Hash the incoming token to compare with stored hash
    let mut hasher = Sha256::new();
    hasher.update(payload.token.as_bytes());
    let token_hash = format!("{:x}", hasher.finalize());

    // Find token by hash
    let token_row = sqlx::query(
        "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1"
    )
    .bind(&token_hash)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::Internal)?;

    let (token_id, user_id, expires_at, used_at): (Uuid, Uuid, chrono::DateTime<Utc>, Option<chrono::DateTime<Utc>>) = match token_row {
        Some(row) => (
            row.get("id"),
            row.get("user_id"),
            row.get("expires_at"),
            row.get("used_at"),
        ),
        None => {
            // Generic error - don't reveal if token doesn't exist
            return Err(AppError::BadRequest("Invalid or expired reset token".to_string()));
        }
    };

    // Validate token is not expired
    if expires_at < Utc::now() {
        return Err(AppError::BadRequest("Invalid or expired reset token".to_string()));
    }

    // Validate token is not already used
    if used_at.is_some() {
        return Err(AppError::BadRequest("Invalid or expired reset token".to_string()));
    }

    // Validate password strength (minimum 8 characters)
    if payload.new_password.len() < 8 {
        return Err(AppError::BadRequest("Password must be at least 8 characters long".to_string()));
    }

    // Hash new password
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(payload.new_password.as_bytes(), &salt)
        .map_err(|_| AppError::Internal)?
        .to_string();

    // Update password and mark token as used in a transaction
    let mut tx = state.db.begin().await.map_err(|_| AppError::Internal)?;

    // Update user password
    sqlx::query(
        "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3"
    )
    .bind(&password_hash)
    .bind(&Utc::now())
    .bind(&user_id)
    .execute(&mut *tx)
    .await
    .map_err(|_| AppError::Internal)?;

    // Mark token as used
    sqlx::query(
        "UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2"
    )
    .bind(&Utc::now())
    .bind(&token_id)
    .execute(&mut *tx)
    .await
    .map_err(|_| AppError::Internal)?;

    // Invalidate all other reset tokens for this user (security: single-use)
    sqlx::query(
        "UPDATE password_reset_tokens SET used_at = $1 WHERE user_id = $2 AND id != $3 AND used_at IS NULL"
    )
    .bind(&Utc::now())
    .bind(&user_id)
    .bind(&token_id)
    .execute(&mut *tx)
    .await
    .map_err(|_| AppError::Internal)?;

    tx.commit().await.map_err(|_| AppError::Internal)?;

    tracing::info!("Password reset successful for user {}", user_id);

    Ok(Json(ResetPasswordResponse {
        message: "Password has been reset successfully. You can now log in with your new password.".to_string(),
    }))
}
