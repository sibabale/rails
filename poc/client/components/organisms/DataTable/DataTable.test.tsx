import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DataTable } from './DataTable';
import { DataTableProps } from './DataTable.interface';
import transactionReducer from '../../../lib/slices/transactionSlice';
import bankReducer from '../../../lib/slices/bankSlice';

// Mock the Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      transactions: transactionReducer,
      bank: bankReducer,
    },
    preloadedState: initialState,
  });
};

// Mock fetch
global.fetch = jest.fn();

const mockTransactions = [
  {
    txn_ref: 'TXN001',
    userId: 'user1',
    amount: 1000,
    type: 'credit' as const,
    description: 'Test transaction',
    sender: 'Bank A',
    receiver: 'Bank B',
    sender_bank: 'First National Bank',
    receiver_bank: 'ABSA Bank',
    status: 'completed' as const,
    metadata: {
      ip_address: '192.168.1.1',
      session_id: 'session1',
    },
  },
];

const defaultProps: DataTableProps = {
  showAllBanks: false,
};

const renderWithProvider = (props: DataTableProps = defaultProps, initialState = {}) => {
  const store = createMockStore({
    transactions: {
      transactions: mockTransactions,
      loading: false,
      error: null,
    },
    bank: {
      bankProfile: {
        adminEmail: 'test@bank.com',
        bankName: 'Test Bank',
      },
    },
    ...initialState,
  });

  return render(
    <Provider store={store}>
      <DataTable {...props} />
    </Provider>
  );
};

describe('DataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with correct title', () => {
    renderWithProvider();
    expect(screen.getByText('Transaction Processing Log')).toBeInTheDocument();
  });

  it('displays transaction data when available', () => {
    renderWithProvider();
    expect(screen.getByText('TXN001')).toBeInTheDocument();
    expect(screen.getByText('R1,000')).toBeInTheDocument();
    expect(screen.getByText('credit')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('shows loading state when transactions are loading', () => {
    renderWithProvider(defaultProps, {
      transactions: {
        transactions: [],
        loading: true,
        error: null,
      },
    });
    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
  });

  it('shows empty state when no transactions are available', () => {
    renderWithProvider(defaultProps, {
      transactions: {
        transactions: [],
        loading: false,
        error: null,
      },
    });
    expect(screen.getByText('No transactions found')).toBeInTheDocument();
  });

  it('filters transactions by search term', async () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText('Search transactions or references...');
    
    fireEvent.change(searchInput, { target: { value: 'TXN001' } });
    
    await waitFor(() => {
      expect(screen.getByText('TXN001')).toBeInTheDocument();
    });
  });

  it('displays correct bank abbreviation', () => {
    renderWithProvider();
    expect(screen.getByText('FNB')).toBeInTheDocument();
  });

  it('calculates and displays fee correctly', () => {
    renderWithProvider();
    expect(screen.getByText('R10.00')).toBeInTheDocument(); // 1% of 1000
  });

  it('shows refresh button and handles click', () => {
    renderWithProvider();
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    // The button should be clickable (actual functionality would be tested in integration tests)
  });

  it('displays pagination when there are multiple transactions', () => {
    const multipleTransactions = Array.from({ length: 10 }, (_, i) => ({
      ...mockTransactions[0],
      txn_ref: `TXN${String(i + 1).padStart(3, '0')}`,
    }));

    renderWithProvider(defaultProps, {
      transactions: {
        transactions: multipleTransactions,
        loading: false,
        error: null,
      },
    });

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows correct transaction summary statistics', () => {
    renderWithProvider();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total transactions
    expect(screen.getByText('R1,000')).toBeInTheDocument(); // Total volume
    expect(screen.getByText('R10')).toBeInTheDocument(); // Processing fees
    expect(screen.getByText('100%')).toBeInTheDocument(); // Success rate
  });
}); 