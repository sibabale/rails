use axum::{Json, extract::{State, Query}};
use uuid::Uuid;
use crate::{error::AppError};
use crate::routes::AppState;
use crate::auth::AuthContext;
use serde::{Deserialize, Serialize};
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{SaltString, rand_core::OsRng};
use sqlx::Row;

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub password: String
}

#[derive(Serialize)]
pub struct CreateUserResponse {
    pub user_id: Uuid,
    pub status: String
}

#[derive(Serialize)]
pub struct MeUser {
    pub id: Uuid,
    pub business_id: Uuid,
    pub environment_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub role: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct MeBusiness {
    pub id: Uuid,
    pub name: String,
    pub website: Option<String>,
    pub status: String,
}

#[derive(Serialize)]
pub struct MeEnvironment {
    pub id: Uuid,
    pub business_id: Uuid,
    pub r#type: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct MeResponse {
    pub user: MeUser,
    pub business: MeBusiness,
    pub environment: MeEnvironment,
}

#[derive(Serialize)]
pub struct ListUser {
    pub id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub role: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

#[derive(Serialize)]
pub struct PaginationMeta {
    pub page: u32,
    pub per_page: u32,
    pub total_count: i64,
    pub total_pages: u32,
}

#[derive(Serialize)]
pub struct ListUsersResponse {
    pub data: Vec<ListUser>,
    pub pagination: PaginationMeta,
}

pub async fn me(
    State(state): State<AppState>,
    ctx: AuthContext,
) -> Result<Json<MeResponse>, AppError> {
    let user_id = ctx.user_id.ok_or(AppError::Forbidden)?;
    let user_row = sqlx::query(
        "SELECT id, business_id, environment_id, first_name, last_name, email, role, status FROM users WHERE id = $1 AND environment_id = $2 AND status = 'active'"
    )
    .bind(&user_id)
    .bind(&ctx.environment_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::Internal)?
    .ok_or(AppError::Forbidden)?;

    let user = MeUser {
        id: user_row.get("id"),
        business_id: user_row.get("business_id"),
        environment_id: user_row.get("environment_id"),
        first_name: user_row.get("first_name"),
        last_name: user_row.get("last_name"),
        email: user_row.get("email"),
        role: user_row.get("role"),
        status: user_row.get("status"),
    };

    let env_row = sqlx::query(
        "SELECT id, business_id, type, status FROM environments WHERE id = $1 AND status = 'active'"
    )
    .bind(&ctx.environment_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::Internal)?
    .ok_or(AppError::BadRequest("Invalid environment_id".to_string()))?;

    let environment = MeEnvironment {
        id: env_row.get("id"),
        business_id: env_row.get("business_id"),
        r#type: env_row.get("type"),
        status: env_row.get("status"),
    };

    let business_row = sqlx::query(
        "SELECT id, name, website, status FROM businesses WHERE id = $1 AND status = 'active'"
    )
    .bind(&user.business_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::Internal)?
    .ok_or(AppError::BadRequest("Invalid business_id".to_string()))?;

    let business = MeBusiness {
        id: business_row.get("id"),
        name: business_row.get("name"),
        website: business_row.get("website"),
        status: business_row.get("status"),
    };

    Ok(Json(MeResponse {
        user,
        business,
        environment,
    }))
}

pub async fn create_user(
    State(state): State<AppState>,
    ctx: AuthContext,
    Json(payload): Json<CreateUserRequest>
) -> Result<Json<CreateUserResponse>, AppError> {
    let user_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|_| AppError::Internal)?
        .to_string();

    let environment_id = ctx.environment_id;
    let business_id = ctx.business_id;

    if ctx.api_key_id.is_none() {
        let request_user_id = ctx.user_id.ok_or(AppError::Forbidden)?;
        let role_row = sqlx::query(
            "SELECT role FROM users WHERE id = $1 AND environment_id = $2 AND status = 'active'"
        )
        .bind(&request_user_id)
        .bind(&environment_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| AppError::Internal)?
        .ok_or(AppError::Forbidden)?;

        let role: String = role_row.get("role");
        if role != "admin" {
            return Err(AppError::Forbidden);
        }
    }

    let created_by_user_id = ctx.user_id;
    let created_by_api_key_id = ctx.api_key_id;

