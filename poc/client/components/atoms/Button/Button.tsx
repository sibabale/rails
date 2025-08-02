import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../ui/utils';
import type { ButtonProps } from './Button.interface';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-blue-500 focus-visible:ring-blue-500/50 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 aria-invalid:ring-[3px] aria-invalid:border-red-500',
  {
    variants: {
      variant: {
        default: 'bg-brand-950 text-white hover:bg-brand-900',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/20',
        outline: 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-brand-950 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonMotionPresets = {
  default: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  },
  subtle: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: { type: 'spring', stiffness: 500, damping: 15 }
  },
  bounce: {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.95, y: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 10 }
  },
  none: {}
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    motionPreset = 'default',
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    whileHover,
    whileTap,
    transition,
    initial,
    animate,
    exit,
    variants,
    layout,
    layoutId,
    ...props 
  }, ref) => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Get motion preset or use custom motion props
    const motionProps = prefersReducedMotion 
      ? buttonMotionPresets.none 
      : {
          ...buttonMotionPresets[motionPreset],
          ...(whileHover && { whileHover }),
          ...(whileTap && { whileTap }),
          ...(transition && { transition }),
          ...(initial && { initial }),
          ...(animate && { animate }),
          ...(exit && { exit }),
          ...(variants && { variants }),
          ...(layout && { layout }),
          ...(layoutId && { layoutId }),
        };

    // Handle loading state
    const isDisabled = loading || props.disabled;
    const displayText = loading && loadingText ? loadingText : children;

    // Prepare button content
    const buttonContent = (
      <>
        {leftIcon && !loading && leftIcon}
        {displayText}
        {rightIcon && !loading && rightIcon}
        {loading && (
          <motion.div
            className="size-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </>
    );

    if (asChild) {
      return (
        <Slot
          data-slot="button"
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-busy={loading}
          {...props}
        >
          {buttonContent}
        </Slot>
      );
    }

    return (
      <motion.button
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...motionProps}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button'; 