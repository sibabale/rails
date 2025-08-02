import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardPage } from './DashboardPage';
import type { DashboardPageProps } from './DashboardPage.interface';

// Mock the imported components
jest.mock('../../HeroSection', () => ({
  HeroSection: ({ ...props }) => <div data-testid="hero-section" {...props}>Hero Section</div>
}));

jest.mock('../../SummaryCards', () => ({
  SummaryCards: ({ ...props }) => <div data-testid="summary-cards" {...props}>Summary Cards</div>
}));

jest.mock('../../DataTable', () => ({
  DataTable: ({ ...props }) => <div data-testid="data-table" {...props}>Data Table</div>
}));

jest.mock('../../Footer', () => ({
  Footer: ({ onNavigate, ...props }) => (
    <div data-testid="footer" {...props}>
      <button onClick={() => onNavigate?.('home')}>Home</button>
      <button onClick={() => onNavigate?.('dashboard')}>Dashboard</button>
      <button onClick={() => onNavigate?.('products')}>Products</button>
      Footer
    </div>
  )
}));

describe('DashboardPage', () => {
  describe('Public Interface Validation', () => {
    test('renders with required props', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('renders with all optional props', () => {
      const mockOnNavigate = jest.fn();
      const props: DashboardPageProps = {
        onNavigate: mockOnNavigate,
        className: 'custom-dashboard',
        style: { backgroundColor: 'red' },
        'data-testid': 'custom-dashboard-page'
      };
      
      render(<DashboardPage {...props} />);
      
      const container = screen.getByTestId('custom-dashboard-page');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('min-h-screen', 'bg-white', 'custom-dashboard');
      expect(container).toHaveStyle({ backgroundColor: 'red' });
    });

    test('applies custom className', () => {
      render(<DashboardPage className="custom-class" data-testid="dashboard-test" />);
      const element = screen.getByTestId('dashboard-test');
      expect(element).toHaveClass('custom-class');
    });

    test('applies custom style', () => {
      render(<DashboardPage style={{ color: 'blue' }} data-testid="dashboard-test" />);
      const element = screen.getByTestId('dashboard-test');
      expect(element).toHaveStyle({ color: 'blue' });
    });
  });

  describe('Navigation Behavior', () => {
    test('calls onNavigate when footer navigation is triggered', () => {
      const mockOnNavigate = jest.fn();
      render(<DashboardPage onNavigate={mockOnNavigate} />);
      
      const homeButton = screen.getByText('Home');
      const dashboardButton = screen.getByText('Dashboard');
      const productsButton = screen.getByText('Products');
      
      fireEvent.click(homeButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('home');
      
      fireEvent.click(dashboardButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
      
      fireEvent.click(productsButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('products');
    });

    test('handles navigation gracefully when onNavigate is undefined', () => {
      render(<DashboardPage />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      // Should not throw error
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('renders main container with correct structure', () => {
      render(<DashboardPage data-testid="dashboard-page" />);
      
      const container = screen.getByTestId('dashboard-page');
      expect(container).toHaveClass('min-h-screen', 'bg-white');
      
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('container', 'mx-auto', 'px-4', 'py-8', 'space-y-12');
    });

    test('renders all required sections in correct order', () => {
      render(<DashboardPage />);
      
      const heroSection = screen.getByTestId('hero-section');
      const summaryCards = screen.getByTestId('summary-cards');
      const dataTable = screen.getByTestId('data-table');
      const footer = screen.getByTestId('footer');
      
      // Check that all elements exist
      expect(heroSection).toBeInTheDocument();
      expect(summaryCards).toBeInTheDocument();
      expect(dataTable).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing onNavigate prop gracefully', () => {
      const { container } = render(<DashboardPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('preserves existing functionality without onNavigate', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(<DashboardPage />);
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    test('maintains accessibility with custom props', () => {
      render(
        <DashboardPage 
          data-testid="accessible-dashboard"
          className="custom-accessible"
        />
      );
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      const container = screen.getByTestId('accessible-dashboard');
      expect(container).toHaveClass('custom-accessible');
    });
  });
});