    let env_row = sqlx::query(
        "SELECT type FROM environments WHERE id = $1 AND business_id = $2 AND status = 'active'",
    )
    .bind(&environment_id)
    .bind(&business_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::Internal)?
    .ok_or(AppError::Forbidden)?;

    let environment_type: String = env_row.get("type");

    sqlx::query(
        "INSERT INTO users (id, business_id, environment_id, first_name, last_name, email, password_hash, role, status, created_at, updated_at, created_by_user_id, created_by_api_key_id) VALUES ($1, $2, $3, $4, $5, $6, $7, 'user', 'active', $8, $8, $9, $10)"
    )
    .bind(&user_id)
    .bind(&business_id)
    .bind(&environment_id)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&now)
    .bind(&created_by_user_id)
    .bind(&created_by_api_key_id)
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

    // Create account synchronously via gRPC
    // Customer accounts require admin_user_id - use the admin who created this user
    let admin_user_id = created_by_user_id.ok_or_else(|| {
        tracing::error!("Cannot create account: customer accounts require an admin_user_id, but created_by_user_id is None");
        AppError::BadRequest("Customer accounts require an admin user. User must be created by an admin.".to_string())
    })?;

    match state.grpc.create_default_account(
        business_id,
        &environment_type,
        user_id,
        admin_user_id,
        "USD",
    ).await {
        Ok((account_id, account_number)) => {
            tracing::info!(
                "Created account {} ({}) for user {} via gRPC",
                account_id,
                account_number,
                user_id
            );
        }
        Err(e) => {
            tracing::error!(
                "Failed to create account for user {} via gRPC: {}",
                user_id,
                e
            );
            // Return error with more details - account creation is critical
            // Check if client is initialized
            let error_msg = if state.grpc.accounts_client.is_some() {
                format!("gRPC call failed: {}. Check Accounts service logs.", e)
            } else {
                format!("gRPC client not initialized: {}. Ensure Accounts service is running and ACCOUNTS_GRPC_URL is correct.", e)
            };
            return Err(AppError::BadRequest(error_msg));
        }
    }

    Ok(Json(CreateUserResponse {
        user_id,
        status: "active".to_string(),
    }))
}

pub async fn list_users(
    State(state): State<AppState>,
    ctx: AuthContext,
    Query(query): Query<ListUsersQuery>,
) -> Result<Json<ListUsersResponse>, AppError> {
    let environment_id = ctx.environment_id;
    let business_id = ctx.business_id;

    // Only admins can list users (or API keys which are treated as admin-level)
    if ctx.api_key_id.is_none() {
        let user_id = ctx.user_id.ok_or(AppError::Forbidden)?;
        let role_row = sqlx::query(
            "SELECT role FROM users WHERE id = $1 AND environment_id = $2 AND status = 'active'"
        )
        .bind(&user_id)
        .bind(&environment_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| AppError::Internal)?
        .ok_or(AppError::Forbidden)?;

        let role: String = role_row.get("role");
        if role != "admin" {
            return Err(AppError::Forbidden);
        }
    }

    // Parse and validate pagination params with defaults
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).min(100).max(1);
    let offset = (page - 1) * per_page;

    // Get total count
    let count_row = sqlx::query(
        "SELECT COUNT(*) as count FROM users WHERE business_id = $1 AND environment_id = $2 AND status = 'active'"
    )
    .bind(&business_id)
    .bind(&environment_id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| AppError::Internal)?;

    let total_count: i64 = count_row.get("count");
    let total_pages = ((total_count as f64) / (per_page as f64)).ceil() as u32;

    // Fetch paginated results with deterministic ordering
    let rows = sqlx::query(
        "SELECT id, first_name, last_name, email, role, status, created_at, updated_at FROM users WHERE business_id = $1 AND environment_id = $2 AND status = 'active' ORDER BY created_at DESC, id DESC LIMIT $3 OFFSET $4"
    )
    .bind(&business_id)
    .bind(&environment_id)
    .bind(per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await
    .map_err(|_| AppError::Internal)?;

    let users: Vec<ListUser> = rows
        .into_iter()
        .map(|row| ListUser {
            id: row.get("id"),
            first_name: row.get("first_name"),
            last_name: row.get("last_name"),
            email: row.get("email"),
            role: row.get("role"),
            status: row.get("status"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(Json(ListUsersResponse {
        data: users,
        pagination: PaginationMeta {
            page,
            per_page,
            total_count,
            total_pages,
        },
    }))
}
