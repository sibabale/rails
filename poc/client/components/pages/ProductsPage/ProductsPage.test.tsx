import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductsPage } from './ProductsPage';
import type { ProductsPageProps } from './ProductsPage.interface';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the imported components
jest.mock('../../ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} data-testid="button" {...props}>
      {children}
    </button>
  )
}));

jest.mock('../../ui/card', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <div data-testid="card-title" {...props}>{children}</div>,
}));

jest.mock('../../ui/badge', () => ({
  Badge: ({ children, ...props }) => <div data-testid="badge" {...props}>{children}</div>
}));

jest.mock('../../ui/tabs', () => ({
  Tabs: ({ children, ...props }) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsContent: ({ children, ...props }) => <div data-testid="tabs-content" {...props}>{children}</div>,
  TabsList: ({ children, ...props }) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
}));

jest.mock('../../ui/separator', () => ({
  Separator: ({ ...props }) => <div data-testid="separator" {...props} />
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

jest.mock('../../ScrollReveal', () => ({
  ScrollReveal: ({ children, ...props }) => (
    <div data-testid="scroll-reveal" {...props}>{children}</div>
  ),
  StaggeredReveal: ({ children, ...props }) => (
    <div data-testid="staggered-reveal" {...props}>{children}</div>
  )
}));

describe('ProductsPage', () => {
  describe('Public Interface Validation', () => {
    test('renders with required props', () => {
      render(<ProductsPage />);
      
      // Check for main sections
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByText('Weekend Settlements')).toBeInTheDocument();
      expect(screen.getByText('Bank-as-a-Service')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('renders with all optional props', () => {
      const mockOnNavigate = jest.fn();
      const props: ProductsPageProps = {
        onNavigate: mockOnNavigate,
        className: 'custom-products-page',
        style: { backgroundColor: 'lightgreen' },
        'data-testid': 'custom-products-page'
      };
      
      render(<ProductsPage {...props} />);
      
      const container = screen.getByTestId('custom-products-page');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('min-h-screen', 'custom-products-page');
      expect(container).toHaveStyle({ backgroundColor: 'lightgreen' });
    });

    test('applies custom className', () => {
      render(<ProductsPage className="custom-class" data-testid="products-page-test" />);
      const element = screen.getByTestId('products-page-test');
      expect(element).toHaveClass('custom-class');
    });

    test('applies custom style', () => {
      render(<ProductsPage style={{ color: 'orange' }} data-testid="products-page-test" />);
      const element = screen.getByTestId('products-page-test');
      expect(element).toHaveStyle({ color: 'orange' });
    });
  });

  describe('Navigation Behavior', () => {
    test('calls onNavigate when footer navigation is triggered', () => {
      const mockOnNavigate = jest.fn();
      render(<ProductsPage onNavigate={mockOnNavigate} />);
      
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
      render(<ProductsPage />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      // Should not throw error
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    test('displays hero content', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByText(/Enterprise-grade financial infrastructure solutions/)).toBeInTheDocument();
      expect(screen.getByText('Compare Products')).toBeInTheDocument();
      expect(screen.getByText('Schedule Demo')).toBeInTheDocument();
    });
  });

  describe('Products Overview Section', () => {
    test('displays Weekend Settlements product', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Weekend Settlements')).toBeInTheDocument();
      expect(screen.getByText('Live Now')).toBeInTheDocument();
      expect(screen.getByText('99.2%')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('<1.2s')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
    });

    test('displays Bank-as-a-Service product', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Bank-as-a-Service')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText('6 months')).toBeInTheDocument();
      expect(screen.getByText('Faster Launch')).toBeInTheDocument();
      expect(screen.getByText('∞')).toBeInTheDocument();
      expect(screen.getByText('Scale Limit')).toBeInTheDocument();
    });

    test('displays product features', () => {
      render(<ProductsPage />);
      
      // Weekend Settlements features
      expect(screen.getByText('Real-time Processing')).toBeInTheDocument();
      expect(screen.getByText('Webhook Integration')).toBeInTheDocument();
      expect(screen.getByText('Reserve Management')).toBeInTheDocument();
      expect(screen.getByText('Monday Clearing')).toBeInTheDocument();
      
      // BaaS features
      expect(screen.getByText('Core Banking System')).toBeInTheDocument();
      expect(screen.getByText('Compliance Built-in')).toBeInTheDocument();
      expect(screen.getByText('White-label Ready')).toBeInTheDocument();
      expect(screen.getByText('Instant Scaling')).toBeInTheDocument();
    });

    test('displays action buttons', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Get Started Today')).toBeInTheDocument();
      expect(screen.getByText('View Documentation')).toBeInTheDocument();
      expect(screen.getByText('Join Waitlist')).toBeInTheDocument();
      expect(screen.getByText('Request Early Access')).toBeInTheDocument();
    });
  });

  describe('Detailed Product Information Section', () => {
    test('displays product deep dive content', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Product Deep Dive')).toBeInTheDocument();
      expect(screen.getByText(/Technical specifications and implementation details/)).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    test('displays tabs for different products', () => {
      render(<ProductsPage />);
      
      const tabTriggers = screen.getAllByTestId('tabs-trigger');
      expect(tabTriggers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Weekend Settlements Tab Content', () => {
    test('displays API integration section', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('API Integration')).toBeInTheDocument();
      expect(screen.getByText(/Simple REST API calls to process weekend settlements/)).toBeInTheDocument();
    });

    test('displays connected banks section', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Connected Banks')).toBeInTheDocument();
      expect(screen.getByText(/Direct integrations with South Africa's major banks/)).toBeInTheDocument();
      expect(screen.getByText('First National Bank')).toBeInTheDocument();
      expect(screen.getByText('ABSA Bank')).toBeInTheDocument();
      expect(screen.getByText('Standard Bank')).toBeInTheDocument();
      expect(screen.getByText('Nedbank')).toBeInTheDocument();
    });

    test('displays bank statistics', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('1.2M+')).toBeInTheDocument();
      expect(screen.getByText('980K+')).toBeInTheDocument();
      expect(screen.getByText('1.5M+')).toBeInTheDocument();
      expect(screen.getByText('750K+')).toBeInTheDocument();
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('99.8%')).toBeInTheDocument();
      expect(screen.getByText('99.7%')).toBeInTheDocument();
    });

    test('displays pricing information', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText(/Transparent pricing with no hidden fees/)).toBeInTheDocument();
      expect(screen.getByText('Transaction Fee')).toBeInTheDocument();
      expect(screen.getByText('1%')).toBeInTheDocument();
      expect(screen.getByText('Setup Fee')).toBeInTheDocument();
      expect(screen.getByText('R0')).toBeInTheDocument();
      expect(screen.getByText('Monthly Fee')).toBeInTheDocument();
    });
  });

  describe('Bank-as-a-Service Tab Content', () => {
    test('displays use cases section', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Use Cases')).toBeInTheDocument();
      expect(screen.getByText(/Perfect for various types of financial institutions/)).toBeInTheDocument();
      expect(screen.getByText('Fintech Startups')).toBeInTheDocument();
      expect(screen.getByText('Digital Banks')).toBeInTheDocument();
      expect(screen.getByText('Payment Processors')).toBeInTheDocument();
    });

    test('displays integration process', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Integration Process')).toBeInTheDocument();
      expect(screen.getByText(/Get up and running in 4 simple steps/)).toBeInTheDocument();
      expect(screen.getByText('API Integration')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('Go Live')).toBeInTheDocument();
    });

    test('displays coming soon section', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/Bank-as-a-Service will be available Q2 2025/)).toBeInTheDocument();
      expect(screen.getByText('Early Access Program')).toBeInTheDocument();
      expect(screen.getByText('30-day free trial')).toBeInTheDocument();
      expect(screen.getByText('Dedicated technical support')).toBeInTheDocument();
      expect(screen.getByText('Custom feature requests')).toBeInTheDocument();
      expect(screen.getByText('Preferred pricing')).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    test('displays call to action content', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
      expect(screen.getByText(/Choose the product that fits your needs/)).toBeInTheDocument();
      expect(screen.getByText('Start with Weekend Settlements')).toBeInTheDocument();
      expect(screen.getByText('Join BaaS Waitlist')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing onNavigate prop gracefully', () => {
      const { container } = render(<ProductsPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('preserves existing functionality without onNavigate', () => {
      render(<ProductsPage />);
      
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByText('Weekend Settlements')).toBeInTheDocument();
      expect(screen.getByText('Bank-as-a-Service')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(<ProductsPage />);
      
      // Check for sections
      const sections = screen.getAllByRole('generic').filter(el => 
        el.tagName.toLowerCase() === 'section'
      );
      expect(sections.length).toBeGreaterThan(0);
    });

    test('has proper heading hierarchy', () => {
      render(<ProductsPage />);
      
      const mainHeading = screen.getByText('Our Products');
      expect(mainHeading).toBeInTheDocument();
      
      const sectionHeadings = [
        'Product Deep Dive',
        'Ready to Get Started?'
      ];
      
      sectionHeadings.forEach(heading => {
        expect(screen.getByText(heading)).toBeInTheDocument();
      });
    });

    test('maintains accessibility with custom props', () => {
      render(
        <ProductsPage 
          data-testid="accessible-products-page"
          className="custom-accessible"
        />
      );
      
      const container = screen.getByTestId('accessible-products-page');
      expect(container).toHaveClass('custom-accessible');
    });
  });
});