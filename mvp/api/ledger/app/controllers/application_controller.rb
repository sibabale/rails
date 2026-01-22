class ApplicationController < ActionController::API
  def health
    render json: {
      status: 'ok',
      service: 'ledger',
      timestamp: Time.current.iso8601
    }
  end
end
