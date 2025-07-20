import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Clock, Shield, Zap, Code, Building2, Database, Webhook, Globe, Users, TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Footer } from './Footer';
import { ScrollReveal, StaggeredReveal } from './ScrollReveal';

interface ProductsPageProps {
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
}

export function ProductsPage({ onNavigate }: ProductsPageProps) {
  const weekendSettlementFeatures = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Real-time Processing",
      description: "Process transactions instantly during weekends with sub-second response times"
    },
    {
      icon: <Webhook className="w-5 h-5" />,
      title: "Webhook Integration",
      description: "Get real-time notifications for all transaction events and status changes"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Reserve Management",
      description: "Automated reserve allocation and management to ensure liquidity"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Monday Clearing",
      description: "Seamless preparation for Monday clearing with detailed reporting"
    }
  ];

  const baasFeatures = [
    {
      icon: <Building2 className="w-5 h-5" />,
      title: "Core Banking System",
      description: "Complete banking infrastructure with account management, transfers, and more"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Compliance Built-in",
      description: "KYC, AML, and regulatory compliance handled automatically"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "White-label Ready",
      description: "Customize the experience with your brand and user interface"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Instant Scaling",
      description: "Scale from hundreds to millions of customers without infrastructure changes"
    }
  ];

  const useCases = [
    {
      title: "Fintech Startups",
      description: "Launch banking products quickly with our pre-built infrastructure",
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: "Digital Banks",
      description: "Focus on customer experience while we handle the banking backend",
      icon: <Building2 className="w-6 h-6" />
    },
    {
      title: "Payment Processors",
      description: "Extend your payment solutions with full banking capabilities",
      icon: <DollarSign className="w-6 h-6" />
    }
  ];

  const integrationSteps = [
    {
      step: "1",
      title: "API Integration",
      description: "Connect to our RESTful APIs or GraphQL endpoints"
    },
    {
      step: "2", 
      title: "Authentication",
      description: "Secure your integration with OAuth 2.0 or API keys"
    },
    {
      step: "3",
      title: "Testing",
      description: "Use our sandbox environment to test all functionality"
    },
    {
      step: "4",
      title: "Go Live",
      description: "Deploy to production with confidence"
    }
  ];

  const banks = [
    { name: "First National Bank", status: "Live", transactions: "1.2M+", uptime: "99.9%" },
    { name: "ABSA Bank", status: "Live", transactions: "980K+", uptime: "99.8%" },
    { name: "Standard Bank", status: "Live", transactions: "1.5M+", uptime: "99.9%" },
    { name: "Nedbank", status: "Live", transactions: "750K+", uptime: "99.7%" }
  ];

  // Animation variants
  const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.0, 0.0, 0.2, 1]
      }
    }
  };

  const cardHover = {
    y: -5,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    transition: { type: "spring", stiffness: 300, damping: 20 }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative text-white overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, #030213, #030213f2, #030213cc)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255)'%3e%3cpath d='m0 .5h32m-32 32v-32m32 0v32m-32-16h32m-16-16v32'/%3e%3c/svg%3e")`,
            backgroundSize: '16px 16px'
          }}
        />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 xl:py-32">
          <div className="max-w-none sm:max-w-2xl lg:max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroVariants}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                Our Products
              </h1>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-white/80 mb-6 sm:mb-8 max-w-none sm:max-w-2xl lg:max-w-3xl mx-auto">
                Enterprise-grade financial infrastructure solutions designed for the modern economy. 
                Build faster, scale effortlessly, and focus on what matters most.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full sm:w-auto min-h-[44px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6"
                  motionPreset="bounce"
                >
                  Compare Products
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="w-full sm:w-auto min-h-[44px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 text-white border-white/20 hover:bg-white/10"
                  motionPreset="default"
                >
                  Schedule Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Overview */}
      <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 max-w-none lg:max-w-7xl mx-auto">
            {/* Weekend Settlements */}
            <ScrollReveal delay={0.1} direction="left">
              <motion.div whileHover={cardHover}>
                <Card className="p-6 sm:p-8 relative overflow-hidden border-2 border-emerald-200 h-full" style={{ backgroundColor: '#ffffff' }}>
                  <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs sm:text-sm">Live Now</Badge>
                  </div>
                  <CardHeader className="p-0 mb-6 sm:mb-8">
                    <motion.div 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center mb-4 sm:mb-6"
                      style={{ backgroundColor: '#030213' }}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5,
                        transition: { type: "spring", stiffness: 300, damping: 15 }
                      }}
                    >
                      <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                    </motion.div>
                    <CardTitle className="text-2xl sm:text-3xl mb-3 sm:mb-4">Weekend Settlements</CardTitle>
                    <CardDescription className="text-base sm:text-lg">
                      Process transactions from South Africa's top 4 banks during weekends when traditional banking systems are offline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#f3f3f5' }}>
                          <div className="text-xl sm:text-2xl font-bold text-emerald-600">99.2%</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Success Rate</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#f3f3f5' }}>
                          <div className="text-xl sm:text-2xl font-bold text-emerald-600">&lt;1.2s</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Avg Response</div>
                        </div>
                      </div>
                      <StaggeredReveal className="space-y-3">
                        {weekendSettlementFeatures.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="text-emerald-600 mt-1 flex-shrink-0">{feature.icon}</div>
                            <div>
                              <div className="font-medium text-sm sm:text-base">{feature.title}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">{feature.description}</div>
                            </div>
                          </div>
                        ))}
                      </StaggeredReveal>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        className="w-full min-h-[44px] text-sm sm:text-base" 
                        size="lg"
                        motionPreset="default"
                      >
                        Get Started Today
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full min-h-[44px] text-sm sm:text-base" 
                        size="lg"
                        motionPreset="subtle"
                      >
                        View Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </ScrollReveal>

            {/* Bank-as-a-Service */}
            <ScrollReveal delay={0.2} direction="right">
              <motion.div whileHover={cardHover}>
                <Card className="p-6 sm:p-8 relative overflow-hidden border-2 border-blue-200 h-full" style={{ backgroundColor: '#ffffff' }}>
                  <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs sm:text-sm">Coming Soon</Badge>
                  </div>
                  <CardHeader className="p-0 mb-6 sm:mb-8">
                    <motion.div 
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5,
                        transition: { type: "spring", stiffness: 300, damping: 15 }
                      }}
                    >
                      <Database className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl sm:text-3xl mb-3 sm:mb-4">Bank-as-a-Service</CardTitle>
                    <CardDescription className="text-base sm:text-lg">
                      Complete banking infrastructure for startups with banking licenses. Launch products faster with our white-label solution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#f3f3f5' }}>
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">6 months</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Faster Launch</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#f3f3f5' }}>
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">∞</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Scale Limit</div>
                        </div>
                      </div>
                      <StaggeredReveal className="space-y-3">
                        {baasFeatures.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="text-blue-600 mt-1 flex-shrink-0">{feature.icon}</div>
                            <div>
                              <div className="font-medium text-sm sm:text-base">{feature.title}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">{feature.description}</div>
                            </div>
                          </div>
                        ))}
                      </StaggeredReveal>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full min-h-[44px] text-sm sm:text-base" 
                        size="lg"
                        motionPreset="default"
                      >
                        Join Waitlist
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full min-h-[44px] text-sm sm:text-base" 
                        size="lg"
                        motionPreset="subtle"
                      >
                        Request Early Access
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Detailed Product Information */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-none sm:max-w-4xl lg:max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Product Deep Dive</h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
                  Technical specifications and implementation details for each product
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <Tabs defaultValue="weekend-settlements" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
                  <TabsTrigger value="weekend-settlements" className="min-h-[44px] text-sm sm:text-base">
                    Weekend Settlements
                  </TabsTrigger>
                  <TabsTrigger value="bank-as-service" className="min-h-[44px] text-sm sm:text-base">
                    Bank-as-a-Service
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="weekend-settlements" className="space-y-8 sm:space-y-12">
                  {/* API Example */}
                  <ScrollReveal delay={0.1}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                          <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>API Integration</span>
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Simple REST API calls to process weekend settlements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <motion.div 
                          className="bg-slate-900 rounded-lg p-4 sm:p-6 text-green-400 font-mono text-xs sm:text-sm overflow-x-auto"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          whileHover={{ 
                            scale: 1.01,
                            transition: { type: "spring", stiffness: 300, damping: 20 }
                          }}
                        >
                          <div className="text-slate-400 mb-2">// Process weekend settlement</div>
                          <div className="text-yellow-300">POST</div> <div className="text-blue-300">/api/v1/settlements</div>
                          <br /><br />
                          <div className="text-slate-400">// Request payload</div>
                          <div className="text-white">{"{"}</div>
                          <br />
                          &nbsp;&nbsp;<div className="text-blue-300">"amount"</div>: <div className="text-orange-300">150000</div>,
                          <br />
                          &nbsp;&nbsp;<div className="text-blue-300">"bank_code"</div>: <div className="text-yellow-300">"FNB"</div>,
                          <br />
                          &nbsp;&nbsp;<div className="text-blue-300">"reference"</div>: <div className="text-yellow-300">"WS_2025_001"</div>,
                          <br />
                          &nbsp;&nbsp;<div className="text-blue-300">"webhook_url"</div>: <div className="text-yellow-300">"https://your-app.com/webhook"</div>
                          <br />
                          <div className="text-white">{"}"}</div>
                          <br /><br />
                          <div className="text-slate-400">// Response</div>
                          <div className="text-white">{"{"}</div>
                          <br />
                          &nbsp;&nbsp;<div className="text-blue-300">"settlement_id"</div>: <div className="text-yellow-300">"sttl_123456"</div>,
                          <br />
                          &nbsp;&nbsp;<div className="text-blue-300">"status"</div>: <div className="text-yellow-300">"processing"</div>,
                          <br />
                          &nbsp;&nbsp;<div className="text-blue-300">"estimated_completion"</div>: <div className="text-yellow-300">"2025-07-19T09:00:00Z"</div>
                          <br />
                          <div className="text-white">{"}"}</div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>

                  {/* Connected Banks */}
                  <ScrollReveal delay={0.2}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Connected Banks</span>
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Direct integrations with South Africa's major banks
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StaggeredReveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {banks.map((bank, index) => (
                            <motion.div 
                              key={index} 
                              className="p-4 border rounded-lg space-y-2"
                              whileHover={{ 
                                scale: 1.02,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                transition: { type: "spring", stiffness: 300, damping: 20 }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm sm:text-base">{bank.name}</h4>
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                  <motion.div 
                                    className="w-2 h-2 bg-emerald-500 rounded-full mr-2"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  />
                                  {bank.status}
                                </Badge>
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                                <div>Monthly Transactions: {bank.transactions}</div>
                                <div>Uptime: {bank.uptime}</div>
                              </div>
                            </motion.div>
                          ))}
                        </StaggeredReveal>
                      </CardContent>
                    </Card>
                  </ScrollReveal>

                  {/* Pricing */}
                  <ScrollReveal delay={0.3}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Pricing</span>
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Transparent pricing with no hidden fees
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StaggeredReveal className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                          {[
                            { title: "Transaction Fee", value: "1%", description: "Per successful transaction" },
                            { title: "Setup Fee", value: "R0", description: "No setup costs" },
                            { title: "Monthly Fee", value: "R0", description: "Pay per transaction only" }
                          ].map((pricing, index) => (
                            <motion.div 
                              key={index} 
                              className="p-4 sm:p-6 border rounded-lg text-center"
                              whileHover={{ 
                                y: -5,
                                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                                transition: { type: "spring", stiffness: 300, damping: 20 }
                              }}
                            >
                              <h4 className="font-medium mb-2 text-sm sm:text-base">{pricing.title}</h4>
                              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{pricing.value}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">{pricing.description}</div>
                            </motion.div>
                          ))}
                        </StaggeredReveal>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </TabsContent>

                <TabsContent value="bank-as-service" className="space-y-8 sm:space-y-12">
                  {/* Use Cases */}
                  <ScrollReveal delay={0.1}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Use Cases</span>
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Perfect for various types of financial institutions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StaggeredReveal className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                          {useCases.map((useCase, index) => (
                            <motion.div 
                              key={index} 
                              className="p-4 sm:p-6 border rounded-lg text-center"
                              whileHover={{ 
                                y: -5,
                                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                                transition: { type: "spring", stiffness: 300, damping: 20 }
                              }}
                            >
                              <motion.div 
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4"
                                whileHover={{ 
                                  scale: 1.1,
                                  rotate: 5,
                                  transition: { type: "spring", stiffness: 300, damping: 15 }
                                }}
                              >
                                <div className="text-primary">{useCase.icon}</div>
                              </motion.div>
                              <h4 className="font-medium mb-2 text-sm sm:text-base">{useCase.title}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">{useCase.description}</p>
                            </motion.div>
                          ))}
                        </StaggeredReveal>
                      </CardContent>
                    </Card>
                  </ScrollReveal>

                  {/* Integration Process */}
                  <ScrollReveal delay={0.2}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Integration Process</span>
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Get up and running in 4 simple steps
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StaggeredReveal className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                          {integrationSteps.map((step, index) => (
                            <motion.div 
                              key={index} 
                              className="text-center"
                              whileHover={{ 
                                y: -5,
                                transition: { type: "spring", stiffness: 300, damping: 20 }
                              }}
                            >
                              <motion.div 
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                                whileHover={{ 
                                  scale: 1.1,
                                  transition: { type: "spring", stiffness: 300, damping: 15 }
                                }}
                              >
                                <span className="text-sm sm:text-base font-medium">{step.step}</span>
                              </motion.div>
                              <h4 className="font-medium mb-2 text-sm sm:text-base">{step.title}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
                            </motion.div>
                          ))}
                        </StaggeredReveal>
                      </CardContent>
                    </Card>
                  </ScrollReveal>

                  {/* Coming Soon Features */}
                  <ScrollReveal delay={0.3}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Coming Soon</span>
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Bank-as-a-Service will be available Q2 2025
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                          <h4 className="font-medium mb-3 text-sm sm:text-base">Early Access Program</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                            Join our early access program to get priority access to Bank-as-a-Service when it launches. 
                            Early access partners receive:
                          </p>
                          <StaggeredReveal className="space-y-2">
                            {[
                              "30-day free trial",
                              "Dedicated technical support",
                              "Custom feature requests",
                              "Preferred pricing"
                            ].map((benefit, index) => (
                              <li key={index} className="flex items-center space-x-2 text-xs sm:text-sm">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </StaggeredReveal>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </TabsContent>
              </Tabs>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Get Started?</h2>
              <p className="text-base sm:text-lg lg:text-xl text-primary-foreground/80 mb-6 sm:mb-8 max-w-none sm:max-w-xl lg:max-w-2xl mx-auto">
                Choose the product that fits your needs and start building today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full sm:w-auto min-h-[44px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6"
                  motionPreset="bounce"
                >
                  Start with Weekend Settlements
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="w-full sm:w-auto min-h-[44px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 text-white border-white/20 hover:bg-white/10"
                  motionPreset="default"
                >
                  Join BaaS Waitlist
                </Button>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}