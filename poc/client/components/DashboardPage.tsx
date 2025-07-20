import React from 'react';
import { HeroSection } from './HeroSection';
import { SummaryCards } from './SummaryCards';
import { DataTable } from './DataTable';
import { Footer } from './Footer';

interface DashboardPageProps {
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <main className="container mx-auto px-4 py-8 space-y-12">
        <HeroSection />
        <SummaryCards />
        <DataTable />
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}