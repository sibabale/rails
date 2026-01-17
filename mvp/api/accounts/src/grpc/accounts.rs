use crate::errors::AppError;
use crate::models::{AccountType, CreateAccountRequest};
use crate::services::AccountService;
use sqlx::PgPool;
use std::str::FromStr;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use super::proto::{
    accounts_service_server::AccountsService,
    AccountType as ProtoAccountType,
    CreateDefaultAccountRequest,
    CreateDefaultAccountResponse,
    Environment as ProtoEnvironment,
    GetAccountBalanceRequest,
    GetAccountBalanceResponse,
};

#[derive(Clone)]
pub struct AccountsGrpcService {
    pool: PgPool,
}

impl AccountsGrpcService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[tonic::async_trait]
impl AccountsService for AccountsGrpcService {
    async fn create_default_account(
        &self,
        request: Request<CreateDefaultAccountRequest>,
    ) -> Result<Response<CreateDefaultAccountResponse>, Status> {
        let req = request.into_inner();

        let user_id = Uuid::from_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("user_id must be a UUID"))?;

        let org_id = Uuid::from_str(&req.organization_id)
            .map_err(|_| Status::invalid_argument("organization_id must be a UUID"))?;

        let environment = match ProtoEnvironment::try_from(req.environment) {
            Ok(ProtoEnvironment::Sandbox) => "sandbox",
            Ok(ProtoEnvironment::Production) => "production",
            _ => return Err(Status::invalid_argument("environment is required")),
        };

        let account_type = match ProtoAccountType::try_from(req.account_type) {
            Ok(ProtoAccountType::Checking) => AccountType::Checking,
            Ok(ProtoAccountType::Saving) => AccountType::Saving,
            _ => AccountType::Checking,
        };

        let currency = if req.currency.is_empty() { "USD" } else { req.currency.as_str() };

        let create_req = CreateAccountRequest {
            account_type,
            user_id,
            currency: currency.to_string(),
            organization_id: Some(org_id),
            environment: Some(environment.to_string()),
        };

        let account = AccountService::create_account(&self.pool, create_req)
            .await
            .map_err(map_app_error)?;

        Ok(Response::new(CreateDefaultAccountResponse {
            account_id: account.id.to_string(),
            account_number: account.account_number,
        }))
    }

    async fn get_account_balance(
        &self,
        request: Request<GetAccountBalanceRequest>,
    ) -> Result<Response<GetAccountBalanceResponse>, Status> {
        let req = request.into_inner();
        let account_id = Uuid::from_str(&req.account_id)
            .map_err(|_| Status::invalid_argument("account_id must be a UUID"))?;

        let account = AccountService::get_account(&self.pool, account_id)
            .await
            .map_err(map_app_error)?;

        Ok(Response::new(GetAccountBalanceResponse {
            account_id: account.id.to_string(),
            balance: account.balance.clone().unwrap_or_default(),
            currency: account.currency.clone().unwrap_or_else(|| "USD".to_string()),
        }))
    }
}

fn map_app_error(err: AppError) -> Status {
    match err {
        AppError::NotFound(msg) => Status::not_found(msg),
        AppError::Validation(msg) => Status::invalid_argument(msg),
        AppError::BusinessLogic(msg) => Status::failed_precondition(msg),
        other => Status::internal(other.to_string()),
    }
}
