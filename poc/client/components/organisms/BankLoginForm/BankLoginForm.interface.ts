import React from 'react';

export interface BankLoginFormProps {
  /** Whether the form is in a loading state */
  loading?: boolean;
  
  /** Error message to display */
  error?: string;
  
  /** Success message to display */
  success?: string;
  
  /** CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Whether to show the form title */
  showTitle?: boolean;
  
  /** Custom form title */
  title?: string;
  
  /** Custom form description */
  description?: string;
  
  /** Whether to show the help section */
  showHelp?: boolean;
  
  /** Whether to show the registration link */
  showRegistrationLink?: boolean;
  
  /** Custom registration link text */
  registrationLinkText?: string;
  
  /** Custom registration link URL */
  registrationLinkUrl?: string;
  
  /** Whether to auto-focus the first field */
  autoFocus?: boolean;
  
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  
  /** Whether to validate on change */
  validateOnChange?: boolean;
  
  /** Custom validation rules */
  validationRules?: {
    email?: {
      required?: boolean;
      pattern?: RegExp;
      message?: string;
    };
    bankCode?: {
      required?: boolean;
      pattern?: RegExp;
      message?: string;
    };
    authToken?: {
      required?: boolean;
      minLength?: number;
      message?: string;
    };
  };
}

export interface BankLoginFormState {
  /** Form data */
  formData: {
    email: string;
    bankCode: string;
    authToken: string;
  };
  
  /** Form errors */
  errors: {
    email?: string;
    bankCode?: string;
    authToken?: string;
  };
  
  /** Whether the form is valid */
  isValid: boolean;
  
  /** Whether the form is dirty */
  isDirty: boolean;
  
  /** Whether the form is submitting */
  isSubmitting: boolean;
  
  /** Whether to show the auth token */
  showAuthToken: boolean;
  
  /** Whether the form has been submitted */
  hasSubmitted: boolean;
}

export interface BankLoginFormEvents {
  /** Called when form is submitted successfully */
  onSubmit?: (data: BankLoginFormState['formData']) => void;
  
  /** Called when form submission fails */
  onSubmitError?: (error: string) => void;
  
  /** Called when form data changes */
  onChange?: (data: BankLoginFormState['formData']) => void;
  
  /** Called when form validation fails */
  onValidationError?: (errors: BankLoginFormState['errors']) => void;
  
  /** Called when form is reset */
  onReset?: () => void;
  
  /** Called when registration link is clicked */
  onRegistrationClick?: () => void;
  
  /** Called when help is requested */
  onHelpRequest?: () => void;
}

export interface BankLoginFormValidation {
  /** Validate email field */
  validateEmail: (email: string) => string | undefined;
  
  /** Validate bank code field */
  validateBankCode: (bankCode: string) => string | undefined;
  
  /** Validate auth token field */
  validateAuthToken: (authToken: string) => string | undefined;
  
  /** Validate entire form */
  validateForm: (data: BankLoginFormState['formData']) => BankLoginFormState['errors'];
}

 