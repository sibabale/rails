class ApplicationController < ActionController::API
  def health
    require 'socket'
    grpc_port = ENV.fetch('GRPC_PORT', 50053).to_i
    grpc_ok = begin
      Socket.tcp('127.0.0.1', grpc_port, connect_timeout: 0.25) { true }
    rescue
      false
    end

    render json: {
      status: 'ok',
      service: 'ledger',
      grpc: {
        port: grpc_port,
        status: (grpc_ok ? 'ok' : 'down')
      },
      timestamp: Time.current.iso8601
    }
  end
end
