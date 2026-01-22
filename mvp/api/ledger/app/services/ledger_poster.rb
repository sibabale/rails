# frozen_string_literal: true

class LedgerPoster
  class PostingError < StandardError; end
  class IdempotencyError < StandardError; end
  class InvalidAccountTypeError < StandardError; end

  def self.post(organization_id:, environment:, source_external_account_id:, destination_external_account_id:, amount:, currency:, external_transaction_id:, idempotency_key:, correlation_id: nil)
    new(
      organization_id: organization_id,
      environment: environment,
      source_external_account_id: source_external_account_id,
      destination_external_account_id: destination_external_account_id,
      amount: amount,
      currency: currency,
      external_transaction_id: external_transaction_id,
      idempotency_key: idempotency_key,
      correlation_id: correlation_id
    ).call
  end

  def self.post_deposit(organization_id:, environment:, destination_external_account_id:, amount:, currency:, external_transaction_id:, idempotency_key:, correlation_id: nil)
    new(
      organization_id: organization_id,
      environment: environment,
      source_external_account_id: 'SYSTEM_CASH_CONTROL',
      destination_external_account_id: destination_external_account_id,
      amount: amount,
      currency: currency,
      external_transaction_id: external_transaction_id,
      idempotency_key: idempotency_key,
      correlation_id: correlation_id,
      is_deposit: true
    ).call
  end

  def initialize(organization_id:, environment:, source_external_account_id:, destination_external_account_id:, amount:, currency:, external_transaction_id:, idempotency_key:, correlation_id: nil, is_deposit: false)
    @organization_id = organization_id
    @environment = environment
    @source_external_account_id = source_external_account_id
    @destination_external_account_id = destination_external_account_id
    @amount = amount
    @currency = currency
    @external_transaction_id = external_transaction_id
    @idempotency_key = idempotency_key
    @correlation_id = correlation_id
    @is_deposit = is_deposit
  end

  def call
    validate_inputs!
    existing = LedgerTransaction.find_existing(
      organization_id: @organization_id,
      environment: @environment,
      idempotency_key: @idempotency_key
    )

    return existing_result(existing) if existing

    LedgerTransaction.transaction do
      ledger_transaction = create_ledger_transaction!
      source_account = resolve_ledger_account(@source_external_account_id, determine_source_account_type)
      destination_account = resolve_ledger_account(@destination_external_account_id, determine_destination_account_type)

      validate_account_types!(source_account, destination_account)
      create_double_entry!(ledger_transaction, source_account, destination_account)
      update_balances!(source_account, destination_account)
      ledger_transaction.mark_as_posted!

      emit_success_event(ledger_transaction)
      ledger_transaction
    end
  rescue => e
    Rails.logger.error "Ledger posting failed: #{e.message}", {
      organization_id: @organization_id,
      environment: @environment,
      external_transaction_id: @external_transaction_id,
      idempotency_key: @idempotency_key,
      correlation_id: @correlation_id,
      error: e.message
    }
    raise PostingError, e.message
  end

  private

  def validate_inputs!
    raise PostingError, "Amount must be positive" unless @amount > 0
    raise PostingError, "Invalid environment" unless %w[sandbox production].include?(@environment)
    raise PostingError, "Currency must match" unless @currency.present?
  end

  def existing_result(transaction)
    if transaction.posted?
      transaction
    else
      raise IdempotencyError, "Transaction already exists but not posted"
    end
  end

  def create_ledger_transaction!
    LedgerTransaction.create!(
      organization_id: @organization_id,
      environment: @environment,
      external_transaction_id: @external_transaction_id,
      status: 'pending',
      idempotency_key: @idempotency_key
    )
  end

  def determine_source_account_type
    if @is_deposit || @source_external_account_id.start_with?('SYSTEM_')
      'asset'
    else
      'liability'
    end
  end

  def determine_destination_account_type
    if @destination_external_account_id.start_with?('SYSTEM_')
      case @destination_external_account_id
      when 'SYSTEM_CASH_CONTROL', 'SYSTEM_BANK_CLEARING'
        'asset'
      when 'SYSTEM_FEE_INCOME'
        'income'
      else
        'asset'
      end
    else
      'liability'
    end
  end

  def resolve_ledger_account(external_account_id, account_type)
    LedgerAccount.resolve(
      organization_id: @organization_id,
      environment: @environment,
      external_account_id: external_account_id,
      currency: @currency,
      account_type: account_type
    )
  end

  def validate_account_types!(source_account, destination_account)
    # Validate that we're not doing self-transfers (except for control accounts)
    if source_account.id == destination_account.id && !@is_deposit
      raise PostingError, "Self-transfers are not allowed"
    end

    # Validate account type compatibility
    if @is_deposit
      raise PostingError, "Deposits must come from cash_control account" unless source_account.external_account_id == 'SYSTEM_CASH_CONTROL'
    end
  end

  def create_double_entry!(transaction, source_account, destination_account)
    # Source account gets CREDIT (money out)
    LedgerEntry.create!(
      organization_id: @organization_id,
      environment: @environment,
      ledger_account_id: source_account.id,
      transaction_id: transaction.id,
      entry_type: 'credit',
      amount: @amount,
      currency: @currency
    )

    # Destination account gets DEBIT (money in)
    LedgerEntry.create!(
      organization_id: @organization_id,
      environment: @environment,
      ledger_account_id: destination_account.id,
      transaction_id: transaction.id,
      entry_type: 'debit',
      amount: @amount,
      currency: @currency
    )
  end

  def update_balances!(source_account, destination_account)
    # Update source account balance (credit = decrease)
    AccountBalance.update_balance!(
      organization_id: @organization_id,
      environment: @environment,
      ledger_account_id: source_account.id,
      amount_cents: @amount,
      currency: @currency,
      entry_type: 'credit'
    )

    # Update destination account balance (debit = increase)
    AccountBalance.update_balance!(
      organization_id: @organization_id,
      environment: @environment,
      ledger_account_id: destination_account.id,
      amount_cents: @amount,
      currency: @currency,
      entry_type: 'debit'
    )
  end

  def emit_success_event(transaction)
    NatsPublisher.publish(
      subject: "ledger.transaction.posted.#{@environment}.#{@organization_id}",
      payload: {
        organization_id: @organization_id,
        environment: @environment,
        ledger_transaction_id: transaction.id,
        external_transaction_id: @external_transaction_id,
        correlation_id: @correlation_id,
        occurred_at: Time.current.iso8601
      }
    )
  end
end
