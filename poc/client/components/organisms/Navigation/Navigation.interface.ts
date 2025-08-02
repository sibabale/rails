import React from 'react';

export interface NavigationProps {
  /** Whether to show mobile menu by default */
  defaultMobileMenuOpen?: boolean;
  
  /** CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Whether to show the logo */
  showLogo?: boolean;
  
  /** Custom logo text */
  logoText?: string;
  
  /** Custom logo URL */
  logoUrl?: string;
  
  /** Whether to show navigation links */
  showNavLinks?: boolean;
  
  /** Custom navigation links for marketing site */
  marketingNavLinks?: NavigationLink[];
  
  /** Custom navigation links for dashboard */
  dashboardNavLinks?: NavigationLink[];
  
  /** Whether to show search field in dashboard */
  showSearch?: boolean;
  
  /** Search placeholder text */
  searchPlaceholder?: string;
  
  /** Whether to show user avatar and dropdown */
  showUserMenu?: boolean;
  
  /** User information for display */
  userInfo?: UserInfo;
  
  /** Whether to show notifications */
  showNotifications?: boolean;
  
  /** Number of unread notifications */
  notificationCount?: number;
  
  /** Whether to show mobile menu button */
  showMobileMenuButton?: boolean;
  
  /** Whether to enable animations */
  enableAnimations?: boolean;
  
  /** Custom theme colors */
  theme?: NavigationTheme;
}

export interface NavigationLink {
  /** Unique identifier for the link */
  key: string;
  
  /** Display label */
  label: string;
  
  /** Navigation path */
  path?: string;
  
  /** External URL */
  href?: string;
  
  /** Whether the link is active */
  active?: boolean;
  
  /** Icon component */
  icon?: React.ReactNode;
  
  /** Whether the link is disabled */
  disabled?: boolean;
  
  /** Click handler */
  onClick?: () => void;
}

export interface UserInfo {
  /** User's first name */
  firstName?: string;
  
  /** User's last name */
  lastName?: string;
  
  /** User's full name */
  name?: string;
  
  /** User's email */
  email?: string;
  
  /** User's avatar URL */
  avatarUrl?: string;
  
  /** User's initials for fallback */
  initials?: string;
  
  /** User's role or position */
  role?: string;
}

export interface NavigationTheme {
  /** Primary brand color */
  primaryColor?: string;
  
  /** Background color */
  backgroundColor?: string;
  
  /** Text color */
  textColor?: string;
  
  /** Hover color */
  hoverColor?: string;
  
  /** Border color */
  borderColor?: string;
  
  /** Mobile menu background */
  mobileMenuBackground?: string;
}

export interface NavigationState {
  /** Whether mobile menu is open */
  mobileMenuOpen: boolean;
  
  /** Current active route */
  currentPath: string;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** Whether the component is in dashboard mode */
  isDashboard: boolean;
  
  /** Search query value */
  searchQuery: string;
  
  /** Whether search is focused */
  searchFocused: boolean;
}

export interface NavigationEvents {
  /** Called when navigation link is clicked */
  onNavigate?: (path: string) => void;
  
  /** Called when logo is clicked */
  onLogoClick?: () => void;
  
  /** Called when mobile menu is toggled */
  onMobileMenuToggle?: (isOpen: boolean) => void;
  
  /** Called when search query changes */
  onSearchChange?: (query: string) => void;
  
  /** Called when search is submitted */
  onSearchSubmit?: (query: string) => void;
  
  /** Called when user menu item is clicked */
  onUserMenuClick?: (action: string) => void;
  
  /** Called when logout is clicked */
  onLogout?: () => void;
  
  /** Called when notifications are clicked */
  onNotificationsClick?: () => void;
  
  /** Called when new settlement button is clicked */
  onNewSettlement?: () => void;
}

export interface NavigationUtils {
  /** Check if a path is active */
  isPathActive: (path: string, currentPath: string) => boolean;
  
  /** Get user initials from name */
  getUserInitials: (firstName?: string, lastName?: string, fullName?: string) => string;
  
  /** Format notification count */
  formatNotificationCount: (count: number) => string;
  
  /** Handle keyboard navigation */
  handleKeyboardNavigation: (event: KeyboardEvent, links: NavigationLink[]) => void;
}