use async_nats::{Client, PublishError};

#[derive(Clone)]
pub enum NatsClient {
    Connected(Client),
    Disconnected,
}

impl NatsClient {
    pub async fn publish(&self, subject: String, payload: bytes::Bytes) -> Result<(), PublishError> {
        match self {
            NatsClient::Connected(client) => client.publish(subject, payload).await,
            NatsClient::Disconnected => {
                tracing::warn!("NATS not connected, skipping publish to {}", subject);
                Ok(())
            }
        }
    }
}

pub async fn init(nats_url: &str) -> anyhow::Result<NatsClient> {
    match async_nats::connect(nats_url).await {
        Ok(client) => {
            tracing::info!("NATS connection established");
            Ok(NatsClient::Connected(client))
        }
        Err(e) => {
            tracing::warn!("Failed to connect to NATS at {}: {}", nats_url, e);
            tracing::warn!("Service will continue without NATS (events will not be published)");
            tracing::warn!("To enable NATS: brew install nats-server && nats-server");
            Ok(NatsClient::Disconnected)
        }
    }
}
