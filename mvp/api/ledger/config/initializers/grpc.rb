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

# Initialize gRPC server in a background thread (only when running `rails server`)
# IMPORTANT: Do NOT start gRPC during rake tasks (e.g. db:migrate), as loading
# native extensions + background threads can crash the Ruby process on macOS.
# Check if we're running a server (not a rake task)
# Default to starting gRPC unless explicitly disabled or running rake
is_rake_task = File.basename($0) == 'rake' || (ARGV.first && ARGV.first.include?('rake'))
should_start_grpc = !is_rake_task && ENV['START_GRPC_SERVER'] != '0'

if (Rails.env.development? || Rails.env.production?) && should_start_grpc
  Rails.application.config.after_initialize do
    # Load generated protobuf files
    Dir[Rails.root.join('lib', 'grpc', '**', '*_pb.rb')].each { |f| require f }

    require 'grpc'
    require 'google/protobuf'

    Thread.new do
      begin
        # Ensure the gRPC service implementation is loaded before starting the server.
        require Rails.root.join('app', 'grpc', 'ledger_service').to_s

        grpc_port = ENV.fetch('GRPC_PORT', 50053).to_i
        server = GRPC::RpcServer.new
        server.add_http2_port("0.0.0.0:#{grpc_port}", :this_port_is_insecure)
        server.handle(LedgerService.new)

        Rails.logger.info "Ledger gRPC server starting on 0.0.0.0:#{grpc_port}"
        Rails.logger.info "Ledger gRPC server thread started (Thread ID: #{Thread.current.object_id})"
        server.run_till_terminated
      rescue => e
        Rails.logger.error "Failed to start Ledger gRPC server: #{e.class}: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
      end
    end
  end
end

