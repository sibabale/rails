use crate::models::{AccountType, CreateAccountRequest};
use crate::services::AccountService;
use futures::StreamExt;
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use std::time::Duration;
use tracing::{error, info, warn};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct UserCreatedEvent {
    pub event_id: Option<String>,
    pub organization_id: String,
    pub environment: String,
    pub user_id: String,
    pub role: Option<String>,
    pub admin_user_id: Option<String>,
    pub email: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OrganizationalChangeEvent {
    pub user_id: String,
    pub old_admin_id: Option<String>,
    pub new_admin_id: Option<String>,
    pub old_role: Option<String>,
    pub new_role: Option<String>,
    pub organization_id: String,
    pub environment: String,
    pub changed_at: String,
}

pub async fn run(pool: PgPool, nats_url: String, stream: String) -> anyhow::Result<()> {
    let client = async_nats::connect(nats_url).await?;
    let js = async_nats::jetstream::new(client);

    ensure_stream(&js, &stream).await?;

    // Start consumer for user creation events
    let user_created_consumer = start_user_created_consumer(&js, &stream).await?;
    let org_change_consumer = start_organizational_change_consumer(&js, &stream).await?;

    info!("NATS consumers started for stream: {}", stream);

    // Handle user creation events
    let pool_clone = pool.clone();
    let js_clone = js.clone();
    let user_created_task = tokio::spawn(async move {
        handle_user_created_events(pool_clone, js_clone, user_created_consumer).await
    });

    // Handle organizational change events
    let pool_clone = pool.clone();
    let js_clone = js.clone();
    let org_change_task = tokio::spawn(async move {
        handle_organizational_change_events(pool_clone, js_clone, org_change_consumer).await
    });

    let (user_created_res, org_change_res) = tokio::join!(user_created_task, org_change_task);
    user_created_res??;
    org_change_res??;

    Ok(())
}

async fn start_user_created_consumer(
    js: &async_nats::jetstream::Context,
    stream: &str,
) -> anyhow::Result<async_nats::jetstream::consumer::PushConsumer> {
    let consumer_name = "accounts_user_created";
    let consumer_cfg = async_nats::jetstream::consumer::push::Config {
        durable_name: Some(consumer_name.to_string()),
        deliver_subject: "accounts.user_created.deliver".to_string(),
        ack_policy: async_nats::jetstream::consumer::AckPolicy::Explicit,
        filter_subject: "users.user.created.*.*".to_string(),
        ack_wait: Duration::from_secs(30),
        max_deliver: 5,
        ..Default::default()
    };

    let consumer = js.create_consumer_on_stream(consumer_cfg, stream).await?;
    info!("Created consumer: {}", consumer_name);
    Ok(consumer)
}

async fn start_organizational_change_consumer(
    js: &async_nats::jetstream::Context,
    stream: &str,
) -> anyhow::Result<async_nats::jetstream::consumer::PushConsumer> {
    let consumer_name = "accounts_org_changes";
    let consumer_cfg = async_nats::jetstream::consumer::push::Config {
        durable_name: Some(consumer_name.to_string()),
        deliver_subject: "accounts.org_changes.deliver".to_string(),
        ack_policy: async_nats::jetstream::consumer::AckPolicy::Explicit,
        filter_subject: "users.organizational.*.*".to_string(),
        ack_wait: Duration::from_secs(30),
        max_deliver: 5,
        ..Default::default()
    };

    let consumer = js.create_consumer_on_stream(consumer_cfg, stream).await?;
    info!("Created consumer: {}", consumer_name);
    Ok(consumer)
}

async fn handle_user_created_events(
    pool: PgPool,
    js: async_nats::jetstream::Context,
    consumer: async_nats::jetstream::consumer::PushConsumer,
) -> anyhow::Result<()> {
    let mut messages = consumer.messages().await?;
    while let Some(message) = messages.next().await {
        let message = message?;
        if let Err(e) = process_user_created_event(&pool, &js, message).await {
            error!("Failed to process user.created event: {}", e);
        }
    }
    Ok(())
}

async fn handle_organizational_change_events(
    pool: PgPool,
    js: async_nats::jetstream::Context,
    consumer: async_nats::jetstream::consumer::PushConsumer,
) -> anyhow::Result<()> {
    let mut messages = consumer.messages().await?;
    while let Some(message) = messages.next().await {
        let message = message?;
        if let Err(e) = process_organizational_change_event(&pool, &js, message).await {
            error!("Failed to process organizational change event: {}", e);
        }
    }
    Ok(())
}

async fn process_user_created_event(
    _pool: &PgPool,
    js: &async_nats::jetstream::Context,
    message: async_nats::jetstream::Message,
) -> anyhow::Result<()> {
    let subject = message.subject.clone();
    let data = std::str::from_utf8(&message.payload)?;

    info!("Processing user.created event: subject={}", subject);

    // Parse the user created event
    let event: UserCreatedEvent = serde_json::from_str(data)?;

    // Only create accounts for CUSTOMER role users
    // ADMINs and SERVICE users don't automatically get accounts
    let user_role = event.role.as_deref().unwrap_or("CUSTOMER");

    if user_role != "CUSTOMER" {
        info!(
            "Skipping account creation for user {} with role {}",
            event.user_id, user_role
        );
        if let Err(e) = message.ack().await {
            error!("Failed to ack message: {}", e);
        }
        return Ok(());
    }

    let user_id = Uuid::parse_str(&event.user_id)?;
    let organization_id = Some(Uuid::parse_str(&event.organization_id)?);
    let admin_user_id = event
        .admin_user_id
        .as_ref()
        .map(|id| Uuid::parse_str(id))
        .transpose()?;

    // Create default checking account for customer
    let create_request = CreateAccountRequest {
        account_type: AccountType::Checking,
        organization_id,
        environment: Some(event.environment.clone()),
        user_id,
        currency: "USD".to_string(),
    };

    let account_service = AccountService;

    match account_service
        .create_account(&pool, create_request)
        .await
    {
        Ok(account) => {
            info!(
                "Created default account {} for customer {} in organization {}",
                account.account_number, user_id, event.organization_id
            );

            // Publish account.created event
            publish_account_created_event(js, &account, &event).await?;
        }
        Err(e) => {
            error!("Failed to create account for user {}: {}", user_id, e);
            // Don't ack the message, it will be retried
            return Err(anyhow::anyhow!("Failed to create account: {}", e));
        }
    }

    if let Err(e) = message.ack().await {
        error!("Failed to ack message: {}", e);
    }
    Ok(())
}

async fn process_organizational_change_event(
    _pool: &PgPool,
    js: &async_nats::jetstream::Context,
    message: async_nats::jetstream::Message,
) -> anyhow::Result<()> {
    let subject = message.subject.clone();
    let data = std::str::from_utf8(&message.payload)?;

    info!(
        "Processing organizational change event: subject={}",
        subject
    );

    let event: OrganizationalChangeEvent = serde_json::from_str(data)?;
    let user_id = Uuid::parse_str(&event.user_id)?;

    let account_service = AccountService;

    // Handle role changes that affect account permissions
    if event.old_role != event.new_role {
        match (event.old_role.as_deref(), event.new_role.as_deref()) {
            (Some("CUSTOMER"), Some("ADMIN")) => {
                // Customer promoted to admin - update account permissions
                info!("Customer {} promoted to admin", user_id);
                account_service
                    .update_account_permissions_for_admin(user_id)
                    .await?;
            }
            (Some("ADMIN"), Some("CUSTOMER")) => {
                // Admin demoted to customer - restrict permissions and require admin assignment
                info!("Admin {} demoted to customer", user_id);
                let new_admin_id = event
                    .new_admin_id
                    .as_ref()
                    .map(|id| Uuid::parse_str(id))
                    .transpose()?;
                account_service
                    .update_account_permissions_for_customer(user_id, new_admin_id)
                    .await?;
            }
            _ => {
                warn!(
                    "Unhandled role change: {:?} -> {:?}",
                    event.old_role, event.new_role
                );
            }
        }
    }

    // Handle admin reassignment for customers
    if event.old_admin_id != event.new_admin_id && event.new_role.as_deref() == Some("CUSTOMER") {
        let new_admin_id = event
            .new_admin_id
            .as_ref()
            .map(|id| Uuid::parse_str(id))
            .transpose()?;

        info!(
            "Reassigning customer {} accounts to new admin: {:?}",
            user_id, new_admin_id
        );
        account_service
            .reassign_customer_accounts(user_id, new_admin_id)
            .await?;
    }

    // Publish organizational change processed event
    publish_organizational_change_processed_event(js, &event).await?;

    if let Err(e) = message.ack().await {
        error!("Failed to ack message: {}", e);
    }
    Ok(())
}

async fn publish_account_created_event(
    js: &async_nats::jetstream::Context,
    account: &crate::models::Account,
    user_event: &UserCreatedEvent,
) -> anyhow::Result<()> {
    let event_payload = json!({
        "event_type": "account.created",
        "account_id": account.id,
        "account_number": account.account_number,
        "account_type": account.account_type,
        "organization_id": account.organization_id,
        "environment": account.environment,
        "user_id": account.user_id,
        "admin_user_id": account.admin_user_id,
        "user_role": account.user_role,
        "currency": account.currency,
        "status": account.status,
        "created_at": account.created_at,
        "saga_correlation_id": user_event.event_id,
    });

    let subject = format!(
        "accounts.account.created.{}.{}",
        user_event.environment.to_lowercase(),
        account
            .organization_id
            .map(|id| id.to_string())
            .unwrap_or_else(|| "default".to_string())
    );

    js.publish(subject, event_payload.to_string().into())
        .await?;

    info!("Published account.created event for account {}", account.id);
    Ok(())
}

async fn publish_organizational_change_processed_event(
    js: &async_nats::jetstream::Context,
    event: &OrganizationalChangeEvent,
) -> anyhow::Result<()> {
    let event_payload = json!({
        "event_type": "organizational_change.processed",
        "user_id": event.user_id,
        "organization_id": event.organization_id,
        "environment": event.environment,
        "old_role": event.old_role,
        "new_role": event.new_role,
        "old_admin_id": event.old_admin_id,
        "new_admin_id": event.new_admin_id,
        "processed_at": chrono::Utc::now(),
    });

    let subject = format!(
        "accounts.organizational.processed.{}.{}",
        event.environment.to_lowercase(),
        event.organization_id
    );

    js.publish(subject, event_payload.to_string().into())
        .await?;

    info!(
        "Published organizational change processed event for user {}",
        event.user_id
    );
    Ok(())
}

async fn ensure_stream(js: &async_nats::jetstream::Context, stream: &str) -> anyhow::Result<()> {
    match js.get_stream(stream).await {
        Ok(_) => {
            info!("JetStream stream '{}' exists", stream);
            Ok(())
        }
        Err(_) => {
            info!("Creating JetStream stream '{}'", stream);
            let config = async_nats::jetstream::stream::Config {
                name: stream.to_string(),
                subjects: vec![
                    "users.user.created.*.*".to_string(),
                    "accounts.account.created.*.*".to_string(),
                    "users.organizational.*.*".to_string(),
                    "accounts.organizational.*.*".to_string(),
                ],
                max_messages: 1_000_000,
                max_bytes: 1_024 * 1_024 * 1_024, // 1GB
                retention: async_nats::jetstream::stream::RetentionPolicy::WorkQueue,
                storage: async_nats::jetstream::stream::StorageType::File,
                ..Default::default()
            };

            js.create_stream(config).await?;
            info!("Created JetStream stream '{}'", stream);
            Ok(())
        }
    }
}
