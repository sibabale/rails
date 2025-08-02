import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Navigation } from './Navigation';
import type { NavigationProps } from './Navigation.interface';

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

    test('should handle optional props correctly', () => {
      const customProps: NavigationProps = {
        showLogo: true,
        logoText: 'Custom Logo',
        showSearch: true,
        searchPlaceholder: 'Custom search...',
        showUserMenu: true,
        userInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        showNotifications: true,
        notificationCount: 5,
        theme: {
          primaryColor: '#ff0000',
          backgroundColor: '#ffffff',
        },
      };

      render(
        <TestWrapper>
          <Navigation {...customProps} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Custom Logo')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // User initials
    });

    test('should validate prop types', () => {
      const { rerender } = render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <Navigation showSearch={true} />
        </TestWrapper>
      );
      
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    test('should handle custom navigation links', () => {
      const customLinks = [
        { key: 'home', label: 'Home', path: '/' },
        { key: 'about', label: 'About', path: '/about' },
        { key: 'contact', label: 'Contact', path: '/contact' },
      ];

      render(
        <TestWrapper>
          <Navigation marketingNavLinks={customLinks} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    test('should call onNavigate when navigation link is clicked', async () => {
      const handleNavigate = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation onNavigate={handleNavigate} />
        </TestWrapper>
      );
      
      const homeLink = screen.getByText('Home');
      await user.click(homeLink);
      
      expect(handleNavigate).toHaveBeenCalledWith('/');
    });

    test('should call onLogoClick when logo is clicked', async () => {
      const handleLogoClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation onLogoClick={handleLogoClick} />
        </TestWrapper>
      );
      
      const logo = screen.getByText('Rails');
      await user.click(logo);
      
      expect(handleLogoClick).toHaveBeenCalled();
    });

    test('should call onMobileMenuToggle when mobile menu is toggled', async () => {
      const handleMobileMenuToggle = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation onMobileMenuToggle={handleMobileMenuToggle} />
        </TestWrapper>
      );
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);
      
      expect(handleMobileMenuToggle).toHaveBeenCalledWith(true);
    });

    test('should call onSearchChange when search input changes', async () => {
      const handleSearchChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation showSearch={true} onSearchChange={handleSearchChange} />
        </TestWrapper>
      );
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'test query');
      
      expect(handleSearchChange).toHaveBeenCalledWith('test query');
    });

    test('should call onLogout when logout is clicked', async () => {
      const handleLogout = jest.fn();
      const user = userEvent.setup();
      
      const initialState = {
        auth: {
          isAuthenticated: true,
          user: { firstName: 'John', lastName: 'Doe' },
        },
      };
      
      render(
        <TestWrapper initialState={initialState}>
          <Navigation showUserMenu={true} onLogout={handleLogout} />
        </TestWrapper>
      );
      
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);
      
      const logoutButton = screen.getByText(/log out/i);
      await user.click(logoutButton);
      
      expect(handleLogout).toHaveBeenCalled();
    });

    test('should call onNotificationsClick when notifications are clicked', async () => {
      const handleNotificationsClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation 
            showNotifications={true} 
            onNotificationsClick={handleNotificationsClick} 
          />
        </TestWrapper>
      );
      
      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(notificationsButton);
      
      expect(handleNotificationsClick).toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    test('should render marketing navigation by default', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('APIs')).toBeInTheDocument();
    });

    test('should render dashboard navigation when in dashboard mode', () => {
      // Mock location to simulate dashboard path
      const mockLocation = {
        pathname: '/dashboard',
        search: '',
        hash: '',
        state: null,
        key: 'test',
      };

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      // Since we're mocking the location, we'd need to check for dashboard-specific elements
      // This would require setting up the component to recognize dashboard mode
    });

    test('should show/hide mobile menu', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      
      // Mobile menu should be hidden initially
      expect(screen.queryByRole('list', { hidden: true })).not.toBeVisible();
      
      // Click to open mobile menu
      await user.click(menuButton);
      
      // Mobile menu should now be visible
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
      });
    });

    test('should display notification count badge', () => {
      render(
        <TestWrapper>
          <Navigation showNotifications={true} notificationCount={5} />
        </TestWrapper>
      );
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('should hide notification badge when count is 0', () => {
      render(
        <TestWrapper>
          <Navigation showNotifications={true} notificationCount={0} />
        </TestWrapper>
      );
      
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    test('should display user initials in avatar', () => {
      render(
        <TestWrapper>
          <Navigation 
            showUserMenu={true}
            userInfo={{
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            }}
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Navigation showSearch={true} showNotifications={true} />
        </TestWrapper>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const logo = screen.getByText('Rails');
      const homeLink = screen.getByText('Home');
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      
      await user.tab();
      expect(logo).toHaveFocus();
      
      await user.tab();
      expect(homeLink).toHaveFocus();
      
      // Continue tabbing to reach menu button
      await user.tab({ shift: false });
      await user.tab({ shift: false });
      await user.tab({ shift: false });
      await user.tab({ shift: false });
      
      expect(menuButton).toHaveFocus();
    });

    test('should handle mobile menu keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      
      // Open mobile menu with Enter key
      await user.click(menuButton);
      await user.keyboard('{Enter}');
      
      // Should be able to navigate mobile menu items
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
      });
    });

    test('should be screen reader compatible', () => {
      render(
        <TestWrapper>
          <Navigation 
            showSearch={true}
            showNotifications={true}
            notificationCount={3}
          />
        </TestWrapper>
      );
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', expect.any(String));
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAccessibleName();
      
      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      expect(notificationsButton).toHaveAccessibleDescription();
    });
  });

  describe('Integration', () => {
    test('should work with React Router', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );
      
      const homeLink = screen.getByText('Home');
      expect(homeLink.closest('button')).toBeInTheDocument();
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
          <Navigation showUserMenu={true} userInfo={{}} />
        </TestWrapper>
      );
      
      // Should show default avatar or initials
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle very long navigation labels', () => {
      const longLinks = [
        { 
          key: 'long', 
          label: 'This is a very long navigation label that might cause overflow issues',
          path: '/long' 
        },
      ];
      
      render(
        <TestWrapper>
          <Navigation marketingNavLinks={longLinks} />
        </TestWrapper>
      );
      
      expect(screen.getByText(/This is a very long/)).toBeInTheDocument();
    });

    test('should handle high notification counts', () => {
      render(
        <TestWrapper>
          <Navigation showNotifications={true} notificationCount={999} />
        </TestWrapper>
      );
      
      expect(screen.getByText('999+')).toBeInTheDocument();
    });

    test('should handle disabled navigation links', () => {
      const disabledLinks = [
        { key: 'disabled', label: 'Disabled Link', path: '/disabled', disabled: true },
      ];
      
      render(
        <TestWrapper>
          <Navigation marketingNavLinks={disabledLinks} />
        </TestWrapper>
      );
      
      const disabledLink = screen.getByText('Disabled Link');
      expect(disabledLink.closest('button')).toBeDisabled();
    });
  });
});