import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FormField } from './FormField';
import type { FormFieldProps } from './FormField.interface';

// Mock Input component for testing
const MockInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ ...props }, ref) => <input ref={ref} {...props} />
);
MockInput.displayName = 'MockInput';

// Mock TextArea component for testing
const MockTextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ ...props }, ref) => <textarea ref={ref} {...props} />
);
MockTextArea.displayName = 'MockTextArea';

describe('FormField', () => {
  const defaultProps: FormFieldProps = {
    label: 'Test Field',
    name: 'testField',
    children: <MockInput placeholder="Enter value" />,
  };

  describe('Public Interface Validation', () => {
    test('should render with required props', () => {
      render(<FormField {...defaultProps} />);
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      render(
        <FormField
          {...defaultProps}
          id="custom-id"
          required
          error="Field is required"
          helperText="This is a helper text"
          disabled
        />
      );
      
      const label = screen.getByText('Test Field');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveClass('after:content-["*"]'); // Required asterisk
      expect(input).toHaveAttribute('id', 'custom-id');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(screen.getByText('This is a helper text')).toBeInTheDocument();
    });

    test('should generate ID when not provided', () => {
      render(<FormField {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'field-testField');
    });

    test('should handle success state', () => {
      render(
        <FormField
          {...defaultProps}
          success="Field is valid"
        />
      );
      
      expect(screen.getByText('Field is valid')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should handle loading state', () => {
      render(<FormField {...defaultProps} loading />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Label Positioning and Sizing', () => {
    test('should render label at different positions', () => {
      const { rerender } = render(
        <FormField {...defaultProps} labelPosition="top" />
      );
      expect(screen.getByText('Test Field')).toBeInTheDocument();

      rerender(<FormField {...defaultProps} labelPosition="left" />);
      expect(screen.getByText('Test Field')).toBeInTheDocument();

      rerender(<FormField {...defaultProps} labelPosition="right" />);
      expect(screen.getByText('Test Field')).toBeInTheDocument();
    });

    test('should render label at different sizes', () => {
      const { rerender } = render(
        <FormField {...defaultProps} labelSize="sm" />
      );
      const label = screen.getByText('Test Field');
      expect(label).toHaveClass('text-sm');

      rerender(<FormField {...defaultProps} labelSize="md" />);
      expect(label).toHaveClass('text-sm');

      rerender(<FormField {...defaultProps} labelSize="lg" />);
      expect(label).toHaveClass('text-base');
    });

    test('should hide label when showLabel is false', () => {
      render(<FormField {...defaultProps} showLabel={false} />);
      
      expect(screen.queryByText('Test Field')).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    test('should show character count when enabled', () =>[
      render(
        <FormField
          {...defaultProps}
          showCharacterCount
          characterCount={10}
          maxLength={50}
        />
      );
      
      expect(screen.getByText('10/50')).toBeInTheDocument();
    });

    test('should show character count without max length', () => {
      render(
        <FormField
          {...defaultProps}
          showCharacterCount
          characterCount={25}
        />
      );
      
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    test('should highlight when over limit', () => {
      render(
        <FormField
          {...defaultProps}
          showCharacterCount
          characterCount={60}
          maxLength={50}
        />
      );
      
      const characterCount = screen.getByText('60/50');
      expect(characterCount).toHaveClass('text-red-500');
    });
  });

  describe('Event Handling', () => {
    test('should call onFocus with correct data', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();
      
      render(
        <FormField
          {...defaultProps}
          onFocus={handleFocus}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    test('should call onBlur with correct data', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(
        <FormField
          {...defaultProps}
          onBlur={handleBlur}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    test('should call onChange with correct data', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <FormField
          {...defaultProps}
          onChange={handleChange}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
    });

    test('should call onClick with correct data', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <FormField
          {...defaultProps}
          onClick={handleClick}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual States', () => {
    test('should apply compact layout', () => {
      render(<FormField {...defaultProps} compact />);
      
      const container = screen.getByRole('textbox').closest('.form-field');
      expect(container).toHaveClass('space-y-1');
    });

    test('should handle disabled state', () => {
      render(<FormField {...defaultProps} disabled />);
      
      const input = screen.getByRole('textbox');
      const container = input.closest('.form-field');
      
      expect(input).toBeDisabled();
      expect(container).toHaveClass('opacity-60', 'pointer-events-none');
    });

    test('should handle loading state', () => {
      render(<FormField {...defaultProps} loading />);
      
      const input = screen.getByRole('textbox');
      const container = input.closest('.form-field');
      
      expect(input).toBeDisabled();
      expect(container).toHaveClass('opacity-70');
    });

    test('should render error state with proper styling', () => {
      render(
        <FormField
          {...defaultProps}
          error="This field has an error"
        />
      );
      
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('This field has an error');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toHaveClass('text-red-500');
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
    });

    test('should render success state with proper styling', () => {
      render(
        <FormField
          {...defaultProps}
          success="Field is valid"
        />
      );
      
      const successMessage = screen.getByText('Field is valid');
      expect(successMessage).toHaveClass('text-green-600');
      expect(successMessage.closest('[role="status"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(
        <FormField
          {...defaultProps}
          error="Error message"
          helperText="Helper text"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      
      const ariaDescribedBy = input.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toContain('field-testField-error');
      expect(ariaDescribedBy).toContain('field-testField-helper');
    });

    test('should associate label with input', () => {
      render(<FormField {...defaultProps} />);
      
      const label = screen.getByText('Test Field');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'field-testField');
      expect(input).toHaveAttribute('id', 'field-testField');
    });

    test('should have proper role attributes for messages', () => {
      render(
        <FormField
          {...defaultProps}
          error="Error message"
          success="Success message"
        />
      );
      
      const errorElement = screen.getByText('Error message');
      const successElement = screen.getByText('Success message');
      
      expect(errorElement.closest('[role="alert"]')).toBeInTheDocument();
      expect(successElement.closest('[role="status"]')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<FormField {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Integration', () => {
    test('should work with different input types', () => {
      const { rerender } = render(
        <FormField
          {...defaultProps}
          children={<MockInput type="email" />}
        />
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(
        <FormField
          {...defaultProps}
          children={<MockInput type="password" />}
        />
      );
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
    });

    test('should work with textarea', () => {
      render(
        <FormField
          {...defaultProps}
          children={<MockTextArea placeholder="Enter description" />}
        />
      );
      
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('should pass through additional props to children', () => {
      render(
        <FormField
          {...defaultProps}
          children={<MockInput data-testid="custom-input" className="custom-class" />}
        />
      );
      
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveClass('custom-class');
    });

    test('should maintain field state data attributes', async () => {
      const user = userEvent.setup();
      
      render(<FormField {...defaultProps} />);
      
      const container = screen.getByRole('textbox').closest('.form-field');
      const input = screen.getByRole('textbox');
      
      // Initial state
      expect(container).toHaveAttribute('data-field-name', 'testField');
      
      // Focus state
      await user.click(input);
      await waitFor(() => {
        const stateData = JSON.parse(container?.getAttribute('data-field-state') || '{}');
        expect(stateData.focused).toBe(true);
      });
      
      // Change state
      await user.type(input, 'test');
      await waitFor(() => {
        const stateData = JSON.parse(container?.getAttribute('data-field-state') || '{}');
        expect(stateData.dirty).toBe(true);
        expect(stateData.hasValue).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null children', () => {
      render(
        <FormField
          label="Empty Field"
          name="empty"
          children={null}
        />
      );
      
      expect(screen.getByText('Empty Field')).toBeInTheDocument();
    });

    test('should handle very long labels', () => {
      const longLabel = 'A'.repeat(200);
      render(
        <FormField
          {...defaultProps}
          label={longLabel}
        />
      );
      
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    test('should handle special characters in messages', () => {
      render(
        <FormField
          {...defaultProps}
          error="Error with special chars: !@#$%^&*()"
          success="Success with émojis: 🎉✅"
          helperText="Helper with <script>alert('xss')</script>"
        />
      );
      
      expect(screen.getByText("Error with special chars: !@#$%^&*()")).toBeInTheDocument();
      expect(screen.getByText("Success with émojis: 🎉✅")).toBeInTheDocument();
      expect(screen.getByText("Helper with <script>alert('xss')</script>")).toBeInTheDocument();
    });

    test('should handle multiple simultaneous states', () => {
      render(
        <FormField
          {...defaultProps}
          required
          disabled
          loading
          error="Error message"
          success="Success message"
          helperText="Helper text"
          showCharacterCount
          characterCount={10}
          maxLength={50}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Helper text')).toBeInTheDocument();
      expect(screen.getByText('10/50')).toBeInTheDocument();
    });
  });
});