use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Business {
    pub id: Uuid,
    pub name: String,
    pub website: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Environment {
    pub id: Uuid,
    pub business_id: Uuid,
    pub r#type: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiKey {
    pub id: Uuid,
    pub environment_id: Uuid,
    pub key: String,
    pub status: String,
    pub last_used_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: Uuid,
    pub business_id: Uuid,
    pub environment_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub environment_id: Uuid,
    pub refresh_token: String,
    pub jwt_id: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub expires_at: DateTime<Utc>,
}
