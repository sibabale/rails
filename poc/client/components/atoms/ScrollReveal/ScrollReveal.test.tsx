import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScrollReveal } from './ScrollReveal';
import type { ScrollRevealProps } from './ScrollReveal.interface';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useInView: () => true,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
}));

describe('ScrollReveal', () => {
  describe('Public Interface Validation', () => {
    test('renders children with required props', () => {
      render(
        <ScrollReveal>
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with all optional props', () => {
      const props: ScrollRevealProps = {
        children: <div>Test Content</div>,
        direction: 'up',
        distance: 50,
        duration: 1000,
        delay: 200,
        easing: 'easeOut',
        triggerOnce: true,
        threshold: 0.5,
        className: 'custom-reveal',
        style: { color: 'red' },
        onAnimationStart: jest.fn(),
        onAnimationComplete: jest.fn(),
        onEnter: jest.fn(),
        onLeave: jest.fn(),
      };
      
      render(<ScrollReveal {...props} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(
        <ScrollReveal className="custom-class">
          <div>Test Content</div>
        </ScrollReveal>
      );
      const element = screen.getByText('Test Content').parentElement;
      expect(element).toHaveClass('custom-class');
    });

    test('applies custom style', () => {
      render(
        <ScrollReveal style={{ color: 'blue' }}>
          <div>Test Content</div>
        </ScrollReveal>
      );
      const element = screen.getByText('Test Content').parentElement;
      expect(element).toHaveStyle({ color: 'blue' });
    });
  });

  describe('Animation Behavior', () => {
    test('calls onEnter when element enters viewport', async () => {
      const onEnter = jest.fn();
      
      render(
        <ScrollReveal onEnter={onEnter}>
          <div>Test Content</div>
        </ScrollReveal>
      );

      await waitFor(() => {
        expect(onEnter).toHaveBeenCalled();
      }, { timeout: 100 });
    });

    test('calls onAnimationStart when animation begins', async () => {
      const onAnimationStart = jest.fn();
      
      render(
        <ScrollReveal onAnimationStart={onAnimationStart}>
          <div>Test Content</div>
        </ScrollReveal>
      );

      await waitFor(() => {
        expect(onAnimationStart).toHaveBeenCalled();
      }, { timeout: 100 });
    });

    test('calls onAnimationComplete when animation finishes', async () => {
      const onAnimationComplete = jest.fn();
      
      render(
        <ScrollReveal onAnimationComplete={onAnimationComplete}>
          <div>Test Content</div>
        </ScrollReveal>
      );

      await waitFor(() => {
        expect(onAnimationComplete).toHaveBeenCalled();
      }, { timeout: 100 });
    });
  });

  describe('Direction Variants', () => {
    test('renders with up direction', () => {
      render(
        <ScrollReveal direction="up">
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with down direction', () => {
      render(
        <ScrollReveal direction="down">
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with left direction', () => {
      render(
        <ScrollReveal direction="left">
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with right direction', () => {
      render(
        <ScrollReveal direction="right">
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with fade direction', () => {
      render(
        <ScrollReveal direction="fade">
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty children', () => {
      render(<ScrollReveal>{null}</ScrollReveal>);
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    test('handles multiple children', () => {
      render(
        <ScrollReveal>
          <div>Child 1</div>
          <div>Child 2</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    test('handles zero distance', () => {
      render(
        <ScrollReveal distance={0}>
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('handles zero duration', () => {
      render(
        <ScrollReveal duration={0}>
          <div>Test Content</div>
        </ScrollReveal>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('preserves accessibility attributes of children', () => {
      render(
        <ScrollReveal>
          <button aria-label="Test Button">Click me</button>
        </ScrollReveal>
      );
      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();
    });

    test('maintains focus management', () => {
      render(
        <ScrollReveal>
          <input type="text" aria-label="Test Input" />
        </ScrollReveal>
      );
      const input = screen.getByRole('textbox', { name: 'Test Input' });
      expect(input).toBeInTheDocument();
    });
  });
}); 