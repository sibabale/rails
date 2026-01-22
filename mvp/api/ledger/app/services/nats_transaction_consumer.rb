# frozen_string_literal: true

class NatsTransactionConsumer
  def self.run
    return unless nats_enabled?

    client = AsyncNats.connect(nats_url)
    stream = ENV['NATS_STREAM'] || 'rails_events'

    setup_stream(client, stream)
    start_consumer(client, stream)
  end

  private

  def self.nats_enabled?
    ENV['NATS_URL'].present?
  end

  def self.nats_url
    ENV['NATS_URL'] || 'nats://localhost:4222'
  end

  def self.setup_stream(client, stream)
    # This would use JetStream in a full implementation
    # For POC, we'll use simple pub/sub
    Rails.logger.info "NATS consumer ready for stream: #{stream}"
  end

  def self.start_consumer(client, stream)
    # Subscribe to transaction events from Accounts service
    client.subscribe('transactions.created.>') do |msg|
      begin
        process_message(msg)
      rescue => e
        Rails.logger.error "Failed to process NATS message: #{e.message}", { subject: msg.subject, data: msg.data }
      end
    end

    Rails.logger.info "NATS consumer subscribed to transactions.created.>"
  end

  def self.process_message(msg)
    subject = msg.subject
    data = JSON.parse(msg.data)

    # Extract environment and organization from subject
    # Format: transactions.created.{environment}.{organization_id}
    parts = subject.split('.')
    return unless parts.length >= 4

    environment = parts[2]
    organization_id = parts[3]

    # Validate environment
    return unless %w[sandbox production].include?(environment)

    # Extract transaction data
    source_external_account_id = data['from_account_id']
    destination_external_account_id = data['to_account_id']
    amount = data['amount']
    currency = data['currency']
    external_transaction_id = data['transaction_id']
    idempotency_key = data['idempotency_key']
    correlation_id = data['correlation_id']

    return unless all_fields_present?(data)

    # Post to ledger
    LedgerPoster.post(
      organization_id: organization_id,
      environment: environment,
      source_external_account_id: source_external_account_id,
      destination_external_account_id: destination_external_account_id,
      amount: amount,
      currency: currency,
      external_transaction_id: external_transaction_id,
      idempotency_key: idempotency_key,
      correlation_id: correlation_id
    )

    Rails.logger.info "Processed transaction via NATS", {
      organization_id: organization_id,
      environment: environment,
      external_transaction_id: external_transaction_id,
      correlation_id: correlation_id
    }
  end

  def self.all_fields_present?(data)
    required_fields = %w[from_account_id to_account_id amount currency transaction_id idempotency_key]
    required_fields.all? { |field| data[field].present? }
  end
end
