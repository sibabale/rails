import React from 'react';
import { HeroSection } from '../../organisms/HeroSection';
import { SummaryCards } from '../../organisms/SummaryCards';
import { DataTable } from '../../organisms/DataTable';
import { Footer } from '../../organisms/Footer';
import type { DashboardPageProps } from './DashboardPage.interface';
import { cn } from '../../ui/utils';

export function DashboardPage({ 
  onNavigate,
  className,
  style,
  'data-testid': dataTestId = 'dashboard-page'
}: DashboardPageProps) {
  return (
    <div 
      className={cn('min-h-screen bg-white', className)}
      style={style}
      data-testid={dataTestId}
    >
      <main className="container mx-auto px-4 py-8 space-y-12">
        <HeroSection />
        <SummaryCards />
        <DataTable />
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}