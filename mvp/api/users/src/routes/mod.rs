pub mod business;
pub mod environment;
pub mod apikey;
pub mod user;
pub mod auth;

use axum::{Router, routing::post};
use crate::db::Db;
use crate::nats::NatsClient;
use crate::grpc::GrpcClients;

#[derive(Clone)]
pub struct AppState {
    pub db: Db,
    pub nats: NatsClient,
    pub grpc: GrpcClients,
}

pub fn register_routes(db: Db, nats: NatsClient, grpc: GrpcClients) -> Router {
    let state = AppState { db, nats, grpc };
    Router::new()
        .route("/api/v1/business/register", post(business::register_business))
        .route("/api/v1/users", post(user::create_user))
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/refresh", post(auth::refresh_token))
        .route("/api/v1/auth/revoke", post(auth::revoke_token))
        .with_state(state)
}
