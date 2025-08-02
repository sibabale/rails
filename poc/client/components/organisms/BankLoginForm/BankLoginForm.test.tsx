import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BankLoginForm } from './BankLoginForm';
import type { BankLoginFormProps } from './BankLoginForm.interface';
import authReducer from '../../../lib/slices/authSlice';
import bankReducer from '../../../lib/slices/bankSlice';

// Mock dependencies
jest.mock('../../../lib/api', () => ({
  loginBank: jest.fn(),
}));

jest.mock('../../../lib/tokenManager', () => ({
  tokenManager: {
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
    getAccessToken: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Create test store
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
    bank: bankReducer,
  },
  preloadedState: {
    auth: {
      loading: false,
      error: null,
      isAuthenticated: false,
      user: null,
    },
    bank: {
      loading: false,
      error: null,
      banks: [],
      selectedBank: null,
    },
  },
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createTestStore();
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('BankLoginForm', () => {
  describe('Public Interface Validation', () => {
    test('should render with required props', () => {
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bank code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      const customProps: BankLoginFormProps = {
        loading: true,
        error: 'Test error message',
        success: 'Test success message',
        showTitle: true,
        title: 'Custom Login Title',
        description: 'Custom description',
        showHelp: true,
        showRegistrationLink: true,
        registrationLinkText: 'Custom Register',
        autoFocus: true,
        validateOnBlur: true,
        validateOnChange: true,
      };

      render(
        <TestWrapper>
          <BankLoginForm {...customProps} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Custom Login Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Test success message')).toBeInTheDocument();
      expect(screen.getByText('Custom Register')).toBeInTheDocument();
    });

    test('should validate prop types', () => {
      const { rerender } = render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      expect(screen.getByRole('form')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <BankLoginForm loading={true} />
        </TestWrapper>
      );
      
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    test('should handle custom validation rules', () => {
      const customValidation = {
        validationRules: {
          email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Custom email error',
          },
          bankCode: {
            required: true,
            pattern: /^[A-Z0-9]{6,11}$/,
            message: 'Custom bank code error',
          },
          authToken: {
            required: true,
            minLength: 10,
            message: 'Custom auth token error',
          },
        },
      };

      render(
        <TestWrapper>
          <BankLoginForm {...customValidation} />
        </TestWrapper>
      );
      
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    test('should call onSubmit with correct data', async () => {
      const handleSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm onSubmit={handleSubmit} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const authTokenInput = screen.getByLabelText(/api key/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(bankCodeInput, 'TESTBANK');
      await user.type(authTokenInput, 'test-token-123');
      await user.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        bankCode: 'TESTBANK',
        authToken: 'test-token-123',
      });
    });

    test('should call onSubmitError when validation fails', async () => {
      const handleSubmitError = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm onSubmitError={handleSubmitError} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      expect(handleSubmitError).toHaveBeenCalled();
    });

    test('should call onChange when form data changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm onChange={handleChange} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      await user.type(emailInput, 'test@example.com');
      
      expect(handleChange).toHaveBeenCalledWith({
        email: 'test@example.com',
        bankCode: '',
        authToken: '',
      });
    });

    test('should call onValidationError when validation fails', async () => {
      const handleValidationError = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm onValidationError={handleValidationError} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      expect(handleValidationError).toHaveBeenCalled();
    });

    test('should call onRegistrationClick when registration link is clicked', async () => {
      const handleRegistrationClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm 
            showRegistrationLink={true}
            onRegistrationClick={handleRegistrationClick}
          />
        </TestWrapper>
      );
      
      const registrationLink = screen.getByText(/register your bank/i);
      await user.click(registrationLink);
      
      expect(handleRegistrationClick).toHaveBeenCalled();
    });

    test('should call onHelpRequest when help is requested', async () => {
      const handleHelpRequest = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm 
            showHelp={true}
            onHelpRequest={handleHelpRequest}
          />
        </TestWrapper>
      );
      
      const helpButton = screen.getByRole('button', { name: /help/i });
      await user.click(helpButton);
      
      expect(handleHelpRequest).toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    test('should render loading state', () => {
      render(
        <TestWrapper>
          <BankLoginForm loading={true} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /signing in/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    test('should render error state', () => {
      render(
        <TestWrapper>
          <BankLoginForm error="Invalid credentials" />
        </TestWrapper>
      );
      
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials')).toHaveClass('text-red-600');
    });

    test('should render success state', () => {
      render(
        <TestWrapper>
          <BankLoginForm success="Login successful" />
        </TestWrapper>
      );
      
      expect(screen.getByText('Login successful')).toBeInTheDocument();
      expect(screen.getByText('Login successful')).toHaveClass('text-green-600');
    });

    test('should render disabled state', () => {
      render(
        <TestWrapper>
          <BankLoginForm loading={true} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const authTokenInput = screen.getByLabelText(/api key/i);
      const submitButton = screen.getByRole('button', { name: /signing in/i });
      
      expect(emailInput).toBeDisabled();
      expect(bankCodeInput).toBeDisabled();
      expect(authTokenInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    test('should toggle auth token visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const authTokenInput = screen.getByLabelText(/api key/i);
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
      
      expect(authTokenInput).toHaveAttribute('type', 'password');
      
      await user.click(toggleButton);
      expect(authTokenInput).toHaveAttribute('type', 'text');
      
      await user.click(toggleButton);
      expect(authTokenInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bank code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const authTokenInput = screen.getByLabelText(/api key/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(bankCodeInput).toHaveFocus();
      
      await user.tab();
      expect(authTokenInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    test('should be screen reader compatible', () => {
      render(
        <TestWrapper>
          <BankLoginForm 
            error="Invalid credentials"
            helperText="Enter your bank credentials"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('Invalid credentials')).toHaveAttribute('role', 'alert');
      expect(screen.getByText('Enter your bank credentials')).toBeInTheDocument();
    });

    test('should handle loading state accessibility', () => {
      render(
        <TestWrapper>
          <BankLoginForm loading={true} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Integration', () => {
    test('should work with Redux store', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const authTokenInput = screen.getByLabelText(/api key/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(bankCodeInput, 'TESTBANK');
      await user.type(authTokenInput, 'test-token-123');
      await user.click(submitButton);
      
      // Should dispatch Redux actions
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    test('should work with React Router', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm showRegistrationLink={true} />
        </TestWrapper>
      );
      
      const registrationLink = screen.getByText(/register your bank/i);
      expect(registrationLink).toHaveAttribute('href', '/register');
    });

    test('should work with token manager', async () => {
      const { tokenManager } = require('../../../lib/tokenManager');
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const authTokenInput = screen.getByLabelText(/api key/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(bankCodeInput, 'TESTBANK');
      await user.type(authTokenInput, 'test-token-123');
      await user.click(submitButton);
      
      // Should call token manager on successful login
      await waitFor(() => {
        expect(tokenManager.setTokens).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty form submission', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/bank code is required/i)).toBeInTheDocument();
      expect(screen.getByText(/auth token is required/i)).toBeInTheDocument();
    });

    test('should handle invalid email format', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    test('should handle invalid bank code format', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(bankCodeInput, 'invalid-bank-code');
      await user.click(submitButton);
      
      expect(screen.getByText(/invalid bank code format/i)).toBeInTheDocument();
    });

    test('should handle very long input values', async () => {
      const user = userEvent.setup();
      const longEmail = 'a'.repeat(1000) + '@example.com';
      const longBankCode = 'A'.repeat(100);
      const longAuthToken = 'token'.repeat(100);
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const authTokenInput = screen.getByLabelText(/api key/i);
      
      await user.type(emailInput, longEmail);
      await user.type(bankCodeInput, longBankCode);
      await user.type(authTokenInput, longAuthToken);
      
      expect(emailInput).toHaveValue(longEmail);
      expect(bankCodeInput).toHaveValue(longBankCode);
      expect(authTokenInput).toHaveValue(longAuthToken);
    });

    test('should handle special characters in input', async () => {
      const user = userEvent.setup();
      const specialEmail = 'test+special@example.com';
      const specialBankCode = 'TEST-BANK_123';
      const specialAuthToken = 'token!@#$%^&*()';
      
      render(
        <TestWrapper>
          <BankLoginForm />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/admin email/i);
      const bankCodeInput = screen.getByLabelText(/bank code/i);
      const authTokenInput = screen.getByLabelText(/api key/i);
      
      await user.type(emailInput, specialEmail);
      await user.type(bankCodeInput, specialBankCode);
      await user.type(authTokenInput, specialAuthToken);
      
      expect(emailInput).toHaveValue(specialEmail);
      expect(bankCodeInput).toHaveValue(specialBankCode);
      expect(authTokenInput).toHaveValue(specialAuthToken);
    });
  });
}); 