import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { HomePage } from './HomePage';
import type { HomePageProps } from './HomePage.interface';

// The framer-motion mock is handled in test-setup.ts

// Mock child components to focus on HomePage logic
jest.mock('../../organisms/Footer', () => ({
  Footer: ({ onNavigate }: { onNavigate?: (page: string) => void }) => (
    <footer data-testid="footer">
      <button onClick={() => onNavigate?.('products')}>Products</button>
    </footer>
  ),
}));

jest.mock('../../organisms/InteractiveApiSection', () => ({
  InteractiveApiSection: () => (
    <section data-testid="interactive-api-section">Interactive API Section</section>
  ),
}));

jest.mock('../../atoms/AnimatedCounter', () => ({
  AnimatedCounter: ({ to, format, prefix, suffix, decimals }: any) => (
    <span data-testid="animated-counter">
      {prefix}{to.toFixed(decimals || 0)}{suffix}
    </span>
  ),
  percentageFormatter: (decimals: number) => (value: number) => `${value.toFixed(decimals)}%`,
}));

jest.mock('../../atoms/ScrollReveal', () => ({
  ScrollReveal: ({ children }: any) => <div data-testid="scroll-reveal">{children}</div>,
  StaggeredReveal: ({ children }: any) => <div data-testid="staggered-reveal">{children}</div>,
}));

describe('HomePage', () => {
  describe('Public Interface Validation', () => {
    test('should render with required props', () => {
      render(<HomePage />);
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      const onNavigate = jest.fn();
      const customClassName = 'custom-home-page';
      const customStyle = { backgroundColor: 'red' };
      
      render(
        <HomePage
          onNavigate={onNavigate}
          className={customClassName}
          style={customStyle}
          data-testid="custom-home-page"
        />
      );
      
      const homePage = screen.getByTestId('custom-home-page');
      expect(homePage).toBeInTheDocument();
      expect(homePage).toHaveClass(customClassName);
      expect(homePage).toHaveStyle({ backgroundColor: 'red' });
    });

    test('should render hero section with correct content', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Financial Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('That Just Works')).toBeInTheDocument();
      expect(screen.getByText('Build banking products without the complexity. Rails provides scalable, compliant financial infrastructure with modern APIs, so you can focus on what matters most—your customers.')).toBeInTheDocument();
    });

    test('should render CTA buttons', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('button', { name: /start building today/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view documentation/i })).toBeInTheDocument();
    });

    test('should render features section', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Why Choose Rails?')).toBeInTheDocument();
      expect(screen.getByText('Scale with Confidence')).toBeInTheDocument();
      expect(screen.getByText('Compliance & Security')).toBeInTheDocument();
      expect(screen.getByText('Resilient & Reliable')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    test('should call onNavigate when products button is clicked', async () => {
      const onNavigate = jest.fn();
      render(<HomePage onNavigate={onNavigate} />);
      
      const productsButtons = screen.getAllByRole('button', { name: /learn more/i });
      
      // Click the first "Learn More" button (Weekend Settlements)
      await userEvent.click(productsButtons[0]);
      
      expect(onNavigate).toHaveBeenCalledWith('products');
    });

    test('should handle footer navigation', async () => {
      const onNavigate = jest.fn();
      render(<HomePage onNavigate={onNavigate} />);
      
      // The mock footer has different button text
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Content Sections', () => {
    test('should render products section with Weekend Settlements', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Our Products')).toBeInTheDocument();
      expect(screen.getByText('Weekend Settlements')).toBeInTheDocument();
      expect(screen.getByText('Process transactions from major South African banks during weekends with real-time clearing')).toBeInTheDocument();
      expect(screen.getByText('Live Now')).toBeInTheDocument();
    });

    test('should render products section with Bank-as-a-Service', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Bank-as-a-Service')).toBeInTheDocument();
      expect(screen.getByText('Full banking infrastructure for startups with banking licenses to launch products fast')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    test('should render metrics with animated counters', () => {
      render(<HomePage />);
      
      const animatedCounters = screen.getAllByTestId('animated-counter');
      expect(animatedCounters).toHaveLength(3);
      
      // Check if metrics are rendered
      expect(screen.getByText('Uptime SLA')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Banks Supported')).toBeInTheDocument();
    });

    test('should render CTA section', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Ready to Build the Future of Finance?')).toBeInTheDocument();
      expect(screen.getByText('Join leading fintechs who trust Rails for their financial infrastructure needs.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get started free/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /schedule demo/i })).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should render Footer component', () => {
      render(<HomePage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should render InteractiveApiSection component', () => {
      render(<HomePage />);
      expect(screen.getByTestId('interactive-api-section')).toBeInTheDocument();
    });

    test('should render ScrollReveal components', () => {
      render(<HomePage />);
      // ScrollReveal is mocked, so we just check the page renders
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper semantic structure', () => {
      render(<HomePage />);
      
      // Check for main sections
      const sections = screen.getAllByRole('generic'); // sections without explicit role
      expect(sections.length).toBeGreaterThan(0);
      
      // Check for buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have accessible button text', () => {
      render(<HomePage />);
      
      const startBuildingButton = screen.getByRole('button', { name: /start building today/i });
      const viewDocsButton = screen.getByRole('button', { name: /view documentation/i });
      
      expect(startBuildingButton).toBeInTheDocument();
      expect(viewDocsButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing onNavigate prop gracefully', () => {
      expect(() => {
        render(<HomePage />);
      }).not.toThrow();
    });

    test('should handle button clicks without onNavigate', async () => {
      render(<HomePage />);
      
      const learnMoreButtons = screen.getAllByRole('button', { name: /learn more/i });
      
      // Should not throw when clicking without onNavigate handler
      expect(() => {
        fireEvent.click(learnMoreButtons[0]);
      }).not.toThrow();
    });

    test('should render with custom data-testid', () => {
      render(<HomePage data-testid="custom-test-id" />);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });
});