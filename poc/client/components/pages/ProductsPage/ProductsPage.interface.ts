import React from 'react';

export interface ProductsPageProps {
  /** Navigation callback function */
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
  
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

export interface ProductsPageState {
  /** Current active view */
  activeView: string;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error?: string;
}

export interface ProductsPageEvents {
  /** Called when navigation occurs */
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
}

export interface ProductFeature {
  /** Feature icon element */
  icon: React.ReactElement;
  
  /** Feature title */
  title: string;
  
  /** Feature description */
  description: string;
}

export interface UseCase {
  /** Use case title */
  title: string;
  
  /** Use case description */
  description: string;
  
  /** Use case icon */
  icon: React.ReactElement;
}

export interface IntegrationStep {
  /** Step number */
  step: string;
  
  /** Step title */
  title: string;
  
  /** Step description */
  description: string;
}

export interface ConnectedBank {
  /** Bank name */
  name: string;
  
  /** Connection status */
  status: string;
  
  /** Monthly transactions */
  transactions: string;
  
  /** Uptime percentage */
  uptime: string;
}

export type ProductsPageNavigationTarget = ProductsPageProps['onNavigate'] extends (page: infer T) => void ? T : never;