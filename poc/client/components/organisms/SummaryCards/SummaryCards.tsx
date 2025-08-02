import React from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, Building2, FileText, TrendingUp, DollarSign, Shield, Zap, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { SummaryCardsProps, SummaryCard, MondayClearingItem } from './SummaryCards.interface';

export function SummaryCards() {
  const cards = [
    {
      title: "Today's Transaction Logs",
      description: "Transactions processed today",
      value: "52,847",
      subValue: "of 54,289 completed",
      icon: <CheckCircle className="h-4 w-4" />,
      progress: 97.3,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Reserve Exhausted",
      description: "Transactions delayed",
      value: "127",
      subValue: "awaiting Monday clearing",
      icon: <AlertTriangle className="h-4 w-4" />,
      progress: null,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Bank Performance",
      description: "Average processing rate",
      value: "99.2%",
      subValue: "+0.8% from last weekend",
      icon: <TrendingUp className="h-4 w-4" />,
      progress: 99.2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Banks",
      description: "Connected institutions",
      value: "4",
      subValue: "FNB, ABSA, Standard, Nedbank",
      icon: <Building2 className="h-4 w-4" />,
      progress: null,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Processing Fees",
      description: "Revenue from 1% commission",
      value: "R542K",
      subValue: "this weekend cycle",
      icon: <DollarSign className="h-4 w-4" />,
      progress: null,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Reserve Pool",
      description: "Available settlement funds",
      value: "R24.7M",
      subValue: "67% utilized",
      icon: <Shield className="h-4 w-4" />,
      progress: 67,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const mondayClearing = [
    { title: "FNB Settlement", amount: "R8.7M", priority: "high", status: "ready" },
    { title: "ABSA Settlement", amount: "R6.2M", priority: "high", status: "ready" },
    { title: "Standard Bank Settlement", amount: "R9.1M", priority: "high", status: "processing" },
    { title: "Nedbank Settlement", amount: "R5.8M", priority: "medium", status: "pending" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-emerald-100 text-emerald-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settlement Overview</h2>
          <p className="text-gray-600">Real-time banking infrastructure metrics</p>
        </div>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Monday Clearing
        </Button>
      </div>

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
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
                {card.progress !== null && (
                  <div className="space-y-1">
                    <Progress value={card.progress} className="h-2" />
                    <p className="text-xs text-gray-500">{card.progress}% complete</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Monday Clearing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Monday Clearing Preparation
            </CardTitle>
            <CardDescription>Bank settlements ready for Monday processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mondayClearing.map((settlement, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{settlement.title}</p>
                    <p className="text-sm text-muted-foreground">{settlement.amount}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(settlement.status)}>
                      {settlement.status}
                    </Badge>
                    <Badge variant={getPriorityColor(settlement.priority)}>
                      {settlement.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View All Settlements
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle>System Controls</CardTitle>
            <CardDescription>Critical system operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col space-y-1">
                <Shield className="w-5 h-5" />
                <span className="text-xs">Reserve Mgmt</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-1">
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Bank Config</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-1">
                <AlertCircle className="w-5 h-5" />
                <span className="text-xs">Alert Center</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-1">
                <Zap className="w-5 h-5" />
                <span className="text-xs">Performance</span>
              </Button>
            </div>
            
            {/* System Status Indicators */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Webhook Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-600">All Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>API Response Time</span>
                <span className="text-blue-600">1.2s avg</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>System Load</span>
                <span className="text-green-600">Normal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}