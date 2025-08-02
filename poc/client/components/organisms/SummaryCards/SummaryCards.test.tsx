import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SummaryCards } from './SummaryCards';

describe('SummaryCards', () => {
  it('renders the component with correct title', () => {
    render(<SummaryCards />);
    expect(screen.getByText('Settlement Overview')).toBeInTheDocument();
  });

  it('displays all summary cards', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText("Today's Transaction Logs")).toBeInTheDocument();
    expect(screen.getByText('Reserve Exhausted')).toBeInTheDocument();
    expect(screen.getByText('Bank Performance')).toBeInTheDocument();
    expect(screen.getByText('Active Banks')).toBeInTheDocument();
    expect(screen.getByText('Processing Fees')).toBeInTheDocument();
    expect(screen.getByText('Reserve Pool')).toBeInTheDocument();
  });

  it('displays correct values for summary cards', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText('52,847')).toBeInTheDocument();
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('99.2%')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('R542K')).toBeInTheDocument();
    expect(screen.getByText('R24.7M')).toBeInTheDocument();
  });

  it('displays Monday clearing section', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText('Monday Clearing Preparation')).toBeInTheDocument();
    expect(screen.getByText('FNB Settlement')).toBeInTheDocument();
    expect(screen.getByText('ABSA Settlement')).toBeInTheDocument();
    expect(screen.getByText('Standard Bank Settlement')).toBeInTheDocument();
    expect(screen.getByText('Nedbank Settlement')).toBeInTheDocument();
  });

  it('displays system controls section', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText('System Controls')).toBeInTheDocument();
    expect(screen.getByText('Reserve Mgmt')).toBeInTheDocument();
    expect(screen.getByText('Bank Config')).toBeInTheDocument();
    expect(screen.getByText('Alert Center')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('displays system status indicators', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText('Webhook Status')).toBeInTheDocument();
    expect(screen.getByText('API Response Time')).toBeInTheDocument();
    expect(screen.getByText('System Load')).toBeInTheDocument();
  });

  it('shows correct status badges for Monday clearing', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('displays priority badges', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('shows progress bars for relevant cards', () => {
    render(<SummaryCards />);
    
    // Check for progress percentage text
    expect(screen.getByText('97.3% complete')).toBeInTheDocument();
    expect(screen.getByText('99.2% complete')).toBeInTheDocument();
    expect(screen.getByText('67% complete')).toBeInTheDocument();
  });

  it('displays correct descriptions', () => {
    render(<SummaryCards />);
    
    expect(screen.getByText('Real-time banking infrastructure metrics')).toBeInTheDocument();
    expect(screen.getByText('Bank settlements ready for Monday processing')).toBeInTheDocument();
    expect(screen.getByText('Critical system operations')).toBeInTheDocument();
  });
}); 