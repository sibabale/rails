import React from 'react';

export interface ScrollRevealProps {
  /** The content to reveal */
  children: React.ReactNode;
  
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  
  /** Distance to animate from */
  distance?: number;
  
  /** Animation duration in milliseconds */
  duration?: number;
  
  /** Animation delay in milliseconds */
  delay?: number;
  
  /** Easing function */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
  
  /** Whether to trigger animation only once */
  triggerOnce?: boolean;
  
  /** Threshold for triggering animation (0-1) */
  threshold?: number;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  
  /** Callback when element enters viewport */
  onEnter?: () => void;
  
  /** Callback when element leaves viewport */
  onLeave?: () => void;
}

export interface ScrollRevealState {
  /** Whether the element is in view */
  isInView: boolean;
  
  /** Whether animation has been triggered */
  hasTriggered: boolean;
  
  /** Current animation progress */
  progress: number;
}

export interface ScrollRevealEvents {
  /** Called when animation starts */
  onAnimationStart?: () => void;
  
  /** Called when animation completes */
  onAnimationComplete?: () => void;
  
  /** Called when element enters viewport */
  onEnter?: () => void;
  
  /** Called when element leaves viewport */
  onLeave?: () => void;
}

export type ScrollRevealDirection = ScrollRevealProps['direction'];
export type ScrollRevealEasing = ScrollRevealProps['easing']; 