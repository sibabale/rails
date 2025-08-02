import React from 'react';

export interface InternalDashboardPageProps {
  /** Navigation callback function */
  onNavigate?: (page: 'home' | 'dashboard' | 'products' | 'internal-dashboard') => void;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

export interface InternalDashboardPageState {
  /** Current active view */
  activeView: string;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error?: string;
}

export interface InternalDashboardPageEvents {
  /** Called when navigation occurs */
  onNavigate?: (page: 'home' | 'dashboard' | 'products' | 'internal-dashboard') => void;
}

export type InternalDashboardPageNavigationTarget = InternalDashboardPageProps['onNavigate'] extends (page: infer T) => void ? T : never;