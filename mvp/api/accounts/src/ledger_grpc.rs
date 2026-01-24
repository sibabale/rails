use std::time::Duration;

use crate::errors::AppError;
use crate::grpc::ledger_proto::{
    ledger_service_client::LedgerServiceClient, Environment, PostTransactionRequest,
};
use tonic::transport::Endpoint;

#[derive(Clone)]
pub struct LedgerGrpc {
    endpoint: String,
    timeout: Duration,
}

impl LedgerGrpc {
    pub fn new(endpoint: String) -> Self {
        Self {
            endpoint,
            timeout: Duration::from_secs(2),
        }
    }

    fn env_to_proto(environment: &str) -> Result<i32, AppError> {
        match environment {
            "sandbox" => Ok(Environment::Sandbox as i32),
            "production" => Ok(Environment::Production as i32),
            other => Err(AppError::Validation(format!(
                "invalid environment for ledger gRPC: {}",
                other
            ))),
        }
    }

    pub async fn post_transaction(
        &self,
        organization_id: uuid::Uuid,
        environment: &str,
        source_external_account_id: String,
        destination_external_account_id: String,
        amount: i64,
        currency: String,
        external_transaction_id: uuid::Uuid,
        idempotency_key: String,
        correlation_id: String,
    ) -> Result<(), AppError> {
        let env = Self::env_to_proto(environment)?;

        let channel = Endpoint::from_shared(self.endpoint.clone())
            .map_err(|e| AppError::Internal(format!("invalid LEDGER_GRPC_URL: {}", e)))?
            .connect_timeout(self.timeout)
            .timeout(self.timeout)
            .connect()
            .await
            .map_err(|e| AppError::Internal(format!("ledger gRPC connect failed: {}", e)))?;

        let mut client = LedgerServiceClient::new(channel);

        let req = PostTransactionRequest {
            organization_id: organization_id.to_string(),
            environment: env,
            source_external_account_id,
            destination_external_account_id,
            amount,
            currency,
            external_transaction_id: external_transaction_id.to_string(),
            idempotency_key,
            correlation_id,
        };

        let resp = client
            .post_transaction(req)
            .await
            .map_err(|e| AppError::Internal(format!("ledger gRPC post failed: {}", e)))?
            .into_inner();

        if resp.status == "posted" {
            Ok(())
        } else {
            Err(AppError::BusinessLogic(format!(
                "ledger post failed: {}",
                resp.failure_reason
            )))
        }
    }
}

