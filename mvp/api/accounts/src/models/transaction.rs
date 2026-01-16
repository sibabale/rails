use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: Uuid,
    #[serde(rename = "account_id")]
    pub account_id: Uuid,
    #[serde(rename = "transaction_type")]
    pub transaction_type: TransactionType,
    pub amount: Decimal,
    pub currency: String,
    #[serde(rename = "balance_after")]
    pub balance_after: Decimal,
    #[serde(rename = "recipient_account_id")]
    pub recipient_account_id: Option<Uuid>,
    #[serde(rename = "external_recipient_id")]
    pub external_recipient_id: Option<String>,
    #[serde(rename = "reference_id")]
    pub reference_id: Option<Uuid>,
    pub description: Option<String>,
    pub status: TransactionStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "snake_case")]
pub enum TransactionType {
    Deposit,
    Withdrawal,
    Transfer,
    RecurringPayment,
    SavingsWithdraw,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum TransactionStatus {
    Pending,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub account_id: Uuid,
    pub transaction_type: TransactionType,
    pub amount: Decimal,
    #[serde(default = "default_currency")]
    pub currency: String,
    pub recipient_account_id: Option<Uuid>,
    pub external_recipient_id: Option<String>,
    pub reference_id: Option<Uuid>,
    pub description: Option<String>,
}

fn default_currency() -> String {
    "USD".to_string()
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    #[serde(rename = "account_id")]
    pub account_id: Uuid,
    #[serde(rename = "transaction_type")]
    pub transaction_type: TransactionType,
    pub amount: Decimal,
    pub currency: String,
    #[serde(rename = "balance_after")]
    pub balance_after: Decimal,
    #[serde(rename = "recipient_account_id")]
    pub recipient_account_id: Option<Uuid>,
    #[serde(rename = "external_recipient_id")]
    pub external_recipient_id: Option<String>,
    #[serde(rename = "reference_id")]
    pub reference_id: Option<Uuid>,
    pub description: Option<String>,
    pub status: TransactionStatus,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

impl From<Transaction> for TransactionResponse {
    fn from(transaction: Transaction) -> Self {
        Self {
            id: transaction.id,
            account_id: transaction.account_id,
            transaction_type: transaction.transaction_type,
            amount: transaction.amount,
            currency: transaction.currency,
            balance_after: transaction.balance_after,
            recipient_account_id: transaction.recipient_account_id,
            external_recipient_id: transaction.external_recipient_id,
            reference_id: transaction.reference_id,
            description: transaction.description,
            status: transaction.status,
            created_at: transaction.created_at,
            updated_at: transaction.updated_at,
        }
    }
}
