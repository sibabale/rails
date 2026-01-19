use axum::async_trait;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::routes::AppState;

pub const ENVIRONMENT_ID_HEADER: &str = "X-Environment-Id";

#[derive(Clone, Debug)]
pub struct AuthContext {
    pub user_id: Uuid,
    pub environment_id: Uuid,
}

#[derive(Debug, Deserialize)]
struct JwtClaims {
    sub: String,
    exp: i64,
}

#[async_trait]
impl FromRequestParts<AppState> for AuthContext {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AppError::Unauthorized)?;

        let env_header = parts
            .headers
            .get(ENVIRONMENT_ID_HEADER)
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::BadRequest(format!("Missing {} header", ENVIRONMENT_ID_HEADER)))?;
        let environment_id = Uuid::parse_str(env_header)
            .map_err(|_| AppError::BadRequest(format!("Invalid {} header", ENVIRONMENT_ID_HEADER)))?;

        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev_secret".to_string());
        let decoded = decode::<JwtClaims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| AppError::Unauthorized)?;

        let user_id = Uuid::parse_str(&decoded.claims.sub).map_err(|_| AppError::Unauthorized)?;

        let rec = sqlx::query(
            "SELECT 1 FROM users WHERE id = $1 AND environment_id = $2 AND status = 'active'"
        )
        .bind(&user_id)
        .bind(&environment_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| AppError::Internal)?;

        if rec.is_none() {
            return Err(AppError::Forbidden);
        }

        Ok(Self {
            user_id,
            environment_id,
        })
    }
}
