import React from 'react';

export interface AnimatedCounterProps {
  /** The target value to count up to */
  value: number;
  
  /** The starting value (defaults to 0) */
  startValue?: number;
  
  /** Duration of the animation in milliseconds */
  duration?: number;
  
  /** Easing function for the animation */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  
  /** Whether to show the plus sign for positive values */
  showPlus?: boolean;
  
  /** Number formatting options */
  formatOptions?: Intl.NumberFormatOptions;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  
  /** Callback when value changes during animation */
  onValueChange?: (value: number) => void;
}

export interface AnimatedCounterState {
  /** Current displayed value */
  currentValue: number;
  
  /** Whether animation is currently running */
  isAnimating: boolean;
  
  /** Animation start timestamp */
  animationStartTime: number | null;
}

export interface AnimatedCounterEvents {
  /** Called when animation starts */
  onAnimationStart?: () => void;
  
  /** Called when animation completes */
  onAnimationComplete?: () => void;
  
  /** Called when value changes during animation */
  onValueChange?: (value: number) => void;
}

export type AnimatedCounterEasing = AnimatedCounterProps['easing']; 