import { ReactNode } from 'react';

// Core Props Interface
export interface BankRegistrationFormProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  onRegistrationSuccess?: (registrationData: BankRegistration) => void;
  onRegistrationError?: (error: string) => void;
  initialData?: Partial<BankRegistration>;
}

// Bank Registration Data Structure
export interface BankRegistration {
  bankName: string;
  bankCode: string;
  contactEmail: string;
  contactPhone: string;
  address: BankAddress;
  adminUser: AdminUser;
  businessDetails: BusinessDetails;
  compliance: ComplianceDetails;
}

// Address Information
export interface BankAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

// Admin User Information
export interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  position: string;
}

// Business Details
export interface BusinessDetails {
  registrationNumber: string;
  vatNumber?: string;
  website?: string;
  establishedYear: number;
  bankType: BankType;
  expectedVolume: ExpectedVolume;
}

// Compliance Information
export interface ComplianceDetails {
  sarb_registered: boolean;
  sarb_license_number?: string;
  fica_compliant: boolean;
  popi_compliant: boolean;
  accepts_terms: boolean;
}

// Form State Management
export interface BankRegistrationFormState {
  currentStep: number;
  formData: Partial<BankRegistration>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError?: string;
}

// Form Step Configuration
export interface FormStep {
  stepNumber: number;
  title: string;
  description: string;
  icon: ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  fields: FormField[];
}

// Form Field Configuration
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  validation?: ValidationRule[];
  options?: SelectOption[];
  maxLength?: number;
  section?: string;
}

// Form Step Props
export interface FormStepProps {
  children: ReactNode;
  title: string;
  description: string;
  icon: ReactNode;
  isActive: boolean;
}

// Event Handlers
export interface BankRegistrationFormEvents {
  onStepChange?: (step: number) => void;
  onFieldChange?: (fieldName: string, value: any, section?: string) => void;
  onValidationError?: (errors: Record<string, string>) => void;
  onFormSubmit?: (formData: BankRegistration) => void;
  onFormReset?: () => void;
}

// Validation Rules
export interface ValidationRule {
  type: ValidationType;
  message: string;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

// Select Option
export interface SelectOption {
  value: string;
  label: string;
}

// Type Definitions
export type BankType = 'commercial' | 'mutual' | 'cooperative' | 'investment';
export type ExpectedVolume = 'low' | 'medium' | 'high' | 'enterprise';
export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'select' | 'checkbox' | 'url';
export type ValidationType = 'required' | 'email' | 'phone' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max';
export type RegistrationStep = 1 | 2 | 3 | 4;

// Constants
export interface ProvinceList {
  readonly provinces: readonly string[];
}

export interface BankTypeList {
  readonly types: readonly {
    value: BankType;
    label: string;
  }[];
}

export interface ExpectedVolumeList {
  readonly volumes: readonly {
    value: ExpectedVolume;
    label: string;
  }[];
}

// Form Utilities
export interface FormValidation {
  validateStep: (step: number, formData: Partial<BankRegistration>) => Record<string, string>;
  validateField: (fieldName: string, value: any, rules: ValidationRule[]) => string | null;
  validateBankCode: (code: string) => boolean;
  validateIdNumber: (idNumber: string) => boolean;
  validatePhoneNumber: (phone: string) => boolean;
}

// Form Data Management
export interface FormDataManager {
  updateBasicField: (field: string, value: any) => void;
  updateSectionField: (section: string, field: string, value: any) => void;
  clearFieldError: (fieldName: string) => void;
  resetForm: () => void;
  getFieldValue: (fieldName: string, section?: string) => any;
}

// Step Navigation
export interface StepNavigation {
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
}

// Progress Tracking
export interface ProgressIndicator {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  progressPercentage: number;
}

// Success State
export interface RegistrationSuccess {
  isSuccess: boolean;
  message: string;
  nextSteps: string[];
  registrationId?: string;
  apiCredentials?: {
    keyReceived: boolean;
    emailSent: boolean;
  };
}

// Error Handling
export interface RegistrationError {
  hasError: boolean;
  message: string;
  field?: string;
  code?: string;
  retryable: boolean;
}

// Styling Configuration
export interface FormStyling {
  inputStyle: React.CSSProperties;
  errorInputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  disabledButtonStyle: React.CSSProperties;
  cardStyle: React.CSSProperties;
  stepIndicatorStyle: React.CSSProperties;
}

// Animation Configuration
export interface FormAnimations {
  stepTransition: {
    initial: { opacity: number; x: number };
    animate: { opacity: number; x: number };
    exit: { opacity: number; x: number };
  };
  successAnimation: {
    initial: { opacity: number; scale: number };
    animate: { opacity: number; scale: number };
  };
  errorAnimation: {
    initial: { opacity: number; y: number };
    animate: { opacity: number; y: number };
  };
}

// Utility Types
export type BankRegistrationFormComponent = React.FC<BankRegistrationFormProps>;
export type FormStepComponent = React.FC<FormStepProps>;
export type StepValidator = (formData: Partial<BankRegistration>) => Record<string, string>;
export type FieldUpdater = (section: string, field: string, value: any) => void;