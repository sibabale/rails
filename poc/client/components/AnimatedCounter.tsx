import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  format?: (value: number) => string;
  decimals?: number;
  className?: string;
  triggerOnce?: boolean;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ 
  from = 0, 
  to, 
  duration = 2, 
  format, 
  decimals = 0,
  className = "",
  triggerOnce = true,
  suffix = "",
  prefix = ""
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const count = useMotionValue(from);
  const isInView = useInView(ref, { once: triggerOnce, margin: "-50px" });

  // Format large numbers for display
  const formatNumber = (value: number): string => {
    if (format) return format(value);
    
    // Round to specified decimals
    const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    // Format large numbers with appropriate suffixes
    if (rounded >= 1e9) {
      return (rounded / 1e9).toFixed(1) + 'B';
    }
    if (rounded >= 1e6) {
      return (rounded / 1e6).toFixed(1) + 'M';
    }
    if (rounded >= 1e3) {
      return (rounded / 1e3).toFixed(1) + 'K';
    }
    
    // Use Intl.NumberFormat for proper localization
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(rounded);
  };

  const rounded = useTransform(count, (latest) => {
    return `${prefix}${formatNumber(latest)}${suffix}`;
  });

  useEffect(() => {
    if (isInView) {
      const animation = animate(count, to, {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94], // Snappy easing for numbers
        onComplete: () => {
          // Ensure we end exactly on the target value
          count.set(to);
        }
      });
      
      return () => animation.stop();
    }
  }, [count, to, duration, isInView]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
    </span>
  );
}

// Preset formatters for common use cases
export const currencyFormatter = (currency = 'ZAR') => (value: number) => 
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    notation: value >= 1e6 ? 'compact' : 'standard',
    compactDisplay: 'short'
  }).format(value);

export const percentageFormatter = (decimals = 1) => (value: number) =>
  `${(value).toFixed(decimals)}%`;

export const compactFormatter = (value: number) =>
  new Intl.NumberFormat('en-ZA', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(value);