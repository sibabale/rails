import React from 'react';
import { HeroSection } from '../../organisms/HeroSection';
import { SummaryCards } from '../../organisms/SummaryCards';
import { DataTable } from '../../organisms/DataTable';
import { Footer } from '../../organisms/Footer';
import type { InternalDashboardPageProps } from './InternalDashboardPage.interface';
import { cn } from '../../ui/utils';

export function InternalDashboardPage({ 
  onNavigate,
  className,
  style,
  'data-testid': dataTestId = 'internal-dashboard-page'
}: InternalDashboardPageProps) {
  return (
    <div 
      className={cn('min-h-screen bg-white', className)}
      style={style}
      data-testid={dataTestId}
    >
      <main className="container mx-auto px-4 py-8 space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rails Internal Dashboard</h1>
            <p className="text-gray-600">Full system metrics and controls</p>
          </div>
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            Internal Use Only
          </div>
        </div>
        <SummaryCards />
        <DataTable showAllBanks={true} />
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}