import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  distance?: number;
  triggerOnce?: boolean;
  threshold?: number;
  stagger?: boolean;
  staggerDelay?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 60,
  triggerOnce = true,
  threshold = 0.1,
  stagger = false,
  staggerDelay = 0.1
}: ScrollRevealProps) {
  const ref = useRef(null);
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

  const variants: Variants = {
    hidden: getInitialState(),
    visible: {
      ...getAnimateState(),
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.0, 0.0, 0.2, 1],
        ...(stagger && {
          staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
          delayChildren: shouldReduceMotion ? 0 : delay
        })
      }
    }
  };

  const itemVariants: Variants = stagger ? {
    hidden: getInitialState(),
    visible: {
      ...getAnimateState(),
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        ease: [0.0, 0.0, 0.2, 1]
      }
    }
  } : {};

  if (stagger) {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={variants}
        className={className}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Preset configurations for common use cases
export const FadeUp = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="up" {...props}>{children}</ScrollReveal>
);

export const FadeLeft = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="left" {...props}>{children}</ScrollReveal>
);

export const FadeRight = ({ children, ...props }: Omit<ScrollRevealProps, 'direction'>) => (
  <ScrollReveal direction="right" {...props}>{children}</ScrollReveal>
);

export const StaggeredReveal = ({ children, ...props }: Omit<ScrollRevealProps, 'stagger'>) => (
  <ScrollReveal stagger={true} {...props}>{children}</ScrollReveal>
);