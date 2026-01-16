use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RecurringPayment {
    pub id: Uuid,
    #[serde(rename = "account_id")]
    pub account_id: Uuid,
    #[serde(rename = "recipient_account_id")]
    pub recipient_account_id: Option<Uuid>,
    #[serde(rename = "external_recipient_id")]
    pub external_recipient_id: Option<String>,
    #[serde(rename = "recipient_type")]
    pub recipient_type: RecipientType,
    pub amount: Decimal,
    pub currency: String,
    pub frequency: Frequency,
    #[serde(rename = "trigger_condition")]
    pub trigger_condition: Option<serde_json::Value>,
    #[serde(rename = "next_execution_date")]
    pub next_execution_date: NaiveDate,
    #[serde(rename = "last_execution_date")]
    pub last_execution_date: Option<NaiveDate>,
    pub status: RecurringPaymentStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum RecipientType {
    Internal,
    External,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum Frequency {
    Daily,
    Weekly,
    Biweekly,
    Monthly,
    Quarterly,
    Yearly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum RecurringPaymentStatus {
    Active,
    Paused,
    Completed,
    Cancelled,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecurringPaymentRequest {
    pub account_id: Uuid,
    #[serde(rename = "recipient_account_id")]
    pub recipient_account_id: Option<Uuid>,
    #[serde(rename = "external_recipient_id")]
    pub external_recipient_id: Option<String>,
    pub recipient_type: RecipientType,
    pub amount: Decimal,
    #[serde(default = "default_currency")]
    pub currency: String,
    pub frequency: Frequency,
    #[serde(rename = "trigger_condition")]
    pub trigger_condition: Option<serde_json::Value>,
    #[serde(rename = "next_execution_date")]
    pub next_execution_date: NaiveDate,
}

fn default_currency() -> String {
    "USD".to_string()
}

#[derive(Debug, Serialize)]
pub struct RecurringPaymentResponse {
    pub id: Uuid,
    #[serde(rename = "account_id")]
    pub account_id: Uuid,
    #[serde(rename = "recipient_account_id")]
    pub recipient_account_id: Option<Uuid>,
    #[serde(rename = "external_recipient_id")]
    pub external_recipient_id: Option<String>,
    #[serde(rename = "recipient_type")]
    pub recipient_type: RecipientType,
    pub amount: Decimal,
    pub currency: String,
    pub frequency: Frequency,
    #[serde(rename = "trigger_condition")]
    pub trigger_condition: Option<serde_json::Value>,
    #[serde(rename = "next_execution_date")]
    pub next_execution_date: NaiveDate,
    #[serde(rename = "last_execution_date")]
    pub last_execution_date: Option<NaiveDate>,
    pub status: RecurringPaymentStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

impl From<RecurringPayment> for RecurringPaymentResponse {
    fn from(payment: RecurringPayment) -> Self {
        Self {
            id: payment.id,
            account_id: payment.account_id,
            recipient_account_id: payment.recipient_account_id,
            external_recipient_id: payment.external_recipient_id,
            recipient_type: payment.recipient_type,
            amount: payment.amount,
            currency: payment.currency,
            frequency: payment.frequency,
            trigger_condition: payment.trigger_condition,
            next_execution_date: payment.next_execution_date,
            last_execution_date: payment.last_execution_date,
            status: payment.status,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
        }
    }
}
