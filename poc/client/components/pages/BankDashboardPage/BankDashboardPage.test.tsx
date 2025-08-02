import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { BankDashboardPage } from './BankDashboardPage';
import type { BankDashboardPageProps } from './BankDashboardPage.interface';

// Mock the API functions
jest.mock('../../../lib/api', () => ({
  triggerSettlement: jest.fn(),
  getPendingTransactions: jest.fn(),
  getDashboardMetrics: jest.fn()
}));

// Mock the hooks
jest.mock('../../../lib/hooks', () => ({
  useAppSelector: jest.fn()
}));

// Mock the selectors
jest.mock('../../../lib/selectors', () => ({
  selectBankProfile: jest.fn()
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock components
jest.mock('../../DataTable', () => ({
  DataTable: ({ showAllBanks, ...props }) => (
    <div data-testid="data-table" data-show-all-banks={showAllBanks} {...props}>
      Data Table
    </div>
  )
}));

jest.mock('../../Footer', () => ({
  Footer: ({ onNavigate, ...props }) => (
    <div data-testid="footer" {...props}>
      <button onClick={() => onNavigate?.('home')}>Home</button>
      Footer
    </div>
  )
}));

// Create a mock store
const mockStore = configureStore({
  reducer: {
    bank: (state = { profile: null }, action) => state
  }
});

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('BankDashboardPage', () => {
  const mockBankProfile = {
    adminEmail: 'test@bank.com',
    bankName: 'Test Bank'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the selector to return bank profile
    const { useAppSelector } = require('../../../lib/hooks');
    useAppSelector.mockReturnValue(mockBankProfile);
    
    // Mock API responses
    const { getPendingTransactions, getDashboardMetrics } = require('../../../lib/api');
    getPendingTransactions.mockResolvedValue({ pending: [], count: 5, timestamp: new Date().toISOString() });
    getDashboardMetrics.mockResolvedValue({ activeTransactions: 10 });
  });

  describe('Public Interface Validation', () => {
    test('renders with default props when authenticated', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test Bank Dashboard')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Weekend settlement management')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('renders with all optional props', async () => {
      const props: BankDashboardPageProps = {
        className: 'custom-bank-dashboard',
        style: { backgroundColor: 'blue' },
        'data-testid': 'custom-bank-dashboard'
      };
      
      render(
        <TestWrapper>
          <BankDashboardPage {...props} />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const container = screen.getByTestId('custom-bank-dashboard');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('min-h-screen', 'bg-white', 'custom-bank-dashboard');
        expect(container).toHaveStyle({ backgroundColor: 'blue' });
      });
    });

    test('applies custom className', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage className="custom-class" data-testid="bank-dashboard-test" />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const element = screen.getByTestId('bank-dashboard-test');
        expect(element).toHaveClass('custom-class');
      });
    });

    test('applies custom style', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage style={{ color: 'red' }} data-testid="bank-dashboard-test" />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const element = screen.getByTestId('bank-dashboard-test');
        expect(element).toHaveStyle({ color: 'red' });
      });
    });
  });

  describe('Authentication Behavior', () => {
    test('redirects to login when not authenticated', () => {
      const { useAppSelector } = require('../../../lib/hooks');
      useAppSelector.mockReturnValue({ adminEmail: null });
      
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('renders null when not authenticated', () => {
      const { useAppSelector } = require('../../../lib/hooks');
      useAppSelector.mockReturnValue({ adminEmail: null });
      
      const { container } = render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Settlement Functionality', () => {
    test('shows settlement button when there are pending transactions', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Start Weekend Settlement')).toBeInTheDocument();
      });
    });

    test('opens confirmation dialog when settlement button is clicked', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const settlementButton = screen.getByText('Start Weekend Settlement');
        fireEvent.click(settlementButton);
      });
      
      expect(screen.getByText('Confirm Settlement')).toBeInTheDocument();
      expect(screen.getByText(/This will process \d+ pending transactions/)).toBeInTheDocument();
    });

    test('triggers settlement when confirmed', async () => {
      const { triggerSettlement } = require('../../../lib/api');
      triggerSettlement.mockResolvedValue({ settled: [{ id: 1 }] });
      
      // Mock window.alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation();
      
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const settlementButton = screen.getByText('Start Weekend Settlement');
        fireEvent.click(settlementButton);
      });
      
      const confirmButton = screen.getByText('Confirm Settlement');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(triggerSettlement).toHaveBeenCalledWith('test@bank.com');
      });
      
      mockAlert.mockRestore();
    });
  });

  describe('Data Loading', () => {
    test('loads dashboard data on mount', async () => {
      const { getPendingTransactions, getDashboardMetrics } = require('../../../lib/api');
      
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(getPendingTransactions).toHaveBeenCalled();
        expect(getDashboardMetrics).toHaveBeenCalled();
      });
    });

    test('handles API errors gracefully', async () => {
      const { getPendingTransactions, getDashboardMetrics } = require('../../../lib/api');
      getPendingTransactions.mockRejectedValue(new Error('API Error'));
      getDashboardMetrics.mockRejectedValue(new Error('API Error'));
      
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test Bank Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    test('renders correct bank cards', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Pending Transactions')).toBeInTheDocument();
        expect(screen.getByText('Settlement Status')).toBeInTheDocument();
        expect(screen.getByText('Processing Fee (1%)')).toBeInTheDocument();
      });
    });

    test('passes correct props to DataTable', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const dataTable = screen.getByTestId('data-table');
        expect(dataTable).toHaveAttribute('data-show-all-banks', 'false');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles no pending transactions', async () => {
      const { getPendingTransactions } = require('../../../lib/api');
      getPendingTransactions.mockResolvedValue({ pending: [], count: 0, timestamp: new Date().toISOString() });
      
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.queryByText('Start Weekend Settlement')).not.toBeInTheDocument();
      });
    });

    test('handles settlement errors', async () => {
      const { triggerSettlement } = require('../../../lib/api');
      triggerSettlement.mockRejectedValue(new Error('Settlement failed'));
      
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation();
      
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const settlementButton = screen.getByText('Start Weekend Settlement');
        fireEvent.click(settlementButton);
      });
      
      const confirmButton = screen.getByText('Confirm Settlement');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Settlement failed. Please try again.');
      });
      
      mockAlert.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
      });
    });

    test('maintains accessibility with custom props', async () => {
      render(
        <TestWrapper>
          <BankDashboardPage 
            data-testid="accessible-bank-dashboard"
            className="custom-accessible"
          />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
        
        const container = screen.getByTestId('accessible-bank-dashboard');
        expect(container).toHaveClass('custom-accessible');
      });
    });
  });
});