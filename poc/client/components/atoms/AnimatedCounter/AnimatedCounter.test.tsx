import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnimatedCounter } from './AnimatedCounter';
import type { AnimatedCounterProps } from './AnimatedCounter.interface';

// Mock requestAnimationFrame
const mockRAF = (callback: FrameRequestCallback) => {
  setTimeout(callback, 16); // 60fps
  return 1;
};
global.requestAnimationFrame = mockRAF;

describe('AnimatedCounter', () => {
  describe('Public Interface Validation', () => {
    test('renders with required props', () => {
      render(<AnimatedCounter value={100} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('renders with all optional props', () => {
      const props: AnimatedCounterProps = {
        value: 1000,
        startValue: 50,
        duration: 2000,
        easing: 'easeOut',
        showPlus: true,
        formatOptions: { style: 'currency', currency: 'USD' },
        className: 'custom-counter',
        style: { color: 'red' },
        onAnimationStart: jest.fn(),
        onAnimationComplete: jest.fn(),
        onValueChange: jest.fn(),
      };
      
      render(<AnimatedCounter {...props} />);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<AnimatedCounter value={100} className="custom-class" />);
      const element = screen.getByText('0');
      expect(element).toHaveClass('custom-class');
    });

    test('applies custom style', () => {
      render(<AnimatedCounter value={100} style={{ color: 'blue' }} />);
      const element = screen.getByText('0');
      expect(element).toHaveStyle({ color: 'blue' });
    });
  });

  describe('Animation Behavior', () => {
    test('starts animation when value changes', async () => {
      const onAnimationStart = jest.fn();
      const onValueChange = jest.fn();
      
      render(
        <AnimatedCounter 
          value={100} 
          onAnimationStart={onAnimationStart}
          onValueChange={onValueChange}
        />
      );

      await waitFor(() => {
        expect(onAnimationStart).toHaveBeenCalled();
      }, { timeout: 100 });
    });

    test('calls onValueChange during animation', async () => {
      const onValueChange = jest.fn();
      
      render(
        <AnimatedCounter 
          value={100} 
          onValueChange={onValueChange}
        />
      );

      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalled();
      }, { timeout: 100 });
    });

    test('calls onAnimationComplete when finished', async () => {
      const onAnimationComplete = jest.fn();
      
      render(
        <AnimatedCounter 
          value={100} 
          duration={100}
          onAnimationComplete={onAnimationComplete}
        />
      );

      await waitFor(() => {
        expect(onAnimationComplete).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('Number Formatting', () => {
    test('formats numbers with default options', async () => {
      render(<AnimatedCounter value={1234.56} />);
      
      await waitFor(() => {
        expect(screen.getByText('1,234.56')).toBeInTheDocument();
      }, { timeout: 100 });
    });

    test('formats numbers with custom options', async () => {
      render(
        <AnimatedCounter 
          value={1234.56} 
          formatOptions={{ style: 'currency', currency: 'USD' }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('$1,234.56')).toBeInTheDocument();
      }, { timeout: 100 });
    });

    test('shows plus sign when showPlus is true', async () => {
      render(<AnimatedCounter value={100} showPlus />);
      
      await waitFor(() => {
        expect(screen.getByText('+100')).toBeInTheDocument();
      }, { timeout: 100 });
    });
  });

  describe('Edge Cases', () => {
    test('handles zero value', () => {
      render(<AnimatedCounter value={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('handles negative values', async () => {
      render(<AnimatedCounter value={-100} />);
      
      await waitFor(() => {
        expect(screen.getByText('-100')).toBeInTheDocument();
      }, { timeout: 100 });
    });

    test('handles very large numbers', async () => {
      render(<AnimatedCounter value={999999999} />);
      
      await waitFor(() => {
        expect(screen.getByText('999,999,999')).toBeInTheDocument();
      }, { timeout: 100 });
    });

    test('handles decimal values', async () => {
      render(<AnimatedCounter value={3.14159} />);
      
      await waitFor(() => {
        expect(screen.getByText('3.14159')).toBeInTheDocument();
      }, { timeout: 100 });
    });
  });

  describe('Accessibility', () => {
    test('has appropriate ARIA attributes', () => {
      render(<AnimatedCounter value={100} />);
      const element = screen.getByText('0');
      expect(element).toHaveAttribute('role', 'status');
      expect(element).toHaveAttribute('aria-live', 'polite');
    });

    test('announces value changes to screen readers', async () => {
      render(<AnimatedCounter value={100} />);
      
      await waitFor(() => {
        const element = screen.getByText('100');
        expect(element).toHaveAttribute('aria-live', 'polite');
      }, { timeout: 100 });
    });
  });
}); 