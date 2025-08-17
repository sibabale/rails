import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BankDashboardPage } from './BankDashboardPage';
import type { BankDashboardPageProps } from './BankDashboardPage.interface';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock API functions
jest.mock('../../../lib/api', () => ({
  triggerSettlement: jest.fn(),
  getPendingTransactions: jest.fn(),
  getDashboardMetrics: jest.fn(),
}));

// Mock Redux hooks
jest.mock('../../../lib/hooks', () => ({
  useAppSelector: jest.fn(),
}));

// Mock selectors
jest.mock('../../../lib/selectors', () => ({
  selectBankProfile: jest.fn(),
}));

// Mock child components
jest.mock('../../organisms/DataTable', () => ({
  DataTable: ({ showAllBanks }: { showAllBanks?: boolean }) => (
    <div data-testid="data-table" data-show-all-banks={showAllBanks}>
      Data Table
    </div>
  ),
}));

jest.mock('../../organisms/Footer', () => ({
  Footer: ({ onNavigate }: { onNavigate?: (page: string) => void }) => (
    <footer data-testid="footer">
      <button onClick={() => onNavigate?.('home')}>Home</button>
      <button onClick={() => onNavigate?.('products')}>Products</button>
      <button onClick={() => onNavigate?.('dashboard')}>Dashboard</button>
    </footer>
  ),
}));

const mockBankProfile = {
  adminEmail: 'admin@testbank.com',
  bankName: 'Test Bank',
  bankCode: 'TEST',
  contactEmail: 'contact@testbank.com',
};

const mockPendingTransactions = {
  pending: [
    { id: '1', amount: 100, status: 'pending' },
    { id: '2', amount: 200, status: 'pending' },
  ],
  count: 2,
  timestamp: new Date().toISOString(),
};

const mockMetrics = {
  activeTransactions: 10,
  totalVolume: 1000,
};

