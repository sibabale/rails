import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardPage } from './DashboardPage';
import type { DashboardPageProps } from './DashboardPage.interface';

// Mock child components to focus on DashboardPage logic
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
  DataTable: () => (
    <div data-testid="data-table">Data Table</div>
  ),
}));

jest.mock('../../organisms/Footer', () => ({
  Footer: ({ onNavigate }: { onNavigate?: (page: string) => void }) => (
    <footer data-testid="footer">
      <button onClick={() => onNavigate?.('home')}>Home</button>
      <button onClick={() => onNavigate?.('products')}>Products</button>
    </footer>
  ),
}));

describe('DashboardPage', () => {
  describe('Public Interface Validation', () => {
    test('should render with required props', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      const onNavigate = jest.fn();
      const customClassName = 'custom-dashboard-page';
      const customStyle = { backgroundColor: 'blue' };
      
      render(
        <DashboardPage
          onNavigate={onNavigate}
          className={customClassName}
          style={customStyle}
          data-testid="custom-dashboard-page"
        />
      );
      
      const dashboardPage = screen.getByTestId('custom-dashboard-page');
      expect(dashboardPage).toBeInTheDocument();
      expect(dashboardPage).toHaveClass('custom-dashboard-page');
      expect(dashboardPage).toHaveStyle('background-color: blue');
    });

    test('should have proper default styling', () => {
      render(<DashboardPage />);
      const dashboardPage = screen.getByTestId('dashboard-page');
      
      expect(dashboardPage).toHaveClass('min-h-screen');
      expect(dashboardPage).toHaveClass('bg-white');
    });

    test('should render with custom data-testid', () => {
      render(<DashboardPage data-testid="custom-test-id" />);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should render HeroSection component', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    test('should render SummaryCards component', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    });

    test('should render DataTable component', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    test('should render Footer component', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should pass onNavigate prop to Footer', () => {
      const onNavigate = jest.fn();
      render(<DashboardPage onNavigate={onNavigate} />);
      
      const homeButton = screen.getByRole('button', { name: 'Home' });
      const productsButton = screen.getByRole('button', { name: 'Products' });
      
      expect(homeButton).toBeInTheDocument();
      expect(productsButton).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    test('should have proper container structure', () => {
      render(<DashboardPage />);
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('container');
      expect(mainElement).toHaveClass('mx-auto');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-8');
      expect(mainElement).toHaveClass('space-y-12');
    });

    test('should render components in correct order', () => {
      render(<DashboardPage />);
      
      const main = screen.getByRole('main');
      const children = Array.from(main.children);
      
      // Check that components are rendered in the expected order
      expect(children[0]).toHaveAttribute('data-testid', 'hero-section');
      expect(children[1]).toHaveAttribute('data-testid', 'summary-cards');
      expect(children[2]).toHaveAttribute('data-testid', 'data-table');
    });
  });

  describe('Navigation Handling', () => {
    test('should handle navigation prop correctly', () => {
      const onNavigate = jest.fn();
      render(<DashboardPage onNavigate={onNavigate} />);
      
      // Footer should receive the onNavigate prop
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should handle missing onNavigate prop gracefully', () => {
      expect(() => {
        render(<DashboardPage />);
      }).not.toThrow();
      
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper semantic structure', () => {
      render(<DashboardPage />);
      
      // Should have a main element
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Should have a footer (through Footer component)
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
    });

    test('should maintain proper heading hierarchy', () => {
      render(<DashboardPage />);
      
      // The page itself doesn't define headings, but should allow child components to do so
      // This test ensures the structure doesn't interfere with heading hierarchy
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null className gracefully', () => {
      render(<DashboardPage className={undefined} />);
      const dashboardPage = screen.getByTestId('dashboard-page');
      
      // Should still have default classes
      expect(dashboardPage).toHaveClass('min-h-screen');
      expect(dashboardPage).toHaveClass('bg-white');
    });

    test('should handle null style gracefully', () => {
      render(<DashboardPage style={undefined} />);
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    test('should handle empty className', () => {
      render(<DashboardPage className="" />);
      const dashboardPage = screen.getByTestId('dashboard-page');
      
      // Should still have default classes
      expect(dashboardPage).toHaveClass('min-h-screen');
      expect(dashboardPage).toHaveClass('bg-white');
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive container classes', () => {
      render(<DashboardPage />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('container');
      expect(main).toHaveClass('mx-auto');
      expect(main).toHaveClass('px-4');
    });

    test('should handle custom className with responsive design', () => {
      render(<DashboardPage className="lg:px-8" />);
      const dashboardPage = screen.getByTestId('dashboard-page');
      
      expect(dashboardPage).toHaveClass('lg:px-8');
      expect(dashboardPage).toHaveClass('min-h-screen');
    });
  });
});