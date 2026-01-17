use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Account {
    pub id: Uuid,
    #[serde(rename = "account_number")]
    pub account_number: String,
    #[serde(rename = "account_type")]
    pub account_type: AccountType,
    #[serde(rename = "organization_id")]
    pub organization_id: Option<Uuid>,
    pub environment: String,
    #[serde(rename = "user_id")]
    pub user_id: Uuid,
    #[serde(rename = "admin_user_id")]
    pub admin_user_id: Option<Uuid>,
    pub user_role: Option<String>,
    pub balance: Decimal,
    pub currency: String,
    pub status: AccountStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum AccountType {
    Checking,
    Saving,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum AccountStatus {
    Active,
    Suspended,
    Closed,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccountRequest {
    // account_number is auto-generated, not provided by user
    pub account_type: AccountType,
    #[serde(default)]
    pub organization_id: Option<Uuid>,
    #[serde(default = "default_environment")]
    pub environment: Option<String>,
    pub user_id: Uuid,
    #[serde(default = "default_currency")]
    pub currency: String,
}

fn default_currency() -> String {
    "USD".to_string()
}

fn default_environment() -> Option<String> {
    Some("production".to_string())
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountRequest {
    pub status: Option<AccountStatus>,
}

#[derive(Debug, Serialize)]
pub struct AccountResponse {
    pub id: Uuid,
    #[serde(rename = "account_number")]
    pub account_number: String,
    #[serde(rename = "account_type")]
    pub account_type: AccountType,
    #[serde(rename = "organization_id")]
    pub organization_id: Option<Uuid>,
    pub environment: String,
    #[serde(rename = "user_id")]
    pub user_id: Uuid,
    #[serde(rename = "admin_user_id")]
    pub admin_user_id: Option<Uuid>,
    pub user_role: Option<String>,
    pub balance: Decimal,
    pub currency: String,
    pub status: AccountStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

impl From<Account> for AccountResponse {
    fn from(account: Account) -> Self {
        Self {
            id: account.id,
            account_number: account.account_number,
            account_type: account.account_type,
            organization_id: account.organization_id,
            environment: account.environment,
            user_id: account.user_id,
            admin_user_id: account.admin_user_id,
            user_role: account.user_role,
            balance: account.balance,
            currency: account.currency,
            status: account.status,
            created_at: account.created_at,
            updated_at: account.updated_at,
        }
    }
}
