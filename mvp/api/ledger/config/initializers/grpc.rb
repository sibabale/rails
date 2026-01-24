# frozen_string_literal: true

# Configure structured logging
Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new

  config.lograge.custom_options = lambda do |event|
    {
      organization_id: event.payload[:organization_id],
      environment: event.payload[:environment],
      correlation_id: event.payload[:correlation_id],
      service: 'ledger'
    }.compact
  end
end

# Initialize gRPC server in a background thread (only when running server)
if Rails.env.development? || Rails.env.production?
  Rails.application.config.after_initialize do
    # Load generated protobuf files
    Dir[Rails.root.join('lib', 'grpc', '**', '*_pb.rb')].each { |f| require f }

    require 'grpc'
    require 'google/protobuf'

    Thread.new do
      begin
        grpc_port = ENV.fetch('GRPC_PORT', 50053).to_i
        server = GRPC::RpcServer.new
        server.add_http2_port("0.0.0.0:#{grpc_port}", :this_port_is_insecure)
        server.handle(Grpc::LedgerService.new)

        Rails.logger.info "Ledger gRPC server starting on 0.0.0.0:#{grpc_port}"
        server.run_till_terminated
      rescue => e
        Rails.logger.error "Failed to start Ledger gRPC server: #{e.message}"
      end
    end
  end
end

