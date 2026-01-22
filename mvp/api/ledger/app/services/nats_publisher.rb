# frozen_string_literal: true

class NatsPublisher
  class << self
    def publish(subject:, payload:)
      return unless nats_enabled?

      client = AsyncNats.connect(nats_url)
      client.publish(subject, payload.to_json)
    rescue => e
      Rails.logger.error "NATS publish failed: #{e.message}", { subject: subject, payload: payload }
    end

    private

    def nats_enabled?
      ENV['NATS_URL'].present?
    end

    def nats_url
      ENV['NATS_URL'] || 'nats://localhost:4222'
    end
  end
end
