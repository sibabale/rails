import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Input } from './Input';
import type { InputProps } from './Input.interface';

describe('Input', () => {
  describe('Public Interface Validation', () => {
    test('should render with required props', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      render(
        <Input 
          variant="error" 
          size="lg" 
          disabled 
          placeholder="Enter text"
          value="test value"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('h-10'); // lg size
      expect(input).toHaveClass('border-red-500'); // error variant
      expect(input).toHaveAttribute('placeholder', 'Enter text');
      expect(input).toHaveValue('test value');
    });

    test('should validate prop types', () => {
      const { rerender } = render(<Input variant="default" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      rerender(<Input variant="error" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      rerender(<Input variant="success" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      rerender(<Input variant="warning" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('should handle loading state', () => {
      render(<Input loading />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      // Loading spinner should be present in the DOM
      expect(input.parentElement?.querySelector('[class*="animate"]')).toBeInTheDocument();
    });

    test('should render with icons', () => {
      const TestIcon = () => <span data-testid="icon">🔍</span>;
      
      render(
        <Input leftIcon={<TestIcon />} rightIcon={<TestIcon />} />
      );
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getAllByTestId('icon')).toHaveLength(2);
    });

    test('should render with addons', () => {
      render(
        <Input 
          leftAddon={<span data-testid="left-addon">$</span>}
          rightAddon={<span data-testid="right-addon">.00</span>}
        />
      );
      
      expect(screen.getByTestId('left-addon')).toBeInTheDocument();
      expect(screen.getByTestId('right-addon')).toBeInTheDocument();
    });

    test('should show character count', () => {
      render(<Input showCharacterCount maxLength={10} value="test" id="test-input" />);
      
      expect(screen.getByText('4/10')).toBeInTheDocument();
    });

    test('should handle different input types', () => {
      const { rerender } = render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

      rerender(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      expect(screen.getByLabelText(/password/i) || screen.getByRole('textbox')).toHaveAttribute('type', 'password');
    });
  });

  describe('Event Handling', () => {
    test('should call onChange with correct data', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'hello');
      
      expect(handleChange).toHaveBeenCalledTimes(5); // One for each character
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'hello'
          })
        })
      );
    });

    test('should handle focus events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Input onFocus={handleFocus} onBlur={handleBlur} />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    test('should handle keyboard events', async () => {
      const handleKeyDown = jest.fn();
      const handleKeyUp = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      expect(handleKeyDown).toHaveBeenCalled();
      expect(handleKeyUp).toHaveBeenCalled();
    });

    test('should handle clipboard events', async () => {
      const handlePaste = jest.fn();
      const handleCut = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Input onPaste={handlePaste} onCut={handleCut} value="test text" onChange={() => {}} />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      // Select all text and cut
      await user.keyboard('{Control>}a{/Control}');
      await user.keyboard('{Control>}x{/Control}');
      
      expect(handleCut).toHaveBeenCalled();
    });

    test('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onClick={handleClick} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual States', () => {
    test('should render different variants', () => {
      const { rerender } = render(<Input variant="default" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-gray-200');

      rerender(<Input variant="error" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-red-500');

      rerender(<Input variant="success" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-green-500');

      rerender(<Input variant="warning" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-yellow-500');
    });

    test('should render different sizes', () => {
      const { rerender } = render(<Input size="md" />);
      expect(screen.getByRole('textbox')).toHaveClass('h-9');

      rerender(<Input size="sm" />);
      expect(screen.getByRole('textbox')).toHaveClass('h-8');

      rerender(<Input size="lg" />);
      expect(screen.getByRole('textbox')).toHaveClass('h-10');
    });

    test('should show error state and message', () => {
      render(<Input error="This field is required" id="test-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should show success state and message', () => {
      render(<Input success="Valid input" id="test-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-green-500');
      expect(screen.getByText('Valid input')).toBeInTheDocument();
    });

    test('should show helper text', () => {
      render(<Input helperText="Enter your email address" id="test-input" />);
      
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    test('should prioritize error over success', () => {
      render(<Input error="Error message" success="Success message" id="test-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    test('should show loading indicator', () => {
      render(<Input loading />);
      
      const input = screen.getByRole('textbox');
      expect(input.parentElement?.querySelector('[class*="animate"]')).toBeInTheDocument();
    });

    test('should show custom loading indicator', () => {
      const CustomLoader = () => <span data-testid="custom-loader">Loading...</span>;
      
      render(<Input loading loadingIndicator={<CustomLoader />} />);
      
      expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    test('should update character count on input', async () => {
      const user = userEvent.setup();
      
      render(<Input showCharacterCount maxLength={10} id="test-input" />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'hello');
      
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    test('should handle character count with controlled value', () => {
      const { rerender } = render(
        <Input showCharacterCount maxLength={10} value="test" id="test-input" onChange={() => {}} />
      );
      
      expect(screen.getByText('4/10')).toBeInTheDocument();
      
      rerender(
        <Input showCharacterCount maxLength={10} value="test input" id="test-input" onChange={() => {}} />
      );
      
      expect(screen.getByText('10/10')).toBeInTheDocument();
    });

    test('should not show character count when showCharacterCount is false', () => {
      render(<Input maxLength={10} value="test" onChange={() => {}} />);
      
      expect(screen.queryByText('4/10')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<Input aria-label="Search input" />);
      
      const input = screen.getByRole('textbox', { name: 'Search input' });
      expect(input).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.tab();
      expect(input).toHaveFocus();
    });

    test('should be screen reader compatible with error state', () => {
      render(<Input error="Invalid input" id="test-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
      
      const errorMessage = screen.getByText('Invalid input');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    test('should handle multiple aria-describedby values', () => {
      render(
        <Input 
          error="Error message" 
          helperText="Helper text"
          showCharacterCount
          maxLength={10}
          value="test"
          id="test-input"
          onChange={() => {}}
        />
      );
      
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('test-input-error');
    });

    test('should support required field indication', () => {
      render(<Input required aria-label="Required field" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Integration', () => {
    test('should work with form integration', () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
    });

    test('should handle controlled vs uncontrolled state', async () => {
      const user = userEvent.setup();
      
      // Uncontrolled
      const { rerender } = render(<Input defaultValue="initial" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');
      
      // Controlled
      const handleChange = jest.fn();
      rerender(<Input value="controlled" onChange={handleChange} />);
      expect(input).toHaveValue('controlled');
      
      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    test('should work with refs', () => {
      const ref = React.createRef<HTMLInputElement>();
      
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(screen.getByRole('textbox'));
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty value', () => {
      render(<Input value="" onChange={() => {}} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    test('should handle null/undefined values gracefully', () => {
      const { rerender } = render(<Input value={undefined} onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
      
      rerender(<Input value={null as any} onChange={() => {}} />);
      expect(input).toHaveValue('');
    });

    test('should handle numeric values', () => {
      render(<Input type="number" value={42} onChange={() => {}} />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(42);
    });

    test('should handle very long text', async () => {
      const longText = 'A'.repeat(1000);
      const user = userEvent.setup();
      
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, longText);
      expect(input).toHaveValue(longText);
    });

    test('should handle special characters', async () => {
      const specialText = '🚀 Special & Characters! @#$%';
      const user = userEvent.setup();
      
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, specialText);
      expect(input).toHaveValue(specialText);
    });

    test('should handle maxLength constraint', async () => {
      const user = userEvent.setup();
      
      render(<Input maxLength={5} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '1234567890');
      expect(input).toHaveValue('12345'); // Should be truncated
    });

    test('should handle read-only state', async () => {
      const user = userEvent.setup();
      
      render(<Input readOnly value="read only" onChange={() => {}} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      
      await user.type(input, 'should not change');
      expect(input).toHaveValue('read only');
    });

    test('should handle rapid input changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'rapid');
      
      expect(handleChange).toHaveBeenCalledTimes(5);
    });

    test('should maintain focus state correctly', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(
        <div>
          <Input onFocus={handleFocus} onBlur={handleBlur} />
          <Input />
        </div>
      );
      
      const [firstInput, secondInput] = screen.getAllByRole('textbox');
      
      await user.click(firstInput);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.click(secondInput);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });
});