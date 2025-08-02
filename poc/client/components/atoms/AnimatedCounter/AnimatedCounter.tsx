import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import type { AnimatedCounterProps } from './AnimatedCounter.interface';

export function AnimatedCounter({ 
  value,
  startValue = 0,
  duration = 2000,
  easing = 'easeOut',
  showPlus = false,
  formatOptions,
  className = "",
  style,
  onAnimationStart,
  onAnimationComplete,
  onValueChange
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(startValue);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Format number for display
  const formatNumber = (value: number): string => {
    let formatted = '';
    
    if (formatOptions) {
      formatted = new Intl.NumberFormat('en-US', formatOptions).format(value);
    } else {
      formatted = new Intl.NumberFormat('en-US').format(value);
    }
    
    if (showPlus && value > 0) {
      formatted = `+${formatted}`;
    }
    
    return formatted;
  };

  const rounded = useTransform(count, (latest) => {
    return formatNumber(latest);
  });

  useEffect(() => {
    if (isInView) {
      onAnimationStart?.();
      
      const animation = animate(count, value, {
        duration: duration / 1000, // Convert to seconds for framer-motion
        ease: easing,
        onUpdate: (latest) => {
          onValueChange?.(latest);
        },
        onComplete: () => {
          count.set(value);
          onAnimationComplete?.();
        }
      });
      
      return () => animation.stop();
    }
  }, [count, value, duration, easing, isInView, onAnimationStart, onAnimationComplete, onValueChange]);

  return (
    <span 
      ref={ref} 
      className={className}
      style={style}
      role="status"
      aria-live="polite"
    >
      <motion.span>{rounded}</motion.span>
    </span>
  );
}

// Utility formatters
export const percentageFormatter = (decimals: number = 1) => (value: number) => 
  `${value.toFixed(decimals)}%`;

export const currencyFormatter = (currency: string = 'USD') => (value: number) => 
  new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(value);

export const compactFormatter = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};