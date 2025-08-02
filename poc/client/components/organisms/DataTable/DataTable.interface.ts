export interface Transaction {
  txn_ref: string;
  userId: string;
  amount: number;
  type: 'debit' | 'credit';
  currency?: string;
  timestamp?: string;
  description: string;
  sender: string;
  receiver: string;
  sender_bank: string;
  receiver_bank: string;
  status?: 'completed' | 'processing' | 'pending' | 'failed';
  metadata: {
    ip_address: string;
    session_id: string;
    user_agent?: string;
    device_fingerprint?: string;
  };
}

export interface DataTableProps {
  showAllBanks?: boolean; // If true, show all transactions (internal view)
}

export interface DataTableState {
  searchTerm: string;
  statusFilter: string;
  bankFilter: string;
  currentPage: number;
  itemsPerPage: number;
  allTransactions: Transaction[];
  allTransactionsLoading: boolean;
} 