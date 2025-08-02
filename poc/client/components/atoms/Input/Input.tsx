import React, { useState, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '../../ui/utils';
import type { InputProps } from './Input.interface';

const inputVariants = cva(
  'flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-white transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm placeholder:text-gray-500 selection:bg-brand-950 selection:text-white file:text-gray-900',
  {
    variants: {
      variant: {
        default: 'border-gray-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/50 focus-visible:ring-[3px]',
        error: 'border-red-500 ring-red-500/20 ring-[3px] focus-visible:border-red-500 focus-visible:ring-red-500/50',
        success: 'border-green-500 ring-green-500/20 ring-[3px] focus-visible:border-green-500 focus-visible:ring-green-500/50',
        warning: 'border-yellow-500 ring-yellow-500/20 ring-[3px] focus-visible:border-yellow-500 focus-visible:ring-yellow-500/50',
      },
      size: {
        sm: 'h-8 px-2.5 py-1 text-sm',
        md: 'h-9 px-3 py-1',
        lg: 'h-10 px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const containerVariants = cva(
  'relative inline-flex w-full',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const addonVariants = cva(
  'inline-flex items-center px-3 border border-r-0 bg-gray-50 text-gray-500 rounded-l-md',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-9 px-3',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const rightAddonVariants = cva(
  'inline-flex items-center px-3 border border-l-0 bg-gray-50 text-gray-500 rounded-r-md',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-9 px-3',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const iconVariants = cva(
  'absolute inset-y-0 flex items-center pointer-events-none text-gray-400',
  {
    variants: {
      position: {
        left: 'left-0 pl-3',
        right: 'right-0 pr-3',
      },
      size: {
        sm: '[&_svg]:size-4',
        md: '[&_svg]:size-4',
        lg: '[&_svg]:size-5',
      },
    },
    defaultVariants: {
      position: 'left',
      size: 'md',
    },
  },
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    variant = 'default',
    size = 'md',
    loading = false,
    loadingIndicator,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    error,
    success,
    helperText,
    showCharacterCount = false,
    maxLength,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    onClick,
    onKeyDown,
    onKeyUp,
    onPaste,
    onCut,
    ...props 
  }, ref) => {
    const [inputState, setInputState] = useState({
      isFocused: false,
      hasValue: false,
      isDirty: false,
      characterCount: 0,
    });

    // Determine effective variant based on error/success state
    const effectiveVariant = error ? 'error' : success ? 'success' : variant;

    // Calculate character count
    const currentValue = value !== undefined ? String(value) : '';
    const characterCount = currentValue.length;

    useEffect(() => {
      setInputState(prev => ({
        ...prev,
        hasValue: currentValue.length > 0,
        characterCount,
      }));
    }, [currentValue, characterCount]);

    // Handle focus events
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setInputState(prev => ({ ...prev, isFocused: true }));
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setInputState(prev => ({ ...prev, isFocused: false }));
      onBlur?.(event);
    };

    // Handle change events
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputState(prev => ({ 
        ...prev, 
        isDirty: true,
        hasValue: event.target.value.length > 0,
        characterCount: event.target.value.length,
      }));
      onChange?.(event);
    };

    // Prepare input padding based on icons and addons
    const hasLeftContent = leftIcon || leftAddon;
    const hasRightContent = rightIcon || rightAddon || loading || showCharacterCount;

    const inputPaddingClass = cn(
      hasLeftContent && 'pl-10',
      hasRightContent && 'pr-10',
    );

    // Prepare loading indicator
    const LoadingSpinner = loadingIndicator || (
      <motion.div
        className="size-4 border-2 border-gray-300 border-t-gray-600 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    );

    // Build input element
    const inputElement = (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          inputVariants({ variant: effectiveVariant, size }),
          inputPaddingClass,
          leftAddon && 'rounded-l-none border-l-0',
          rightAddon && 'rounded-r-none border-r-0',
          className
        )}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPaste={onPaste}
        onCut={onCut}
        aria-invalid={!!error}
        aria-describedby={
          cn(
            error && `${props.id}-error`,
            success && `${props.id}-success`,
            helperText && `${props.id}-helper`,
            showCharacterCount && `${props.id}-count`
          ).trim() || undefined
        }
        {...props}
      />
    );

    // Wrap with container for icons and addons
    const inputWithDecorations = (
      <div className={containerVariants({ size })}>
        {leftAddon && (
          <div className={addonVariants({ size })}>
            {leftAddon}
          </div>
        )}
        
        <div className="relative flex-1">
          {inputElement}
          
          {leftIcon && !leftAddon && (
            <div className={iconVariants({ position: 'left', size })}>
              {leftIcon}
            </div>
          )}
          
          {(rightIcon || loading || showCharacterCount) && !rightAddon && (
            <div className={iconVariants({ position: 'right', size })}>
              {loading && LoadingSpinner}
              {!loading && showCharacterCount && maxLength && (
                <span className="text-xs text-gray-500 mr-2">
                  {characterCount}/{maxLength}
                </span>
              )}
              {!loading && rightIcon && rightIcon}
            </div>
          )}
        </div>
        
        {rightAddon && (
          <div className={rightAddonVariants({ size })}>
            {rightAddon}
          </div>
        )}
      </div>
    );

    return (
      <div className="w-full">
        {inputWithDecorations}
        
        {/* Helper text, error, or success messages */}
        {(error || success || helperText) && (
          <div className="mt-1 space-y-1">
            {error && (
              <p 
                id={`${props.id}-error`}
                className="text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}
            {success && !error && (
              <p 
                id={`${props.id}-success`}
                className="text-sm text-green-600"
              >
                {success}
              </p>
            )}
            {helperText && !error && !success && (
              <p 
                id={`${props.id}-helper`}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
        
        {/* Character count (when shown separately) */}
        {showCharacterCount && maxLength && !rightIcon && !loading && (
          <div className="mt-1 flex justify-end">
            <span 
              id={`${props.id}-count`}
              className="text-xs text-gray-500"
            >
              {characterCount}/{maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';