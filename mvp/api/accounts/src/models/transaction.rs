use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: Uuid,
    #[serde(rename = "organization_id")]
    pub organization_id: Uuid,
    #[serde(rename = "from_account_id")]
    pub from_account_id: Uuid,
    #[serde(rename = "to_account_id")]
    pub to_account_id: Uuid,
    pub amount: i64,
    pub currency: String,
    #[serde(rename = "transaction_kind")]
    pub transaction_kind: TransactionKind,
    pub status: TransactionStatus,
    #[serde(rename = "failure_reason")]
    pub failure_reason: Option<String>,
    #[serde(rename = "idempotency_key")]
    pub idempotency_key: String,
    pub environment: Option<String>,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum TransactionKind {
    Deposit,
    Withdraw,
    Transfer,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum TransactionStatus {
    Pending,
    Posted,
    Failed,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    #[serde(rename = "from_account_id")]
    pub from_account_id: Uuid,
    #[serde(rename = "to_account_id")]
    pub to_account_id: Uuid,
    pub amount: i64,
    pub currency: String,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    #[serde(rename = "organization_id")]
    pub organization_id: Uuid,
    #[serde(rename = "from_account_id")]
    pub from_account_id: Uuid,
    #[serde(rename = "to_account_id")]
    pub to_account_id: Uuid,
    pub amount: i64,
    pub currency: String,
    #[serde(rename = "transaction_kind")]
    pub transaction_kind: TransactionKind,
    pub status: TransactionStatus,
    #[serde(rename = "failure_reason")]
    pub failure_reason: Option<String>,
    #[serde(rename = "idempotency_key")]
    pub idempotency_key: String,
    pub environment: Option<String>,
    #[serde(rename = "created_at")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updated_at")]
    pub updated_at: DateTime<Utc>,
}

impl From<Transaction> for TransactionResponse {
    fn from(transaction: Transaction) -> Self {
        Self {
            id: transaction.id,
            organization_id: transaction.organization_id,
            from_account_id: transaction.from_account_id,
            to_account_id: transaction.to_account_id,
            amount: transaction.amount,
            currency: transaction.currency,
            transaction_kind: transaction.transaction_kind,
            status: transaction.status,
            failure_reason: transaction.failure_reason,
            idempotency_key: transaction.idempotency_key,
            environment: transaction.environment,
            created_at: transaction.created_at,
            updated_at: transaction.updated_at,
        }
    }
}
