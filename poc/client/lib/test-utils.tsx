import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { healthSlice } from './slices/healthSlice';
import { transactionSlice } from './slices/transactionSlice';
import { bankSlice } from './slices/bankSlice';
import { clientSlice } from './slices/clientSlice';
import type { RootState } from './store';

/**
 * Default mock state that matches the expected Redux structure
 */
export const createMockState = (overrides?: Partial<RootState>): RootState => ({
  auth: {
    isAuthenticated: false,
    authToken: null,
    user: null,
    loading: false,
    error: null,
  },
  health: {
    status: 'healthy',
    lastChecked: null,
    loading: false,
    error: null,
  },
  transactions: {
    transactions: [],
    loading: false,
    error: null,
    submissionLoading: false,
    submissionError: null,
    lastSubmission: null,
  },
  bank: {
    bankProfile: null,
    profileLoading: false,
    profileError: null,
    registrationLoading: false,
    registrationError: null,
    registrationSuccess: false,
  },
  clients: {
    clients: [],
    loading: false,
    error: null,
  },
  ...overrides,
});

/**
 * Creates a test store with all required reducers
 */
export const createTestStore = (preloadedState?: Partial<RootState>) => {
  const mockState = createMockState(preloadedState);
  
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      health: healthSlice.reducer,
      transactions: transactionSlice.reducer,
      bank: bankSlice.reducer,
      clients: clientSlice.reducer,
    },
    preloadedState: mockState,
  });
};

/**
 * Test wrapper component that provides Redux store and React Router
 */
interface TestWrapperProps {
  children: React.ReactNode;
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  initialState,
  store: providedStore 
}) => {
  const store = providedStore || createTestStore(initialState);
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

/**
 * Custom render function that includes Redux and Router providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialState, store, ...renderOptions } = options;
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper initialState={initialState} store={store}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock transaction data for testing
 */
export const mockTransactions = [
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
  {
    txn_ref: 'TXN002',
    userId: 'user2',
    amount: 2500,
    type: 'debit' as const,
    description: 'Another test transaction',
    sender: 'Bank B',
    receiver: 'Bank C',
    sender_bank: 'ABSA Bank',
    receiver_bank: 'Standard Bank',
    status: 'pending' as const,
    metadata: {
      ip_address: '192.168.1.2',
      session_id: 'session2',
    },
  },
];

/**
 * Mock bank profile data for testing
 */
export const mockBankProfile = {
  adminEmail: 'admin@testbank.com',
  bankName: 'Test Bank',
  bankCode: 'TESTBANK',
  contactNumber: '+1234567890',
  address: '123 Test St, Test City, TC 12345',
  licenseNumber: 'LIC123456',
  swiftCode: 'TESTZA00',
  apiEndpoint: 'https://api.testbank.com',
  webhookUrl: 'https://webhook.testbank.com',
};

/**
 * Mock authentication user data
 */
export const mockAuthUser = {
  ...mockBankProfile,
  id: 'user123',
};

// Export everything from @testing-library/react for convenience
export * from '@testing-library/react';