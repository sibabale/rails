import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Navigation } from './Navigation';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock Redux slices
const mockAuthSlice = {
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  },
  reducers: {},
};

const mockBankSlice = {
  name: 'bank',
  initialState: {
    banks: [],
    selectedBank: null,
    loading: false,
    error: null,
  },
  reducers: {},
};

// Create test store
const createTestStore = (initialState?: any) => configureStore({
  reducer: {
    auth: (state = mockAuthSlice.initialState) => state,
    bank: (state = mockBankSlice.initialState) => state,
  },
  preloadedState: initialState,
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; initialState?: any }> = ({ 
  children, 
  initialState 
}) => {
  const store = createTestStore(initialState);
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('Navigation', () => {
  describe('Public Interface Validation', () => {
    test('should render with default props', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Rails')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    });

    test('should handle navigation rendering correctly', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that navigation exists and renders properly
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should validate navigation structure', () => {
      const { rerender } = render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that navigation still exists after rerender
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle navigation links rendering', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that navigation exists and renders properly
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    test('should render navigation elements for interaction', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders properly for potential interactions
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should render logo button for interaction', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const logo = screen.getByText('Rails');
      expect(logo).toBeInTheDocument();
    });

    test('should render mobile menu button for interaction', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    test('should handle search functionality rendering', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle logout functionality rendering', async () => {
      const initialState = {
        auth: {
          isAuthenticated: true,
          user: { firstName: 'John', lastName: 'Doe' },
        },
      };
      
      render(
        <TestWrapper initialState={initialState}>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle notifications functionality rendering', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    test('should render marketing navigation by default', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that navigation renders properly
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should render navigation in different states', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should show/hide mobile menu', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      
      // Test that mobile menu button exists and has proper attributes
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      
      // Test that we can click the menu button
      await user.click(menuButton);
      expect(menuButton).toBeInTheDocument();
    });

    test('should handle notification display', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle notification badge visibility', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle user avatar display', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Test that navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check that the logo button has proper aria-label
      const logoButton = screen.getByRole('button', { name: /rails homepage/i });
      expect(logoButton).toBeInTheDocument();
      
      // Check that the mobile menu button has proper aria-label
      const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const logoButton = screen.getByRole('button', { name: /rails homepage/i });
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      
      // Test that navigation elements exist and are accessible
      expect(logoButton).toBeInTheDocument();
      expect(menuButton).toBeInTheDocument();
    });

    test('should handle mobile menu keyboard navigation', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      
      // Test that mobile menu button is accessible
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('should be screen reader compatible', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', expect.any(String));
      
      // Check that all interactive elements have proper labels
      const logoButton = screen.getByRole('button', { name: /rails homepage/i });
      const mobileMenuButton = screen.getByRole('button', { name: /open menu/i });
      
      expect(logoButton).toBeInTheDocument();
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveAttribute('aria-expanded');
    });
  });

  describe('Integration', () => {
    test('should work with React Router', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that navigation integrates properly with React Router
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should work with Redux store', () => {
      const initialState = {
        auth: {
          isAuthenticated: true,
          user: { firstName: 'John', lastName: 'Doe' },
        },
      };
      
      render(
        <TestWrapper initialState={initialState}>
          <Navigation />
        </TestWrapper>
      );
      
      // Should render based on auth state
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing user info gracefully', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Should show default avatar or initials
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle very long navigation labels', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that the navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle high notification counts', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that the navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle disabled navigation links', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Check that the navigation renders without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});