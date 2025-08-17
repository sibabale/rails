import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InternalDashboardPage } from './InternalDashboardPage';
import type { InternalDashboardPageProps } from './InternalDashboardPage.interface';

// Mock child components to focus on InternalDashboardPage logic
jest.mock('../../organisms/HeroSection', () => ({
  HeroSection: () => (
    <section data-testid="hero-section">Hero Section</section>
  ),
}));

jest.mock('../../organisms/SummaryCards', () => ({
  SummaryCards: () => (
    <div data-testid="summary-cards">Summary Cards</div>
  ),
}));

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

describe('InternalDashboardPage', () => {
  describe('Public Interface Validation', () => {
    test('should render with required props', () => {
      render(<InternalDashboardPage />);
      expect(screen.getByTestId('internal-dashboard-page')).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      const onNavigate = jest.fn();
      const customClassName = 'custom-internal-dashboard-page';
      const customStyle = { backgroundColor: 'purple' };
      
      render(
        <InternalDashboardPage
          onNavigate={onNavigate}
          className={customClassName}
          style={customStyle}
          data-testid="custom-internal-dashboard-page"
        />
      );
      
      const dashboardPage = screen.getByTestId('custom-internal-dashboard-page');
      expect(dashboardPage).toBeInTheDocument();
      expect(dashboardPage).toHaveClass(customClassName);
      expect(dashboardPage).toHaveStyle('background-color: purple');
    });

    test('should have proper default styling', () => {
      render(<InternalDashboardPage />);
      const dashboardPage = screen.getByTestId('internal-dashboard-page');
      
      expect(dashboardPage).toHaveClass('min-h-screen');
      expect(dashboardPage).toHaveClass('bg-white');
    });

    test('should render with custom data-testid', () => {
      render(<InternalDashboardPage data-testid="custom-test-id" />);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Header Content', () => {
    test('should display internal dashboard title', () => {
      render(<InternalDashboardPage />);
      
      expect(screen.getByText('Rails Internal Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Rails Internal Dashboard' })).toBeInTheDocument();
    });

    test('should display dashboard description', () => {
      render(<InternalDashboardPage />);
      
      expect(screen.getByText('Full system metrics and controls')).toBeInTheDocument();
    });

    test('should display internal use only badge', () => {
      render(<InternalDashboardPage />);
      
      const badge = screen.getByText('Internal Use Only');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('text-sm');
      expect(badge).toHaveClass('font-medium');
    });
  });

  describe('Component Integration', () => {
    test('should render SummaryCards component', () => {
      render(<InternalDashboardPage />);
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    });

    test('should render DataTable component with showAllBanks=true', () => {
      render(<InternalDashboardPage />);
      
      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toBeInTheDocument();
      expect(dataTable).toHaveAttribute('data-show-all-banks', 'true');
    });

    test('should render Footer component', () => {
      render(<InternalDashboardPage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should pass onNavigate prop to Footer', () => {
      const onNavigate = jest.fn();
      render(<InternalDashboardPage onNavigate={onNavigate} />);
      
      const homeButton = screen.getByRole('button', { name: 'Home' });
      const productsButton = screen.getByRole('button', { name: 'Products' });
      const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
      
      expect(homeButton).toBeInTheDocument();
      expect(productsButton).toBeInTheDocument();
      expect(dashboardButton).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    test('should have proper container structure', () => {
      render(<InternalDashboardPage />);
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('container');
      expect(mainElement).toHaveClass('mx-auto');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-8');
      expect(mainElement).toHaveClass('space-y-12');
    });

    test('should have proper header layout', () => {
      render(<InternalDashboardPage />);
      
      const main = screen.getByRole('main');
      const headerDiv = main.firstElementChild;
      
      expect(headerDiv).toHaveClass('flex');
      expect(headerDiv).toHaveClass('items-center');
      expect(headerDiv).toHaveClass('justify-between');
    });

    test('should render components in correct order', () => {
      render(<InternalDashboardPage />);
      
      const main = screen.getByRole('main');
      const children = Array.from(main.children);
      
      // Check that components are rendered in the expected order
      // 1. Header div with title and badge
      expect(children[0]).toHaveClass('flex', 'items-center', 'justify-between');
      // 2. SummaryCards
      expect(children[1]).toHaveAttribute('data-testid', 'summary-cards');
      // 3. DataTable
      expect(children[2]).toHaveAttribute('data-testid', 'data-table');
    });
  });

  describe('Navigation Handling', () => {
    test('should handle navigation prop correctly', () => {
      const onNavigate = jest.fn();
      render(<InternalDashboardPage onNavigate={onNavigate} />);
      
      // Footer should receive the onNavigate prop
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should handle missing onNavigate prop gracefully', () => {
      expect(() => {
        render(<InternalDashboardPage />);
      }).not.toThrow();
      
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper semantic structure', () => {
      render(<InternalDashboardPage />);
      
      // Should have a main element
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Should have proper heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      
      // Should have a footer (through Footer component)
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
    });

    test('should have accessible heading hierarchy', () => {
      render(<InternalDashboardPage />);
      
      // Should have h1 for main title
      const h1 = screen.getByRole('heading', { level: 1, name: 'Rails Internal Dashboard' });
      expect(h1).toBeInTheDocument();
    });

    test('should have meaningful text content', () => {
      render(<InternalDashboardPage />);
      
      // All text content should be meaningful and accessible
      expect(screen.getByText('Rails Internal Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Full system metrics and controls')).toBeInTheDocument();
      expect(screen.getByText('Internal Use Only')).toBeInTheDocument();
    });
  });

  describe('Distinctive Features', () => {
    test('should be distinguishable from regular DashboardPage', () => {
      render(<InternalDashboardPage />);
      
      // Should have unique title
      expect(screen.getByText('Rails Internal Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument(); // Should not have generic "Dashboard" title
      
      // Should have internal use only badge
      expect(screen.getByText('Internal Use Only')).toBeInTheDocument();
      
      // Should show all banks in DataTable
      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-show-all-banks', 'true');
    });

    test('should indicate internal access level', () => {
      render(<InternalDashboardPage />);
      
      const badge = screen.getByText('Internal Use Only');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800'); // Warning colors
    });
  });

  describe('Edge Cases', () => {
    test('should handle null className gracefully', () => {
      render(<InternalDashboardPage className={undefined} />);
      const dashboardPage = screen.getByTestId('internal-dashboard-page');
      
      // Should still have default classes
      expect(dashboardPage).toHaveClass('min-h-screen');
      expect(dashboardPage).toHaveClass('bg-white');
    });

    test('should handle null style gracefully', () => {
      render(<InternalDashboardPage style={undefined} />);
      expect(screen.getByTestId('internal-dashboard-page')).toBeInTheDocument();
    });

    test('should handle empty className', () => {
      render(<InternalDashboardPage className="" />);
      const dashboardPage = screen.getByTestId('internal-dashboard-page');
      
      // Should still have default classes
      expect(dashboardPage).toHaveClass('min-h-screen');
      expect(dashboardPage).toHaveClass('bg-white');
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive container classes', () => {
      render(<InternalDashboardPage />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('container');
      expect(main).toHaveClass('mx-auto');
      expect(main).toHaveClass('px-4');
    });

    test('should handle custom className with responsive design', () => {
      render(<InternalDashboardPage className="lg:px-8" />);
      const dashboardPage = screen.getByTestId('internal-dashboard-page');
      
      expect(dashboardPage).toHaveClass('lg:px-8');
      expect(dashboardPage).toHaveClass('min-h-screen');
    });

    test('should have responsive header layout', () => {
      render(<InternalDashboardPage />);
      
      // The header should be flex with proper spacing
      const main = screen.getByRole('main');
      const headerDiv = main.firstElementChild;
      
      expect(headerDiv).toHaveClass('flex');
      expect(headerDiv).toHaveClass('items-center');
      expect(headerDiv).toHaveClass('justify-between');
    });
  });
});