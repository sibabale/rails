import React, { useState, useCallback } from 'react';
import { cn } from '../../ui/utils';
import type { FormFieldProps, FormFieldState, FormFieldEvents } from './FormField.interface';

/**
 * FormField molecule component that combines form input with label, validation, and helper text
 * Follows atomic design principles and provides comprehensive form field functionality
 */
export function FormField({
  label,
  name,
  id,
  required = false,
  error,
  success,
  helperText,
  disabled = false,
  loading = false,
  className,
  style,
  children,
  showLabel = true,
  labelPosition = 'top',
  labelSize = 'md',
  compact = false,
  showCharacterCount = false,
  maxLength,
  characterCount: propCharacterCount,
  onFocus,
  onBlur,
  onChange,
  onClick,
  ...rest
}: FormFieldProps & FormFieldEvents) {
  // Internal state management
  const [state, setState] = useState<FormFieldState>({
    isFocused: false,
    hasValue: false,
    isDirty: false,
    isValid: !error,
    isTouched: false,
  });

  // Generate ID if not provided
  const fieldId = id || `field-${name}`;
  const errorId = `${fieldId}-error`;
  const successId = `${fieldId}-success`;
  const helperId = `${fieldId}-helper`;
  const characterCountId = `${fieldId}-count`;

  // Handle focus events
  const handleFocus = useCallback((event: React.FocusEvent) => {
    setState(prev => ({ ...prev, isFocused: true }));
    onFocus?.(event);
  }, [onFocus]);

  // Handle blur events
  const handleBlur = useCallback((event: React.FocusEvent) => {
    setState(prev => ({ 
      ...prev, 
      isFocused: false, 
      isTouched: true 
    }));
    onBlur?.(event);
  }, [onBlur]);

  // Handle change events
  const handleChange = useCallback((event: React.ChangeEvent) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const hasValue = target.value.length > 0;
    
    setState(prev => ({
      ...prev,
      hasValue,
      isDirty: true,
      isValid: !error,
    }));
    
    onChange?.(event);
  }, [onChange, error]);

  // Handle click events
  const handleClick = useCallback((event: React.MouseEvent) => {
    onClick?.(event);
  }, [onClick]);

  // Calculate character count
  const currentCharacterCount = propCharacterCount || 0;
  const isOverLimit = maxLength && currentCharacterCount > maxLength;

  // Label size classes
  const labelSizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Label position classes
  const getLabelPositionClasses = () => {
    switch (labelPosition) {
      case 'left':
        return 'flex items-center space-x-3';
      case 'right':
        return 'flex items-center space-x-3 flex-row-reverse space-x-reverse';
      default:
        return 'space-y-2';
    }
  };

  // Container classes
  const containerClasses = cn(
    'form-field',
    getLabelPositionClasses(),
    compact && 'space-y-1',
    disabled && 'opacity-60 pointer-events-none',
    loading && 'opacity-70',
    className
  );

  // Label classes
  const labelClasses = cn(
    'form-field__label',
    labelSizeClasses[labelSize],
    'font-medium leading-none text-gray-700',
    required && 'after:content-["*"] after:ml-1 after:text-red-500',
    disabled && 'cursor-not-allowed',
    labelPosition !== 'top' && 'flex-shrink-0'
  );

  // Field wrapper classes for non-top label positions
  const fieldWrapperClasses = cn(
    'form-field__wrapper',
    labelPosition !== 'top' && 'flex-1'
  );

  // Render character count
  const renderCharacterCount = () => {
    if (!showCharacterCount) return null;

    return (
      <div 
        id={characterCountId}
        className={cn(
          'form-field__character-count',
          'text-xs text-right',
          isOverLimit ? 'text-red-500' : 'text-gray-500'
        )}
      >
        {maxLength ? `${currentCharacterCount}/${maxLength}` : currentCharacterCount}
      </div>
    );
  };

  // Render error message
  const renderError = () => {
    if (!error) return null;

    return (
      <div 
        id={errorId}
        className="form-field__error text-sm text-red-500 flex items-center gap-1"
        role="alert"
        aria-live="assertive"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </div>
    );
  };

  // Render success message
  const renderSuccess = () => {
    if (!success) return null;

    return (
      <div 
        id={successId}
        className="form-field__success text-sm text-green-600 flex items-center gap-1"
        role="status"
        aria-live="polite"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {success}
      </div>
    );
  };

  // Render helper text
  const renderHelperText = () => {
    if (!helperText) return null;

    return (
      <div 
        id={helperId}
        className="form-field__helper text-sm text-gray-600"
      >
        {helperText}
      </div>
    );
  };

  // Build aria-describedby
  const buildAriaDescribedBy = () => {
    const ids = [];
    if (error) ids.push(errorId);
    if (success) ids.push(successId);
    if (helperText) ids.push(helperId);
    if (showCharacterCount) ids.push(characterCountId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  };

  // Clone children with additional props
  const enhancedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        id: fieldId,
        name,
        required,
        disabled: disabled || loading,
        'aria-invalid': !!error,
        'aria-describedby': buildAriaDescribedBy(),
        onFocus: handleFocus,
        onBlur: handleBlur,
        onChange: handleChange,
        onClick: handleClick,
        ...(children.props || {}),
      })
    : children;

  return (
    <div 
      className={containerClasses}
      style={style}
      data-field-name={name}
      data-field-state={JSON.stringify({
        focused: state.isFocused,
        touched: state.isTouched,
        dirty: state.isDirty,
        valid: state.isValid,
        hasValue: state.hasValue,
      })}
    >
      {showLabel && (
        <label 
          htmlFor={fieldId}
          className={labelClasses}
        >
          {label}
        </label>
      )}
      
      <div className={fieldWrapperClasses}>
        <div className="form-field__input-wrapper">
          {enhancedChildren}
        </div>
        
        <div className="form-field__feedback space-y-1 mt-1">
          {renderError()}
          {renderSuccess()}
          {renderHelperText()}
          {renderCharacterCount()}
        </div>
      </div>
    </div>
  );
}

// Export the component with display name for debugging
FormField.displayName = 'FormField';

export default FormField;