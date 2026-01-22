# frozen_string_literal: true

class LedgerAccount < ApplicationRecord
  self.table_name = 'ledger_accounts'

  validates :organization_id, presence: true
  validates :environment, presence: true, inclusion: { in: %w[sandbox production] }
  validates :external_account_id, presence: true
  validates :account_type, presence: true
  validates :currency, presence: true

  has_many :debit_entries, class_name: 'LedgerEntry', foreign_key: 'ledger_account_id'
  has_many :credit_entries, class_name: 'LedgerEntry', foreign_key: 'ledger_account_id'

  def self.resolve(organization_id:, environment:, external_account_id:, currency:)
    find_or_create_by!(
      organization_id: organization_id,
      environment: environment,
      external_account_id: external_account_id,
      currency: currency
    ) do |account|
      account.account_type = 'asset' # Default to asset for POC
    end
  end
end
