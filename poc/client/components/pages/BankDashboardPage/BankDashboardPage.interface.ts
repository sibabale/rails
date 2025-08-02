import React from 'react';

export interface BankDashboardPageProps {
  /** Custom CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

export interface BankDashboardPageState {
  /** Number of pending transactions */
  pendingCount: number;
  
  /** Dashboard metrics data */
  metrics: any | null;
  
  /** Settlement loading state */
  settlementLoading: boolean;
  
  /** Show confirmation dialog state */
  showConfirmDialog: boolean;
  
  /** Loading states */
  isLoading: boolean;
  
  /** Error state */
  error?: string;
}

export interface BankDashboardPageEvents {
  /** Called when settlement is triggered */
  onSettlementStart?: () => void;
  
  /** Called when settlement completes */
  onSettlementComplete?: (result: any) => void;
  
  /** Called when data loading starts */
  onDataLoadStart?: () => void;
  
  /** Called when data loading completes */
  onDataLoadComplete?: (data: any) => void;
}

export interface BankCard {
  /** Card title */
  title: string;
  
  /** Card description */
  description: string;
  
  /** Main display value */
  value: string;
  
  /** Sub value or additional info */
  subValue: string;
  
  /** Icon element */
  icon: React.ReactElement;
  
  /** Icon color class */
  color: string;
  
  /** Background color class */
  bgColor: string;
}

export interface SettlementResult {
  /** Array of settled transactions */
  settled: any[];
  
  /** Settlement timestamp */
  timestamp: string;
  
  /** Settlement status */
  status: 'success' | 'error';
}