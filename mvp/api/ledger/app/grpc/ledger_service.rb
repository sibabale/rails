# frozen_string_literal: true

require 'grpc'
require 'google/protobuf'
require_relative '../../proto/ledger_services_pb'

module Grpc
  class LedgerService < Rails::Ledger::LedgerService::Service
    def post_transaction(request, _call)
      organization_id = request.organization_id
      environment = proto_env_to_string(request.environment)
      source_external_account_id = request.source_external_account_id
      destination_external_account_id = request.destination_external_account_id
      amount = request.amount
      currency = request.currency
      external_transaction_id = request.external_transaction_id
      idempotency_key = request.idempotency_key
      correlation_id = request.correlation_id

      result = LedgerPoster.post(
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

      Rails::Ledger::PostTransactionResponse.new(
        status: 'posted',
        ledger_transaction_id: result.id.to_s,
        failure_reason: ''
      )
    rescue LedgerPoster::IdempotencyError => e
      Rails::Ledger::PostTransactionResponse.new(
        status: 'posted',
        ledger_transaction_id: e.transaction.id.to_s,
        failure_reason: ''
      )
    rescue => e
      Rails::Ledger::PostTransactionResponse.new(
        status: 'failed',
        ledger_transaction_id: '',
        failure_reason: e.message
      )
    end

    def get_account_balance(request, _call)
      organization_id = request.organization_id
      environment = proto_env_to_string(request.environment)
      external_account_id = request.external_account_id
      currency = request.currency

      account = LedgerAccount.find_by!(
        organization_id: organization_id,
        environment: environment,
        external_account_id: external_account_id,
        currency: currency
      )

      balance = LedgerEntry.balance_for(account.id)

      Rails::Ledger::GetAccountBalanceResponse.new(
        balance: balance.to_s,
        currency: currency
      )
    rescue => e
      raise GRPC::NotFound.new(e.message)
    end

    private

    def proto_env_to_string(proto_env)
      case proto_env
      when Rails::Ledger::Environment::SANDBOX
        'sandbox'
      when Rails::Ledger::Environment::PRODUCTION
        'production'
      else
        raise GRPC::InvalidArgument.new('Invalid environment')
      end
    end
  end
end
