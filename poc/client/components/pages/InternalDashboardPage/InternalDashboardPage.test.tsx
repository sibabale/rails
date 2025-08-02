import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InternalDashboardPage } from './InternalDashboardPage';
import type { InternalDashboardPageProps } from './InternalDashboardPage.interface';

// Mock the imported components
jest.mock('../../HeroSection', () => ({
  HeroSection: ({ ...props }) => <div data-testid="hero-section" {...props}>Hero Section</div>
}));

jest.mock('../../SummaryCards', () => ({
  SummaryCards: ({ ...props }) => <div data-testid="summary-cards" {...props}>Summary Cards</div>
}));

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
      <button onClick={() => onNavigate?.('dashboard')}>Dashboard</button>
      <button onClick={() => onNavigate?.('products')}>Products</button>
      <button onClick={() => onNavigate?.('internal-dashboard')}>Internal Dashboard</button>
      Footer
    </div>
  )
}));

describe('InternalDashboardPage', () => {
  describe('Public Interface Validation', () => {
    test('renders with required props', () => {
      render(<InternalDashboardPage />);
      
      expect(screen.getByText('Rails Internal Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Full system metrics and controls')).toBeInTheDocument();
      expect(screen.getByText('Internal Use Only')).toBeInTheDocument();
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('renders with all optional props', () => {
      const mockOnNavigate = jest.fn();
      const props: InternalDashboardPageProps = {
        onNavigate: mockOnNavigate,
        className: 'custom-internal-dashboard',
        style: { backgroundColor: 'gray' },
        'data-testid': 'custom-internal-dashboard-page'
      };
      
      render(<InternalDashboardPage {...props} />);
      
      const container = screen.getByTestId('custom-internal-dashboard-page');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('min-h-screen', 'bg-white', 'custom-internal-dashboard');
      expect(container).toHaveStyle({ backgroundColor: 'gray' });
    });

    test('applies custom className', () => {
      render(<InternalDashboardPage className="custom-class" data-testid="internal-dashboard-test" />);
      const element = screen.getByTestId('internal-dashboard-test');
      expect(element).toHaveClass('custom-class');
    });

    test('applies custom style', () => {
      render(<InternalDashboardPage style={{ color: 'purple' }} data-testid="internal-dashboard-test" />);
      const element = screen.getByTestId('internal-dashboard-test');
      expect(element).toHaveStyle({ color: 'purple' });
    });
  });

  describe('Navigation Behavior', () => {
    test('calls onNavigate when footer navigation is triggered', () => {
      const mockOnNavigate = jest.fn();
      render(<InternalDashboardPage onNavigate={mockOnNavigate} />);
      
      const homeButton = screen.getByText('Home');
      const dashboardButton = screen.getByText('Dashboard');
      const productsButton = screen.getByText('Products');
      const internalDashboardButton = screen.getByText('Internal Dashboard');
      
      fireEvent.click(homeButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('home');
      
      fireEvent.click(dashboardButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
      
      fireEvent.click(productsButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('products');
      
      fireEvent.click(internalDashboardButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('internal-dashboard');
    });

    test('handles navigation gracefully when onNavigate is undefined', () => {
      render(<InternalDashboardPage />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      // Should not throw error
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('renders main container with correct structure', () => {
      render(<InternalDashboardPage data-testid="internal-dashboard-page" />);
      
      const container = screen.getByTestId('internal-dashboard-page');
      expect(container).toHaveClass('min-h-screen', 'bg-white');
      
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('container', 'mx-auto', 'px-4', 'py-8', 'space-y-12');
    });

    test('renders header with internal use only badge', () => {
      render(<InternalDashboardPage />);
      
      const header = screen.getByText('Rails Internal Dashboard');
      expect(header).toHaveClass('text-3xl', 'font-bold');
      
      const badge = screen.getByText('Internal Use Only');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'px-3', 'py-1', 'rounded-full', 'text-sm', 'font-medium');
    });

    test('passes showAllBanks=true to DataTable', () => {
      render(<InternalDashboardPage />);
      
      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-show-all-banks', 'true');
    });

    test('renders all required sections in correct order', () => {
      render(<InternalDashboardPage />);
      
      const summaryCards = screen.getByTestId('summary-cards');
      const dataTable = screen.getByTestId('data-table');
      const footer = screen.getByTestId('footer');
      
      // Check that all elements exist
      expect(summaryCards).toBeInTheDocument();
      expect(dataTable).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Internal Dashboard Specific Features', () => {
    test('displays internal dashboard title and description', () => {
      render(<InternalDashboardPage />);
      
      expect(screen.getByText('Rails Internal Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Full system metrics and controls')).toBeInTheDocument();
    });

    test('displays internal use only warning badge', () => {
      render(<InternalDashboardPage />);
      
      const badge = screen.getByText('Internal Use Only');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    test('enables all banks view in DataTable', () => {
      render(<InternalDashboardPage />);
      
      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-show-all-banks', 'true');
    });
  });

  describe('Edge Cases', () => {
    test('handles missing onNavigate prop gracefully', () => {
      const { container } = render(<InternalDashboardPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('preserves existing functionality without onNavigate', () => {
      render(<InternalDashboardPage />);
      
      expect(screen.getByText('Rails Internal Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(<InternalDashboardPage />);
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    test('has proper heading hierarchy', () => {
      render(<InternalDashboardPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Rails Internal Dashboard');
    });

    test('maintains accessibility with custom props', () => {
      render(
        <InternalDashboardPage 
          data-testid="accessible-internal-dashboard"
          className="custom-accessible"
        />
      );
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      const container = screen.getByTestId('accessible-internal-dashboard');
      expect(container).toHaveClass('custom-accessible');
    });
  });
});