// (Removed duplicate function header)
// TODO: Add tonic::include_proto! and AccountsServiceClient after codegen is set up.
#[derive(Clone)]
pub struct GrpcClients;

pub async fn init(_config: &crate::config::Config) -> Result<GrpcClients, tonic::transport::Error> {
    Ok(GrpcClients)
}
