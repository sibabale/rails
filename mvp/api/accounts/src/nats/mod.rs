use crate::models::{AccountType, CreateAccountRequest};
use crate::services::AccountService;
use futures::StreamExt;
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use std::time::Duration;
use tracing::{error, info};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct UserCreatedEvent {
    pub event_id: Option<String>,
    pub organization_id: String,
    pub environment: String,
    pub user_id: String,
}

pub async fn run(pool: PgPool, nats_url: String, stream: String) -> anyhow::Result<()> {
    let client = async_nats::connect(nats_url).await?;
    let js = async_nats::jetstream::new(client);

    ensure_stream(&js, &stream).await?;

    let consumer_name = "accounts_user_created";
    let consumer_cfg = async_nats::jetstream::consumer::push::Config {
        durable_name: Some(consumer_name.to_string()),
        deliver_subject: "accounts.user_created.deliver".to_string(),
        ack_policy: async_nats::jetstream::consumer::AckPolicy::Explicit,
        filter_subject: "users.user.created.*.*".to_string(),
        ack_wait: Duration::from_secs(30),
        max_deliver: 10,
        ..Default::default()
    };

    let consumer = js.create_consumer_on_stream(consumer_cfg, &stream).await?;

    info!(
        "Accounts NATS consumer started (stream={}, durable={})",
        stream, consumer_name
    );

    let mut messages = consumer.messages().await?;
    while let Some(message) = messages.next().await {
        let message = message?;
        if let Err(e) = handle_user_created(&pool, &js, message).await {
            error!("Failed to process user.created message: {}", e);
        }
    }

    Ok(())
}

async fn ensure_stream(js: &async_nats::jetstream::Context, stream: &str) -> anyhow::Result<()> {
    let cfg = async_nats::jetstream::stream::Config {
        name: stream.to_string(),
        subjects: vec![
            "users.user.created.*.*".to_string(),
            "accounts.account.created.*.*".to_string(),
        ],
        max_age: Duration::from_secs(7 * 24 * 60 * 60),
        storage: async_nats::jetstream::stream::StorageType::File,
        ..Default::default()
    };

    match js.get_stream(stream).await {
        Ok(_) => Ok(()),
        Err(_) => {
            js.create_stream(cfg).await?;
            Ok(())
        }
    }
}

async fn handle_user_created(
    pool: &PgPool,
    js: &async_nats::jetstream::Context,
    message: async_nats::jetstream::Message,
) -> anyhow::Result<()> {
    let payload: UserCreatedEvent = serde_json::from_slice(&message.payload)?;

    let org_id = Uuid::parse_str(&payload.organization_id)?;
    let user_id = Uuid::parse_str(&payload.user_id)?;

    let env = payload.environment.to_lowercase();
    let env = match env.as_str() {
        "sandbox" => "sandbox",
        "production" => "production",
        other => anyhow::bail!("invalid environment: {}", other),
    };

    let req = CreateAccountRequest {
        account_type: AccountType::Checking,
        organization_id: Some(org_id),
        environment: Some(env.to_string()),
        user_id,
        currency: "USD".to_string(),
    };

    let account = AccountService::create_account(pool, req).await?;

    let subject = format!("accounts.account.created.{}.{}", env, org_id);
    let out = json!({
        "event_type": "account.created",
        "organization_id": org_id.to_string(),
        "environment": env,
        "user_id": user_id.to_string(),
        "account_id": account.id.to_string(),
        "account_number": account.account_number,
        "currency": account.currency,
        "created_at": account.created_at,
    });

    js.publish(subject, out.to_string().into()).await?;

    info!(
        "Published account.created for org={} env={} user={} account={}",
        org_id, env, user_id, account.id
    );

    message
        .ack()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to ack message: {}", e))?;
    Ok(())
}