describe('BankDashboardPage', () => {
  const { triggerSettlement, getPendingTransactions, getDashboardMetrics } = require('../../../lib/api');
  const { useAppSelector } = require('../../../lib/hooks');

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Default mocks
    useAppSelector.mockReturnValue(mockBankProfile);
    getPendingTransactions.mockResolvedValue(mockPendingTransactions);
    getDashboardMetrics.mockResolvedValue(mockMetrics);
  });

  describe('Public Interface Validation', () => {
    test('should render with required props when authenticated', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bank-dashboard-page')).toBeInTheDocument();
      });
    });

    test('should handle optional props correctly', async () => {
      const customClassName = 'custom-bank-dashboard-page';
      const customStyle = { backgroundColor: 'green' };
      
      render(
        <BankDashboardPage
          className={customClassName}
          style={customStyle}
          data-testid="custom-bank-dashboard-page"
        />
      );
      
      await waitFor(() => {
        const dashboardPage = screen.getByTestId('custom-bank-dashboard-page');
        expect(dashboardPage).toBeInTheDocument();
        expect(dashboardPage).toHaveClass(customClassName);
        expect(dashboardPage).toHaveStyle('background-color: green');
      });
    });

    test('should redirect to login when not authenticated', () => {
      useAppSelector.mockReturnValue({ adminEmail: null });
      
      render(<BankDashboardPage />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Dashboard Content', () => {
    test('should display bank name in header', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Bank Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Weekend settlement management')).toBeInTheDocument();
      });
    });

    test('should display pending transactions count', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Pending Transactions')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('ready for processing')).toBeInTheDocument();
      });
    });

    test('should display settlement status', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Settlement Status')).toBeInTheDocument();
        expect(screen.getByText('Ready')).toBeInTheDocument();
        expect(screen.getByText('Click to start settlement')).toBeInTheDocument();
      });
    });

    test('should display processing fee', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Processing Fee (1%)')).toBeInTheDocument();
        expect(screen.getByText('R10.00')).toBeInTheDocument(); // 10 transactions * 100 * 0.01
        expect(screen.getByText('calculated on settlement')).toBeInTheDocument();
      });
    });
  });

  describe('Settlement Functionality', () => {
    test('should show settlement button when pending transactions exist', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start weekend settlement/i })).toBeInTheDocument();
      });
    });

    test('should not show settlement button when no pending transactions', async () => {
      getPendingTransactions.mockResolvedValue({ ...mockPendingTransactions, count: 0 });
      
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /start weekend settlement/i })).not.toBeInTheDocument();
      });
    });

    test('should open confirmation dialog when settlement button is clicked', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        const settlementButton = screen.getByRole('button', { name: /start weekend settlement/i });
        fireEvent.click(settlementButton);
      });
      
      expect(screen.getByText('Confirm Settlement')).toBeInTheDocument();
      expect(screen.getByText('This will process 2 pending transactions and cannot be undone.')).toBeInTheDocument();
    });

    test('should close confirmation dialog when cancel is clicked', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        const settlementButton = screen.getByRole('button', { name: /start weekend settlement/i });
        fireEvent.click(settlementButton);
      });
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm Settlement')).not.toBeInTheDocument();
      });
    });

    test('should trigger settlement when confirmed', async () => {
      const mockSettlementResult = {
        settled: [{ id: '1' }, { id: '2' }],
        total: 2,
      };
      triggerSettlement.mockResolvedValue(mockSettlementResult);
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        const settlementButton = screen.getByRole('button', { name: /start weekend settlement/i });
        fireEvent.click(settlementButton);
      });
      
      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(triggerSettlement).toHaveBeenCalledWith('admin@testbank.com');
        expect(alertSpy).toHaveBeenCalledWith('Settlement completed! 2 transactions processed.');
      });
      
      alertSpy.mockRestore();
    });

    test('should handle settlement error', async () => {
      triggerSettlement.mockRejectedValue(new Error('Settlement failed'));
      
      // Mock console.error and window.alert
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        const settlementButton = screen.getByRole('button', { name: /start weekend settlement/i });
        fireEvent.click(settlementButton);
      });
      
      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Settlement failed:', expect.any(Error));
        expect(alertSpy).toHaveBeenCalledWith('Settlement failed. Please try again.');
      });
      
      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Data Loading', () => {
    test('should handle API errors gracefully', async () => {
      getPendingTransactions.mockRejectedValue(new Error('API Error'));
      getDashboardMetrics.mockRejectedValue(new Error('Metrics Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bank-dashboard-page')).toBeInTheDocument();
      });
      
      // Should show fallback values
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Fallback pending count
        expect(screen.getByText('R0.00')).toBeInTheDocument(); // Fallback fee
      });
      
      consoleSpy.mockRestore();
    });

    test('should refresh data after successful settlement', async () => {
      const mockSettlementResult = {
        settled: [{ id: '1' }],
        total: 1,
      };
      triggerSettlement.mockResolvedValue(mockSettlementResult);
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        const settlementButton = screen.getByRole('button', { name: /start weekend settlement/i });
        fireEvent.click(settlementButton);
      });
      
      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        // Should call APIs again to refresh data
        expect(getPendingTransactions).toHaveBeenCalledTimes(2); // Initial load + refresh
        expect(getDashboardMetrics).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    test('should handle navigation to different pages', () => {
      render(<BankDashboardPage />);
      
      // Navigation function should be created properly
      // This is tested through the Footer component integration
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should render DataTable with correct props', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        const dataTable = screen.getByTestId('data-table');
        expect(dataTable).toBeInTheDocument();
        expect(dataTable).toHaveAttribute('data-show-all-banks', 'false');
      });
    });

    test('should render Footer component', async () => {
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('footer')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing bank profile gracefully', () => {
      useAppSelector.mockReturnValue(null);
      
      render(<BankDashboardPage />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should handle empty bank profile', () => {
      useAppSelector.mockReturnValue({});
      
      render(<BankDashboardPage />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should show complete status when no pending transactions', async () => {
      getPendingTransactions.mockResolvedValue({ ...mockPendingTransactions, count: 0 });
      
      render(<BankDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Complete')).toBeInTheDocument();
        expect(screen.getByText('All transactions processed')).toBeInTheDocument();
      });
    });
  });
});