import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ProductsPage } from './ProductsPage';
import type { ProductsPageProps } from './ProductsPage.interface';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components to focus on ProductsPage logic
jest.mock('../../organisms/Footer', () => ({
  Footer: ({ onNavigate }: { onNavigate?: (page: string) => void }) => (
    <footer data-testid="footer">
      <button onClick={() => onNavigate?.('home')}>Home</button>
      <button onClick={() => onNavigate?.('dashboard')}>Dashboard</button>
    </footer>
  ),
}));

jest.mock('../../atoms/ScrollReveal', () => ({
  ScrollReveal: ({ children }: any) => <div data-testid="scroll-reveal">{children}</div>,
  StaggeredReveal: ({ children }: any) => <div data-testid="staggered-reveal">{children}</div>,
}));

describe('ProductsPage', () => {
  describe('Public Interface Validation', () => {
    test('should render with required props', () => {
      render(<ProductsPage />);
      expect(screen.getByTestId('products-page')).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      const onNavigate = jest.fn();
      const customClassName = 'custom-products-page';
      const customStyle = { backgroundColor: 'orange' };
      
      render(
        <ProductsPage
          onNavigate={onNavigate}
          className={customClassName}
          style={customStyle}
          data-testid="custom-products-page"
        />
      );
      
      const productsPage = screen.getByTestId('custom-products-page');
      expect(productsPage).toBeInTheDocument();
      expect(productsPage).toHaveClass(customClassName);
      expect(productsPage).toHaveStyle('background-color: orange');
    });

    test('should render with custom data-testid', () => {
      render(<ProductsPage data-testid="custom-test-id" />);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    test('should render hero content', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByText('Enterprise-grade financial infrastructure solutions designed for the modern economy. Build faster, scale effortlessly, and focus on what matters most.')).toBeInTheDocument();
    });

    test('should render hero CTA buttons', () => {
      render(<ProductsPage />);
      
      expect(screen.getByRole('button', { name: /compare products/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /schedule demo/i })).toBeInTheDocument();
    });
  });

  describe('Products Overview Section', () => {
    test('should render Weekend Settlements product', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Weekend Settlements')).toBeInTheDocument();
      expect(screen.getByText('Process transactions from South Africa\'s top 4 banks during weekends when traditional banking systems are offline.')).toBeInTheDocument();
      expect(screen.getByText('Live Now')).toBeInTheDocument();
    });

    test('should render Weekend Settlements features', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Real-time Processing')).toBeInTheDocument();
      expect(screen.getByText('Webhook Integration')).toBeInTheDocument();
      expect(screen.getByText('Reserve Management')).toBeInTheDocument();
      expect(screen.getByText('Monday Clearing')).toBeInTheDocument();
    });

    test('should render Weekend Settlements metrics', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('99.2%')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('<1.2s')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
    });

    test('should render Weekend Settlements action buttons', () => {
      render(<ProductsPage />);
      
      expect(screen.getByRole('button', { name: /get started today/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view documentation/i })).toBeInTheDocument();
    });

    test('should render Bank-as-a-Service product', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Bank-as-a-Service')).toBeInTheDocument();
      expect(screen.getByText('Complete banking infrastructure for startups with banking licenses. Launch products faster with our white-label solution.')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    test('should render Bank-as-a-Service features', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Core Banking System')).toBeInTheDocument();
      expect(screen.getByText('Compliance Built-in')).toBeInTheDocument();
      expect(screen.getByText('White-label Ready')).toBeInTheDocument();
      expect(screen.getByText('Instant Scaling')).toBeInTheDocument();
    });

    test('should render Bank-as-a-Service metrics', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('6 months')).toBeInTheDocument();
      expect(screen.getByText('Faster Launch')).toBeInTheDocument();
      expect(screen.getByText('∞')).toBeInTheDocument();
      expect(screen.getByText('Scale Limit')).toBeInTheDocument();
    });

    test('should render Bank-as-a-Service action buttons', () => {
      render(<ProductsPage />);
      
      expect(screen.getByRole('button', { name: /join waitlist/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request early access/i })).toBeInTheDocument();
    });
  });

  describe('Detailed Product Information Section', () => {
    test('should render product deep dive section', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Product Deep Dive')).toBeInTheDocument();
      expect(screen.getByText('Technical specifications and implementation details for each product')).toBeInTheDocument();
    });

    test('should render tabs for both products', () => {
      render(<ProductsPage />);
      
      // Tab triggers
      expect(screen.getByRole('tab', { name: /weekend settlements/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /bank-as-a-service/i })).toBeInTheDocument();
    });

    test('should render Weekend Settlements tab content by default', () => {
      render(<ProductsPage />);
      
      // API Integration section
      expect(screen.getByText('API Integration')).toBeInTheDocument();
      expect(screen.getByText('Simple REST API calls to process weekend settlements')).toBeInTheDocument();
      
      // Connected Banks section
      expect(screen.getByText('Connected Banks')).toBeInTheDocument();
      expect(screen.getByText('Direct integrations with South Africa\'s major banks')).toBeInTheDocument();
      
      // Pricing section
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Transparent pricing with no hidden fees')).toBeInTheDocument();
    });

    test('should render bank information', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('First National Bank')).toBeInTheDocument();
      expect(screen.getByText('ABSA Bank')).toBeInTheDocument();
      expect(screen.getByText('Standard Bank')).toBeInTheDocument();
      expect(screen.getByText('Nedbank')).toBeInTheDocument();
    });

    test('should render pricing information', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Transaction Fee')).toBeInTheDocument();
      expect(screen.getByText('1%')).toBeInTheDocument();
      expect(screen.getByText('Setup Fee')).toBeInTheDocument();
      expect(screen.getByText('R0')).toBeInTheDocument();
      expect(screen.getByText('Monthly Fee')).toBeInTheDocument();
    });

    test('should switch to Bank-as-a-Service tab content when clicked', async () => {
      render(<ProductsPage />);
      
      const baasTab = screen.getByRole('tab', { name: /bank-as-a-service/i });
      await userEvent.click(baasTab);
      
      // Use Cases section
      expect(screen.getByText('Use Cases')).toBeInTheDocument();
      expect(screen.getByText('Perfect for various types of financial institutions')).toBeInTheDocument();
      
      // Integration Process section
      expect(screen.getByText('Integration Process')).toBeInTheDocument();
      expect(screen.getByText('Get up and running in 4 simple steps')).toBeInTheDocument();
      
      // Coming Soon section
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText('Bank-as-a-Service will be available Q2 2025')).toBeInTheDocument();
    });

    test('should render use cases for Bank-as-a-Service', async () => {
      render(<ProductsPage />);
      
      const baasTab = screen.getByRole('tab', { name: /bank-as-a-service/i });
      await userEvent.click(baasTab);
      
      expect(screen.getByText('Fintech Startups')).toBeInTheDocument();
      expect(screen.getByText('Digital Banks')).toBeInTheDocument();
      expect(screen.getByText('Payment Processors')).toBeInTheDocument();
    });

    test('should render integration steps for Bank-as-a-Service', async () => {
      render(<ProductsPage />);
      
      const baasTab = screen.getByRole('tab', { name: /bank-as-a-service/i });
      await userEvent.click(baasTab);
      
      expect(screen.getByText('API Integration')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('Go Live')).toBeInTheDocument();
    });

    test('should render early access program benefits', async () => {
      render(<ProductsPage />);
      
      const baasTab = screen.getByRole('tab', { name: /bank-as-a-service/i });
      await userEvent.click(baasTab);
      
      expect(screen.getByText('Early Access Program')).toBeInTheDocument();
      expect(screen.getByText('30-day free trial')).toBeInTheDocument();
      expect(screen.getByText('Dedicated technical support')).toBeInTheDocument();
      expect(screen.getByText('Custom feature requests')).toBeInTheDocument();
      expect(screen.getByText('Preferred pricing')).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    test('should render final CTA section', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
      expect(screen.getByText('Choose the product that fits your needs and start building today.')).toBeInTheDocument();
    });

    test('should render final CTA buttons', () => {
      render(<ProductsPage />);
      
      expect(screen.getByRole('button', { name: /start with weekend settlements/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /join baas waitlist/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Handling', () => {
    test('should handle navigation prop correctly', () => {
      const onNavigate = jest.fn();
      render(<ProductsPage onNavigate={onNavigate} />);
      
      // Footer should receive the onNavigate prop
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should handle missing onNavigate prop gracefully', () => {
      expect(() => {
        render(<ProductsPage />);
      }).not.toThrow();
      
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should handle footer navigation', async () => {
      const onNavigate = jest.fn();
      render(<ProductsPage onNavigate={onNavigate} />);
      
      const homeButton = screen.getByRole('button', { name: 'Home' });
      await userEvent.click(homeButton);
      
      expect(onNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('Component Integration', () => {
    test('should render Footer component', () => {
      render(<ProductsPage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should render ScrollReveal components', () => {
      render(<ProductsPage />);
      const scrollRevealElements = screen.getAllByTestId('scroll-reveal');
      expect(scrollRevealElements.length).toBeGreaterThan(0);
    });

    test('should render StaggeredReveal components', () => {
      render(<ProductsPage />);
      const staggeredRevealElements = screen.getAllByTestId('staggered-reveal');
      expect(staggeredRevealElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('should have proper semantic structure', () => {
      render(<ProductsPage />);
      
      // Check for sections
      const sections = screen.getAllByRole('generic'); // sections without explicit role
      expect(sections.length).toBeGreaterThan(0);
      
      // Check for buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check for tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(2);
    });

    test('should have accessible button text', () => {
      render(<ProductsPage />);
      
      const compareButton = screen.getByRole('button', { name: /compare products/i });
      const demoButton = screen.getByRole('button', { name: /schedule demo/i });
      
      expect(compareButton).toBeInTheDocument();
      expect(demoButton).toBeInTheDocument();
    });

    test('should have proper tab navigation', async () => {
      render(<ProductsPage />);
      
      const weekendTab = screen.getByRole('tab', { name: /weekend settlements/i });
      const baasTab = screen.getByRole('tab', { name: /bank-as-a-service/i });
      
      // Should be able to navigate between tabs
      expect(weekendTab).toBeInTheDocument();
      expect(baasTab).toBeInTheDocument();
      
      await userEvent.click(baasTab);
      await userEvent.click(weekendTab);
      
      // Should not throw errors during navigation
    });
  });

  describe('Edge Cases', () => {
    test('should handle null className gracefully', () => {
      render(<ProductsPage className={undefined} />);
      const productsPage = screen.getByTestId('products-page');
      
      expect(productsPage).toHaveClass('min-h-screen');
    });

    test('should handle null style gracefully', () => {
      render(<ProductsPage style={undefined} />);
      expect(screen.getByTestId('products-page')).toBeInTheDocument();
    });

    test('should handle button clicks without handlers', () => {
      render(<ProductsPage />);
      
      const compareButton = screen.getByRole('button', { name: /compare products/i });
      
      // Should not throw when clicking without specific handlers
      expect(() => {
        fireEvent.click(compareButton);
      }).not.toThrow();
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive classes', () => {
      render(<ProductsPage />);
      const productsPage = screen.getByTestId('products-page');
      
      expect(productsPage).toHaveClass('min-h-screen');
    });

    test('should handle custom className with responsive design', () => {
      render(<ProductsPage className="lg:px-8" />);
      const productsPage = screen.getByTestId('products-page');
      
      expect(productsPage).toHaveClass('lg:px-8');
      expect(productsPage).toHaveClass('min-h-screen');
    });
  });

  describe('Content Accuracy', () => {
    test('should display correct bank statistics', () => {
      render(<ProductsPage />);
      
      // Check specific bank statistics
      expect(screen.getByText('1.2M+')).toBeInTheDocument(); // FNB transactions
      expect(screen.getByText('980K+')).toBeInTheDocument(); // ABSA transactions
      expect(screen.getByText('1.5M+')).toBeInTheDocument(); // Standard Bank transactions
      expect(screen.getByText('750K+')).toBeInTheDocument(); // Nedbank transactions
    });

    test('should display correct uptime values', () => {
      render(<ProductsPage />);
      
      const uptimeElements = screen.getAllByText(/99\.[7-9]%/);
      expect(uptimeElements.length).toBeGreaterThanOrEqual(3); // Multiple banks with high uptime
    });

    test('should show all Live status badges for banks', () => {
      render(<ProductsPage />);
      
      const liveStatuses = screen.getAllByText('Live');
      expect(liveStatuses.length).toBeGreaterThanOrEqual(4); // At least 4 banks are live
    });
  });
});