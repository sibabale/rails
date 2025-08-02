export interface SummaryCard {
  title: string;
  description: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  progress: number | null;
  color: string;
  bgColor: string;
}

export interface MondayClearingItem {
  title: string;
  amount: string;
  priority: 'high' | 'medium' | 'low';
  status: 'ready' | 'processing' | 'pending';
}

export interface SummaryCardsProps {
  // Currently no props needed, but can be extended for dynamic data
}

export interface SummaryCardsState {
  // Currently no local state needed, but can be extended
} 