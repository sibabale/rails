import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import type { ScrollRevealProps } from './ScrollReveal.interface';

export function ScrollReveal({
  children,
  direction = 'up',
  distance = 60,
  duration = 500,
  delay = 0,
  easing = 'easeOut',
  triggerOnce = true,
  threshold = 0.1,
  className = "",
  style,
  onAnimationStart,
  onAnimationComplete,
  onEnter,
  onLeave
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    once: triggerOnce, 
    margin: "-50px",
    amount: threshold
  });

  // Respect user's motion preferences
  const shouldReduceMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getInitialState = () => {
    if (shouldReduceMotion) return { opacity: 1 };
    
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance };
      case 'down':
        return { opacity: 0, y: -distance };
      case 'left':
        return { opacity: 0, x: distance };
      case 'right':
        return { opacity: 0, x: -distance };
      case 'fade':
        return { opacity: 0 };
      default:
        return { opacity: 0, y: distance };
    }
  };

  const getAnimateState = () => {
    if (shouldReduceMotion) return { opacity: 1 };
    return { opacity: 1, y: 0, x: 0 };
  };

  const getEasing = () => {
    switch (easing) {
      case 'linear':
        return [0, 0, 1, 1];
      case 'easeIn':
        return [0.4, 0, 1, 1];
      case 'easeOut':
        return [0, 0, 0.2, 1];
      case 'easeInOut':
        return [0.4, 0, 0.2, 1];
      case 'bounce':
        return [0.68, -0.55, 0.265, 1.55];
      default:
        return [0, 0, 0.2, 1];
    }
  };

  const variants: Variants = {
    hidden: getInitialState(),
    visible: {
      ...getAnimateState(),
      transition: {
        duration: shouldReduceMotion ? 0 : duration / 1000, // Convert to seconds
        delay: shouldReduceMotion ? 0 : delay / 1000, // Convert to seconds
        ease: getEasing(),
        onStart: onAnimationStart,
        onComplete: onAnimationComplete
      }
    }
  };

  // Handle enter/leave callbacks
  React.useEffect(() => {
    if (isInView) {
      onEnter?.();
    } else {
      onLeave?.();
    }
  }, [isInView, onEnter, onLeave]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// StaggeredReveal component for animating multiple children
export function StaggeredReveal({
  children,
  staggerDelay = 0.1,
  className = "",
  style,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.0, 0.0, 0.2, 1]
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      style={style}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
} 