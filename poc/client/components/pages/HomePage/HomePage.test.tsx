import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomePage } from './HomePage';
import type { HomePageProps } from './HomePage.interface';

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

jest.mock('../../figma/ImageWithFallback', () => ({
  ImageWithFallback: ({ ...props }) => <div data-testid="image-with-fallback" {...props}>Image</div>
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

jest.mock('../../AnimatedCounter', () => ({
  AnimatedCounter: ({ to, format, ...props }) => (
    <span data-testid="animated-counter" data-to={to} {...props}>
      {typeof format === 'function' ? format(to) : to}
    </span>
  ),
  percentageFormatter: (decimals = 0) => (value) => `${value.toFixed(decimals)}%`
}));

jest.mock('../../ScrollReveal', () => ({
  ScrollReveal: ({ children, ...props }) => (
    <div data-testid="scroll-reveal" {...props}>{children}</div>
  ),
  StaggeredReveal: ({ children, ...props }) => (
    <div data-testid="staggered-reveal" {...props}>{children}</div>
  )
}));

jest.mock('../../InteractiveApiSection', () => ({
  InteractiveApiSection: ({ ...props }) => (
    <div data-testid="interactive-api-section" {...props}>Interactive API Section</div>
  )
}));

describe('HomePage', () => {
  describe('Public Interface Validation', () => {
    test('renders with required props', () => {
      render(<HomePage />);
      
      // Check for main sections
      expect(screen.getByText('Financial Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('That Just Works')).toBeInTheDocument();
      expect(screen.getByText('Why Choose Rails?')).toBeInTheDocument();
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('renders with all optional props', () => {
      const mockOnNavigate = jest.fn();
      const props: HomePageProps = {
        onNavigate: mockOnNavigate,
        className: 'custom-home-page',
        style: { backgroundColor: 'lightblue' },
        'data-testid': 'custom-home-page'
      };
      
      render(<HomePage {...props} />);
      
      const container = screen.getByTestId('custom-home-page');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('min-h-screen', 'custom-home-page');
      expect(container).toHaveStyle({ backgroundColor: 'lightblue' });
    });

    test('applies custom className', () => {
      render(<HomePage className="custom-class" data-testid="home-page-test" />);
      const element = screen.getByTestId('home-page-test');
      expect(element).toHaveClass('custom-class');
    });

    test('applies custom style', () => {
      render(<HomePage style={{ color: 'red' }} data-testid="home-page-test" />);
      const element = screen.getByTestId('home-page-test');
      expect(element).toHaveStyle({ color: 'red' });
    });
  });

  describe('Navigation Behavior', () => {
    test('calls onNavigate when footer navigation is triggered', () => {
      const mockOnNavigate = jest.fn();
      render(<HomePage onNavigate={mockOnNavigate} />);
      
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

    test('handles products navigation when Learn More buttons are clicked', () => {
      const mockOnNavigate = jest.fn();
      render(<HomePage onNavigate={mockOnNavigate} />);
      
      const learnMoreButtons = screen.getAllByText('Learn More');
      if (learnMoreButtons.length > 0) {
        fireEvent.click(learnMoreButtons[0]);
        expect(mockOnNavigate).toHaveBeenCalledWith('products');
      }
    });

    test('handles navigation gracefully when onNavigate is undefined', () => {
      render(<HomePage />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      // Should not throw error
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    test('displays main hero content', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Powering Financial Innovation in South Africa')).toBeInTheDocument();
      expect(screen.getByText('Financial Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('That Just Works')).toBeInTheDocument();
      expect(screen.getByText(/Build banking products without the complexity/)).toBeInTheDocument();
    });

    test('displays action buttons', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Start Building Today')).toBeInTheDocument();
      expect(screen.getByText('View Documentation')).toBeInTheDocument();
    });

    test('displays animated counters', () => {
      render(<HomePage />);
      
      const animatedCounters = screen.getAllByTestId('animated-counter');
      expect(animatedCounters.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Uptime SLA')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Banks Supported')).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    test('displays feature cards', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Why Choose Rails?')).toBeInTheDocument();
      expect(screen.getByText('Scale with Confidence')).toBeInTheDocument();
      expect(screen.getByText('Compliance & Security')).toBeInTheDocument();
      expect(screen.getByText('Resilient & Reliable')).toBeInTheDocument();
    });

    test('displays feature descriptions', () => {
      render(<HomePage />);
      
      expect(screen.getByText(/Modern infrastructure built to handle millions/)).toBeInTheDocument();
      expect(screen.getByText(/Full AML, KYC, and regulatory compliance/)).toBeInTheDocument();
      expect(screen.getByText(/99.9% uptime SLA with redundant systems/)).toBeInTheDocument();
    });
  });

  describe('Products Section', () => {
    test('displays product information', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByText('Weekend Settlements')).toBeInTheDocument();
      expect(screen.getByText('Bank-as-a-Service')).toBeInTheDocument();
    });

    test('displays product badges', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Live Now')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    test('displays product features', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Real-time webhook notifications')).toBeInTheDocument();
      expect(screen.getByText('99.2% transaction success rate')).toBeInTheDocument();
      expect(screen.getByText('Complete core banking system')).toBeInTheDocument();
      expect(screen.getByText('White-label ready')).toBeInTheDocument();
    });
  });



  describe('Interactive API Section', () => {
    test('includes interactive API section', () => {
      render(<HomePage />);
      
      expect(screen.getByTestId('interactive-api-section')).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    test('displays call to action content', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Ready to Build the Future of Finance?')).toBeInTheDocument();
      expect(screen.getByText(/Join leading fintechs who trust Rails/)).toBeInTheDocument();
      expect(screen.getByText('Get Started Free')).toBeInTheDocument();
      expect(screen.getByText('Schedule Demo')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing onNavigate prop gracefully', () => {
      const { container } = render(<HomePage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('preserves existing functionality without onNavigate', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Financial Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Why Choose Rails?')).toBeInTheDocument();
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(<HomePage />);
      
      // Check for sections
      const sections = screen.getAllByRole('generic').filter(el => 
        el.tagName.toLowerCase() === 'section'
      );
      expect(sections.length).toBeGreaterThan(0);
    });

    test('has proper heading hierarchy', () => {
      render(<HomePage />);
      
      const mainHeading = screen.getByText('Financial Infrastructure');
      expect(mainHeading).toBeInTheDocument();
      
      const sectionHeadings = [
        'Why Choose Rails?',
        'Our Products',
        'Ready to Build the Future of Finance?'
      ];
      
      sectionHeadings.forEach(heading => {
        expect(screen.getByText(heading)).toBeInTheDocument();
      });
    });

    test('maintains accessibility with custom props', () => {
      render(
        <HomePage 
          data-testid="accessible-home-page"
          className="custom-accessible"
        />
      );
      
      const container = screen.getByTestId('accessible-home-page');
      expect(container).toHaveClass('custom-accessible');
    });
  });
});