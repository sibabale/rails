import React from 'react';

export interface HeroSectionStats {
  /** Number of active banks connected */
  activeBanks: number;
  
  /** Transaction completion rate as percentage */
  completionRate: number;
  
  /** Total revenue amount */
  totalRevenue: number;
  
  /** Number of active transactions */
  activeTransactions: number;
}

export interface RevenueDataPoint {
  /** Month name */
  name: string;
  
  /** Revenue amount for the month */
  revenue: number;
  
  /** Number of transactions for the month */
  transactions: number;
}

export interface BankDataPoint {
  /** Bank name */
  name: string;
  
  /** Percentage share value */
  value: number;
  
  /** Number of transactions */
  transactions: number;
  
  /** Color for chart visualization */
  color: string;
}

export interface TransactionLog {
  /** Unique transaction ID */
  id: string;
  
  /** Bank name */
  bank: string;
  
  /** Transaction amount formatted as string */
  amount: string;
  
  /** Transaction status */
  status: 'Completed' | 'Processing' | 'Pending';
  
  /** Transaction time */
  time: string;
}

export interface HeroSectionProps {
  /** CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Override initial stats data */
  initialStats?: Partial<HeroSectionStats>;
  
  /** Override revenue data */
  revenueData?: RevenueDataPoint[];
  
  /** Override bank distribution data */
  bankData?: BankDataPoint[];
  
  /** Override transaction logs */
  transactionLogs?: TransactionLog[];
  
  /** Whether to enable real-time updates */
  enableRealTime?: boolean;
  
  /** Update interval for real-time data in milliseconds */
  updateInterval?: number;
  
  /** Whether to show revenue overview section */
  showRevenueOverview?: boolean;
  
  /** Whether to show bank distribution section */
  showBankDistribution?: boolean;
  
  /** Whether to show transaction logs section */
  showTransactionLogs?: boolean;
  
  /** Custom title for revenue overview */
  revenueOverviewTitle?: string;
  
  /** Custom title for bank distribution */
  bankDistributionTitle?: string;
  
  /** Custom title for transaction logs */
  transactionLogsTitle?: string;
  
  /** Whether to enable animations */
  enableAnimations?: boolean;
  
  /** Animation duration in seconds */
  animationDuration?: number;
  
  /** Currency code for formatting */
  currencyCode?: string;
}

export interface HeroSectionState {
  /** Current stats data */
  stats: HeroSectionStats;
  
  /** Revenue chart data */
  revenueData: RevenueDataPoint[];
  
  /** Bank distribution data */
  bankData: BankDataPoint[];
  
  /** Transaction logs data */
  transactionLogs: TransactionLog[];
  
  /** Whether component is loading */
  isLoading: boolean;
  
  /** Error message if any */
  error?: string;
  
  /** Whether real-time updates are active */
  realTimeActive: boolean;
}

export interface HeroSectionEvents {
  /** Called when stats are updated */
  onStatsUpdate?: (stats: HeroSectionStats) => void;
  
  /** Called when revenue data changes */
  onRevenueDataUpdate?: (data: RevenueDataPoint[]) => void;
  
  /** Called when bank data changes */
  onBankDataUpdate?: (data: BankDataPoint[]) => void;
  
  /** Called when transaction log is clicked */
  onTransactionLogClick?: (log: TransactionLog) => void;
  
  /** Called when bank distribution item is clicked */
  onBankClick?: (bank: BankDataPoint) => void;
  
  /** Called when real-time updates are toggled */
  onRealTimeToggle?: (enabled: boolean) => void;
  
  /** Called when component encounters an error */
  onError?: (error: string) => void;
}

export interface HeroSectionDataService {
  /** Fetch initial stats data */
  fetchStats: () => Promise<HeroSectionStats>;
  
  /** Fetch revenue data */
  fetchRevenueData: () => Promise<RevenueDataPoint[]>;
  
  /** Fetch bank distribution data */
  fetchBankData: () => Promise<BankDataPoint[]>;
  
  /** Fetch transaction logs */
  fetchTransactionLogs: () => Promise<TransactionLog[]>;
  
  /** Subscribe to real-time updates */
  subscribeToUpdates?: (callback: (data: Partial<HeroSectionState>) => void) => () => void;
}

export interface HeroSectionFormatters {
  /** Format currency values */
  formatCurrency: (amount: number, currency?: string) => string;
  
  /** Format percentage values */
  formatPercentage: (value: number, decimals?: number) => string;
  
  /** Format compact numbers */
  formatCompact: (value: number) => string;
  
  /** Format transaction amounts */
  formatTransactionAmount: (amount: number) => string;
}