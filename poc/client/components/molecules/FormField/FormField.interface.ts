import React from 'react';

export interface FormFieldProps {
  /** Field label */
  label: string;
  
  /** Field name for form association */
  name: string;
  
  /** Field ID for accessibility */
  id?: string;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Error message to display */
  error?: string;
  
  /** Success message to display */
  success?: string;
  
  /** Helper text to display */
  helperText?: string;
  
  /** Whether the field is disabled */
  disabled?: boolean;
  
  /** Whether the field is loading */
  loading?: boolean;
  
  /** CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Children (the actual input component) */
  children: React.ReactNode;
  
  /** Whether to show the label */
  showLabel?: boolean;
  
  /** Label position */
  labelPosition?: 'top' | 'left' | 'right';
  
  /** Label size */
  labelSize?: 'sm' | 'md' | 'lg';
  
  /** Whether the field is in a compact layout */
  compact?: boolean;
  
  /** Whether to show character count */
  showCharacterCount?: boolean;
  
  /** Maximum character count */
  maxLength?: number;
  
  /** Current character count */
  characterCount?: number;
}

export interface FormFieldState {
  /** Whether the field is focused */
  isFocused: boolean;
  
  /** Whether the field has a value */
  hasValue: boolean;
  
  /** Whether the field is dirty (has been modified) */
  isDirty: boolean;
  
  /** Whether the field is valid */
  isValid: boolean;
  
  /** Whether the field has been touched */
  isTouched: boolean;
}

export interface FormFieldEvents {
  /** Called when field gains focus */
  onFocus?: (event: React.FocusEvent) => void;
  
  /** Called when field loses focus */
  onBlur?: (event: React.FocusEvent) => void;
  
  /** Called when field value changes */
  onChange?: (event: React.ChangeEvent) => void;
  
  /** Called when field is clicked */
  onClick?: (event: React.MouseEvent) => void;
}

export type FormFieldLabelPosition = FormFieldProps['labelPosition'];
export type FormFieldLabelSize = FormFieldProps['labelSize'];

 