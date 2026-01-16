use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FixedSavingsPlan {
    pub id: Uuid,
    #[serde(rename = "account_id")]
    pub account_id: Uuid,
    #[serde(rename = "plan_type")]
    pub plan_type: FixedSavingsPlanType,
    #[serde(rename = "initial_amount")]
    pub initial_amount: Decimal,
    #[serde(rename = "current_balance")]
    pub current_balance: Decimal,
    pub currency: String,
    #[serde(rename = "monthly_withdraw_amount")]
    pub monthly_withdraw_amount: Option<Decimal>,
    #[serde(rename = "next_withdraw_date")]
    pub next_withdraw_date: Option<NaiveDate>,
    #[serde(rename = "unlock_date")]
    pub unlock_date: Option<NaiveDate>,
    pub status: FixedSavingsPlanStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "snake_case")]
pub enum FixedSavingsPlanType {
    AutoWithdraw,
    DateLocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum FixedSavingsPlanStatus {
    Active,
    Completed,
    Cancelled,
}

#[derive(Debug, Deserialize)]
pub struct CreateFixedSavingsPlanRequest {
    pub account_id: Uuid,
    #[serde(rename = "plan_type")]
    pub plan_type: FixedSavingsPlanType,
    #[serde(rename = "initial_amount")]
    pub initial_amount: Decimal,
    #[serde(default = "default_currency")]
    pub currency: String,
    #[serde(rename = "monthly_withdraw_amount")]
    pub monthly_withdraw_amount: Option<Decimal>,
    #[serde(rename = "unlock_date")]
    pub unlock_date: Option<NaiveDate>,
}

fn default_currency() -> String {
    "USD".to_string()
}

#[derive(Debug, Serialize)]
pub struct FixedSavingsPlanResponse {
    pub id: Uuid,
    #[serde(rename = "account_id")]
    pub account_id: Uuid,
    #[serde(rename = "plan_type")]
    pub plan_type: FixedSavingsPlanType,
    #[serde(rename = "initial_amount")]
    pub initial_amount: Decimal,
    #[serde(rename = "current_balance")]
    pub current_balance: Decimal,
    pub currency: String,
    #[serde(rename = "monthly_withdraw_amount")]
    pub monthly_withdraw_amount: Option<Decimal>,
    #[serde(rename = "next_withdraw_date")]
    pub next_withdraw_date: Option<NaiveDate>,
    #[serde(rename = "unlock_date")]
    pub unlock_date: Option<NaiveDate>,
    pub status: FixedSavingsPlanStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

impl From<FixedSavingsPlan> for FixedSavingsPlanResponse {
    fn from(plan: FixedSavingsPlan) -> Self {
        Self {
            id: plan.id,
            account_id: plan.account_id,
            plan_type: plan.plan_type,
            initial_amount: plan.initial_amount,
            current_balance: plan.current_balance,
            currency: plan.currency,
            monthly_withdraw_amount: plan.monthly_withdraw_amount,
            next_withdraw_date: plan.next_withdraw_date,
            unlock_date: plan.unlock_date,
            status: plan.status,
            created_at: plan.created_at,
            updated_at: plan.updated_at,
        }
    }
}
