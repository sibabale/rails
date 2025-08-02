import React from 'react';

export interface HomePageProps {
  /** Navigation callback function */
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

export interface HomePageState {
  /** Current active view */
  activeView: string;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error?: string;
}

export interface HomePageEvents {
  /** Called when navigation occurs */
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
  
  /** Called when products section is clicked */
  onProductsClick?: () => void;
}

export interface Feature {
  /** Feature icon element */
  icon: React.ReactElement;
  
  /** Feature title */
  title: string;
  
  /** Feature description */
  description: string;
}

export interface Bank {
  /** Bank name */
  name: string;
  
  /** Bank abbreviation */
  abbr: string;
  
  /** Connection status */
  status: string;
}

export type HomePageNavigationTarget = HomePageProps['onNavigate'] extends (page: infer T) => void ? T : never;