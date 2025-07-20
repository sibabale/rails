import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Building2, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AnimatedCounter, percentageFormatter, currencyFormatter, compactFormatter } from './AnimatedCounter';
import { ScrollReveal, StaggeredReveal } from './ScrollReveal';

export function HeroSection() {
  // Simulated real-time data that updates
  const [stats, setStats] = useState({
    activeBanks: 4,
    completionRate: 99.2,
    totalRevenue: 2847593,
    activeTransactions: 15742
  });

  const [revenueData, setRevenueData] = useState([
    { name: 'Jan', revenue: 2100000, transactions: 12000 },
    { name: 'Feb', revenue: 2400000, transactions: 14500 },
    { name: 'Mar', revenue: 2200000, transactions: 13200 },
    { name: 'Apr', revenue: 2800000, transactions: 16800 },
    { name: 'May', revenue: 3200000, transactions: 19200 },
    { name: 'Jun', revenue: 2900000, transactions: 17400 },
  ]);

  const [bankData, setBankData] = useState([
    { name: 'FNB', value: 35, transactions: 5500, color: '#0088FE' },
    { name: 'ABSA', value: 28, transactions: 4400, color: '#00C49F' },
    { name: 'Standard Bank', value: 25, transactions: 3900, color: '#FFBB28' },
    { name: 'Nedbank', value: 12, transactions: 1900, color: '#FF8042' },
  ]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activeBanks: 4, // This stays constant
        completionRate: Math.min(99.9, prev.completionRate + (Math.random() - 0.5) * 0.1),
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 1000),
        activeTransactions: prev.activeTransactions + Math.floor(Math.random() * 10 - 5)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.0, 0.0, 0.2, 1]
      }
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Stats */}
      <ScrollReveal>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <motion.div variants={cardVariants}>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Banks</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">
                  <AnimatedCounter to={stats.activeBanks} duration={1.5} />
                </div>
                <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All Connected
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">
                  <AnimatedCounter 
                    to={stats.completionRate} 
                    format={percentageFormatter(1)}
                    duration={2}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  +0.3% from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">
                  <AnimatedCounter 
                    to={stats.totalRevenue} 
                    format={currencyFormatter('ZAR')}
                    duration={2.5}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  1% fee on transactions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Transactions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">
                  <AnimatedCounter 
                    to={stats.activeTransactions} 
                    format={compactFormatter}
                    duration={1.8}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Real-time processing
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </ScrollReveal>

      {/* Revenue Overview */}
      <ScrollReveal delay={0.2}>
        <Card className="p-4 sm:p-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg sm:text-xl">Revenue Overview</CardTitle>
                <CardDescription className="text-sm">
                  Monthly transaction revenue and volume trends
                </CardDescription>
              </div>
              <Badge variant="outline" className="self-start sm:self-center">
                Last 6 months
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tickFormatter={(value) => compactFormatter(value)}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? currencyFormatter('ZAR')(value as number) : compactFormatter(value as number),
                      name === 'revenue' ? 'Revenue' : 'Transactions'
                    ]}
                    labelStyle={{ color: 'var(--foreground)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    animationBegin={300}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Bank Distribution and Transaction Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <ScrollReveal delay={0.3}>
          <Card className="p-4 sm:p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Bank Distribution</CardTitle>
              <CardDescription className="text-sm">
                Transaction volume by connected banks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
                <div className="w-full max-w-[200px] h-[200px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bankData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        animationBegin={500}
                        animationDuration={1000}
                      >
                        {bankData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Share']}
                        labelStyle={{ color: 'var(--foreground)' }}
                        contentStyle={{ 
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-3">
                  {bankData.map((bank, index) => (
                    <motion.div
                      key={bank.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bank.color }}
                        />
                        <span className="text-sm font-medium">{bank.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{bank.value}%</div>
                        <div className="text-xs text-muted-foreground">
                          <AnimatedCounter 
                            to={bank.transactions} 
                            format={compactFormatter}
                            suffix=" txns"
                            duration={1.5}
                            triggerOnce={true}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <Card className="p-4 sm:p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Today's Transaction Logs</CardTitle>
              <CardDescription className="text-sm">
                Recent settlement activities and status updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaggeredReveal staggerDelay={0.05} className="space-y-3">
                {[
                  { id: 'WS_2025_001', bank: 'FNB', amount: 'R250,000', status: 'Completed', time: '14:32' },
                  { id: 'WS_2025_002', bank: 'ABSA', amount: 'R180,500', status: 'Processing', time: '14:28' },
                  { id: 'WS_2025_003', bank: 'Standard Bank', amount: 'R95,750', status: 'Completed', time: '14:15' },
                  { id: 'WS_2025_004', bank: 'Nedbank', amount: 'R320,200', status: 'Pending', time: '14:08' },
                  { id: 'WS_2025_005', bank: 'FNB', amount: 'R67,800', status: 'Completed', time: '13:55' },
                ].map((log) => (
                  <motion.div
                    key={log.id}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-all cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{log.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.bank}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.amount} • {log.time}
                      </div>
                    </div>
                    <Badge 
                      className={`text-xs ${
                        log.status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : log.status === 'Processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {log.status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {log.status === 'Processing' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {log.status === 'Pending' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {log.status}
                    </Badge>
                  </motion.div>
                ))}
              </StaggeredReveal>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
}