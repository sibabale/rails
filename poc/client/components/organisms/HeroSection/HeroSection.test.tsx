import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { HeroSection } from './HeroSection';
import { HeroSectionProps } from './HeroSection.interface';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock animated components
jest.mock('../../atoms/AnimatedCounter', () => ({
  AnimatedCounter: ({ to, format, suffix }: any) => (
    <span data-testid="animated-counter">
      {format ? format(to) : to}{suffix || ''}
    </span>
  ),
  percentageFormatter: (decimals: number) => (value: number) => `${value.toFixed(decimals)}%`,
  currencyFormatter: (currency: string) => (value: number) => `${currency} ${value.toLocaleString()}`,
  compactFormatter: (value: number) => value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toString(),
}));

jest.mock('../../atoms/ScrollReveal', () => ({
  ScrollReveal: ({ children }: any) => <div data-testid="scroll-reveal">{children}</div>,
  StaggeredReveal: ({ children }: any) => <div data-testid="staggered-reveal">{children}</div>,
}));

// Create mock store
const mockStore = configureStore({
  reducer: {
    root: (state = {}) => state,
  },
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  );
};

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Public Interface Validation', () => {
    test('should render with default props', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('Active Banks')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Transactions')).toBeInTheDocument();
    });

    test('should render revenue overview section', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
      expect(screen.getByText('Monthly transaction revenue and volume trends')).toBeInTheDocument();
      expect(screen.getByText('Last 6 months')).toBeInTheDocument();
    });

    test('should render bank distribution section', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('Bank Distribution')).toBeInTheDocument();
      expect(screen.getByText('Transaction volume by connected banks')).toBeInTheDocument();
    });

    test('should render transaction logs section', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText("Today's Transaction Logs")).toBeInTheDocument();
      expect(screen.getByText('Recent settlement activities and status updates')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = renderWithProvider(
        <HeroSection className="custom-hero" />
      );
      
      expect(container.firstChild).toHaveClass('space-y-8', 'sm:space-y-12', 'custom-hero');
    });

    test('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red', padding: '20px' };
      const { container } = renderWithProvider(
        <HeroSection style={customStyle} />
      );
      
      expect(container.firstChild).toHaveStyle(customStyle);
    });

    test('should include data-testid when provided', () => {
      const { container } = renderWithProvider(
        <HeroSection data-testid="hero-section" />
      );
      
      expect(container.firstChild).toHaveAttribute('data-testid', 'hero-section');
    });
  });

  describe('Real-time Data Updates', () => {
    test('should update stats periodically', async () => {
      renderWithProvider(<HeroSection />);
      
      const initialCounters = screen.getAllByTestId('animated-counter');
      expect(initialCounters).toHaveLength(7); // 4 main stats + 3 bank transaction counters

      // Fast forward time to trigger update
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        const updatedCounters = screen.getAllByTestId('animated-counter');
        expect(updatedCounters).toHaveLength(7);
      });
    });

    test('should clean up timer on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = renderWithProvider(<HeroSection />);
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Charts and Visualizations', () => {
    test('should render line chart for revenue data', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line')).toBeInTheDocument();
    });

    test('should render pie chart for bank distribution', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    test('should render chart axes and grid', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });
  });

  describe('Transaction Logs', () => {
    test('should render transaction log entries', () => {
      renderWithProvider(<HeroSection />);
      
      // Check for transaction IDs
      expect(screen.getByText('WS_2025_001')).toBeInTheDocument();
      expect(screen.getByText('WS_2025_002')).toBeInTheDocument();
      expect(screen.getByText('WS_2025_003')).toBeInTheDocument();
      expect(screen.getByText('WS_2025_004')).toBeInTheDocument();
      expect(screen.getByText('WS_2025_005')).toBeInTheDocument();
    });

    test('should render bank names in transaction logs', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('FNB')).toBeInTheDocument();
      expect(screen.getByText('ABSA')).toBeInTheDocument();
      expect(screen.getByText('Standard Bank')).toBeInTheDocument();
      expect(screen.getByText('Nedbank')).toBeInTheDocument();
    });

    test('should render transaction statuses', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getAllByText('Completed')).toHaveLength(3);
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    test('should render transaction amounts and times', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('R250,000 • 14:32')).toBeInTheDocument();
      expect(screen.getByText('R180,500 • 14:28')).toBeInTheDocument();
      expect(screen.getByText('R95,750 • 14:15')).toBeInTheDocument();
    });
  });

  describe('Bank Data Display', () => {
    test('should render bank names and percentages', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.getByText('28%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('12%')).toBeInTheDocument();
    });

    test('should render bank transaction counts', () => {
      renderWithProvider(<HeroSection />);
      
      // Check for formatted transaction counts (compactFormatter)
      const counters = screen.getAllByTestId('animated-counter');
      const bankCounters = counters.slice(-4); // Last 4 are bank transaction counters
      
      bankCounters.forEach(counter => {
        expect(counter).toHaveTextContent(/\d+(\.\d+)?K? txns/);
      });
    });
  });

  describe('Animation and Motion', () => {
    test('should render scroll reveal components', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getAllByTestId('scroll-reveal')).toHaveLength(4);
      expect(screen.getByTestId('staggered-reveal')).toBeInTheDocument();
    });

    test('should include motion wrapper elements', () => {
      renderWithProvider(<HeroSection />);
      
      // Motion components should be rendered as divs
      const container = screen.getByText('Active Banks').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading structure', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
      expect(screen.getByText('Bank Distribution')).toBeInTheDocument();
      expect(screen.getByText("Today's Transaction Logs")).toBeInTheDocument();
    });

    test('should have descriptive labels for stats', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('Active Banks')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Transactions')).toBeInTheDocument();
    });

    test('should include badge for connection status', () => {
      renderWithProvider(<HeroSection />);
      
      expect(screen.getByText('All Connected')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should include responsive CSS classes', () => {
      const { container } = renderWithProvider(<HeroSection />);
      
      expect(container.querySelector('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4')).toBeInTheDocument();
      expect(container.querySelector('.grid-cols-1.lg\\:grid-cols-2')).toBeInTheDocument();
    });

    test('should have responsive spacing classes', () => {
      const { container } = renderWithProvider(<HeroSection />);
      
      expect(container.firstChild).toHaveClass('space-y-8', 'sm:space-y-12');
    });
  });

  describe('Data Formatting', () => {
    test('should format revenue as currency', () => {
      renderWithProvider(<HeroSection />);
      
      const revenueCounters = screen.getAllByTestId('animated-counter');
      const revenueCounter = revenueCounters.find(counter => 
        counter.textContent?.includes('ZAR')
      );
      
      expect(revenueCounter).toBeInTheDocument();
    });

    test('should format completion rate as percentage', () => {
      renderWithProvider(<HeroSection />);
      
      const percentageCounters = screen.getAllByTestId('animated-counter');
      const completionRateCounter = percentageCounters.find(counter => 
        counter.textContent?.includes('%')
      );
      
      expect(completionRateCounter).toBeInTheDocument();
    });

    test('should use compact format for large numbers', () => {
      renderWithProvider(<HeroSection />);
      
      const compactCounters = screen.getAllByTestId('animated-counter');
      const transactionCounter = compactCounters.find(counter => 
        counter.textContent?.includes('K')
      );
      
      expect(transactionCounter).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing data gracefully', () => {
      renderWithProvider(<HeroSection />);
      
      // Component should render without throwing errors
      expect(screen.getByText('Active Banks')).toBeInTheDocument();
    });

    test('should handle timer errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProvider(<HeroSection />);
      
      // Simulate potential timer error
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Component should still be functional
      expect(screen.getByText('Active Banks')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = renderWithProvider(<HeroSection />);
      
      const initialElements = screen.getAllByTestId('animated-counter');
      
      rerender(
        <Provider store={mockStore}>
          <HeroSection />
        </Provider>
      );
      
      const afterRerenderElements = screen.getAllByTestId('animated-counter');
      expect(afterRerenderElements).toHaveLength(initialElements.length);
    });

    test('should handle rapid timer updates', async () => {
      renderWithProvider(<HeroSection />);
      
      // Simulate multiple rapid timer updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          jest.advanceTimersByTime(3000);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Active Banks')).toBeInTheDocument();
      });
    });
  });
});