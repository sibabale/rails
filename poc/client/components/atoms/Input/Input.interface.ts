import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Input variant */
  variant?: 'default' | 'error' | 'success' | 'warning';
  
  /** Whether the input is in a loading state */
  loading?: boolean;
  
  /** Loading indicator component */
  loadingIndicator?: React.ReactNode;
  
  /** Left icon or prefix */
  leftIcon?: React.ReactNode;
  
  /** Right icon or suffix */
  rightIcon?: React.ReactNode;
  
  /** Left addon content */
  leftAddon?: React.ReactNode;
  
  /** Right addon content */
  rightAddon?: React.ReactNode;
  
  /** Error message to display */
  error?: string;
  
  /** Success message to display */
  success?: string;
  
  /** Helper text to display */
  helperText?: string;
  
  /** Whether to show character count */
  showCharacterCount?: boolean;
  
  /** Maximum character count */
  maxLength?: number;
  
  /** Whether the input is read-only */
  readOnly?: boolean;
  
  /** Whether the input is required */
  required?: boolean;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Default value */
  defaultValue?: string | number;
  
  /** Controlled value */
  value?: string | number;
  
  /** Whether the input should auto-focus */
  autoFocus?: boolean;
  
  /** Whether the input should auto-complete */
  autoComplete?: string;
  
  /** Input name for form submission */
  name?: string;
  
  /** Input ID for label association */
  id?: string;
  
  /** CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
}

export interface InputState {
  /** Whether the input is focused */
  isFocused: boolean;
  
  /** Whether the input has a value */
  hasValue: boolean;
  
  /** Whether the input is dirty (has been modified) */
  isDirty: boolean;
  
  /** Current character count */
  characterCount: number;
}

export interface InputEvents {
  /** Called when input value changes */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Called when input gains focus */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  /** Called when input loses focus */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  /** Called when input is clicked */
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  
  /** Called when key is pressed */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  
  /** Called when key is released */
  onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  
  /** Called when input is pasted into */
  onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  
  /** Called when input is cut from */
  onCut?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
}

export type InputType = InputProps['type'];
export type InputSize = InputProps['size'];
export type InputVariant = InputProps['variant'];

 