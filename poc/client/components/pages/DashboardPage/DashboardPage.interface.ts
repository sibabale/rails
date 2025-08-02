import React from 'react';

export interface DashboardPageProps {
  /** Navigation callback function */
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

export interface DashboardPageState {
  /** Current active view */
  activeView: string;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error?: string;
}

export interface DashboardPageEvents {
  /** Called when navigation occurs */
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
}

export type DashboardPageNavigationTarget = DashboardPageProps['onNavigate'] extends (page: infer T) => void ? T : never;