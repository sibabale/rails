import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertTriangle, DollarSign, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { DataTable } from '../../organisms/DataTable';
import { Footer } from '../../organisms/Footer';
import { useNavigate } from 'react-router-dom';
import { triggerSettlement, getPendingTransactions, getDashboardMetrics } from '../../../lib/api';
import { useAppSelector } from '../../../lib/hooks';
import { selectBankProfile } from '../../../lib/selectors';
import type { BankDashboardPageProps, BankCard } from './BankDashboardPage.interface';
import { cn } from '../../ui/utils';

export function BankDashboardPage({
  className,
  style,
  'data-testid': dataTestId = 'bank-dashboard-page'
}: BankDashboardPageProps) {
  const navigate = useNavigate();
  const bankProfile = useAppSelector(selectBankProfile);
  const [pendingCount, setPendingCount] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const onNavigate = (page: 'home' | 'dashboard' | 'products') => {
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'products':
        navigate('/products');
        break;
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!bankProfile?.adminEmail) {
      navigate('/login');
      return;
    }
    
    loadDashboardData();
  }, [bankProfile, navigate]);

  const loadDashboardData = async () => {
    try {
      const [pendingData, metricsData] = await Promise.all([
        getPendingTransactions().catch(() => ({ pending: [], count: 0, timestamp: new Date().toISOString() })),
        getDashboardMetrics().catch(() => ({ activeTransactions: 0 }))
      ]);
      
      setPendingCount(pendingData.count);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set fallback values
      setPendingCount(0);
      setMetrics({ activeTransactions: 0 });
    }
  };

  const handleStartSettlement = async () => {
    if (!bankProfile?.adminEmail) {
      alert('User not authenticated');
      return;
    }

    setSettlementLoading(true);
    try {
      const result = await triggerSettlement(bankProfile.adminEmail);
      alert(`Settlement completed! ${result.settled.length} transactions processed.`);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Settlement failed:', error);
      alert('Settlement failed. Please try again.');
    } finally {
      setSettlementLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const bankCards: BankCard[] = [
    {
      title: "Pending Transactions",
      description: "Your transactions awaiting settlement",
      value: pendingCount.toString(),
      subValue: "ready for processing",
      icon: <Clock className="h-4 w-4" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Settlement Status",
      description: "Weekend processing status",
      value: pendingCount > 0 ? "Ready" : "Complete",
      subValue: pendingCount > 0 ? "Click to start settlement" : "All transactions processed",
      icon: <CheckCircle className="h-4 w-4" />,
      color: pendingCount > 0 ? "text-orange-600" : "text-green-600",
      bgColor: pendingCount > 0 ? "bg-orange-50" : "bg-green-50",
    },
    {
      title: "Processing Fee (1%)",
      description: "Fee for weekend settlement",
      value: metrics ? `R${(metrics.activeTransactions * 100 * 0.01).toFixed(2)}` : "R0",
      subValue: "calculated on settlement",
      icon: <DollarSign className="h-4 w-4" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    }
  ];

  // Don't render anything if not authenticated - redirect will handle it
  if (!bankProfile?.adminEmail) {
    return null;
  }

  return (
    <div 
      className={cn('min-h-screen bg-white', className)}
      style={style}
      data-testid={dataTestId}
    >
      <main className="container mx-auto px-4 py-8 space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {bankProfile.bankName} Dashboard
            </h1>
            <p className="text-gray-600">
              Weekend settlement management
            </p>
          </div>
          {pendingCount > 0 && (
            <Button 
              onClick={() => setShowConfirmDialog(true)}
              disabled={settlementLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              {settlementLoading ? 'Processing...' : 'Start Weekend Settlement'}
            </Button>
          )}
        </div>

        {/* Bank-specific Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bankCards.map((card, index) => (
            <Card key={index} className="relative overflow-hidden bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-medium">{card.title}</span>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <div className={card.color}>{card.icon}</div>
                  </div>
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-sm text-gray-600">{card.subValue}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DataTable showAllBanks={false} />

        {/* Settlement Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Confirm Settlement
                </CardTitle>
                <CardDescription>
                  This will process {pendingCount} pending transactions and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStartSettlement}
                    disabled={settlementLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {settlementLoading ? 'Processing...' : 'Confirm Settlement'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}