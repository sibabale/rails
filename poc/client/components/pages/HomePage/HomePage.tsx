import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Shield, Zap, Globe, Building2, Database, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Footer } from '../../organisms/Footer';
import { AnimatedCounter, percentageFormatter } from '../../atoms/AnimatedCounter';
import { ScrollReveal, StaggeredReveal } from '../../atoms/ScrollReveal';
import { InteractiveApiSection } from '../../organisms/InteractiveApiSection';
import type { HomePageProps, Feature, Bank } from './HomePage.interface';
import { cn } from '../../ui/utils';

export function HomePage({ 
  onNavigate,
  className,
  style,
  'data-testid': dataTestId = 'home-page'
}: HomePageProps) {
  const features: Feature[] = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Scale with Confidence",
      description: "Modern infrastructure built to handle millions of transactions with sub-second processing times"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Compliance & Security",
      description: "Full AML, KYC, and regulatory compliance handled for you with bank-grade security"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Resilient & Reliable",
      description: "99.9% uptime SLA with redundant systems and real-time monitoring across South Africa"
    }
  ];

  const banks: Bank[] = [
    { name: "First National Bank", abbr: "FNB", status: "Connected" },
    { name: "ABSA Bank", abbr: "ABSA", status: "Connected" },
    { name: "Standard Bank", abbr: "SB", status: "Connected" },
    { name: "Nedbank", abbr: "NB", status: "Connected" }
  ];

  const handleProductsClick = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  // Hero animation variants
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

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const cardHover = {
    y: -5,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    transition: { type: "spring", stiffness: 300, damping: 20 }
  };

  return (
    <div 
      className={cn('min-h-screen', className)}
      style={style}
      data-testid={dataTestId}
    >
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
              variants={staggerContainer}
            >
              <motion.div variants={heroVariants}>
                <Badge className="mb-4 sm:mb-6 bg-white/10 text-white border-white/20 text-xs sm:text-sm">
                  Powering Financial Innovation in South Africa
                </Badge>
              </motion.div>
              
              <motion.h1 
                variants={heroVariants}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight"
              >
                Financial Infrastructure
                <br />
                <span className="text-white/80">That Just Works</span>
              </motion.h1>
              
              <motion.p 
                variants={heroVariants}
                className="text-base sm:text-lg lg:text-xl xl:text-2xl text-white/80 mb-6 sm:mb-8 max-w-none sm:max-w-2xl lg:max-w-3xl mx-auto"
              >
                Build banking products without the complexity. Rails provides scalable, compliant financial infrastructure 
                with modern APIs, so you can focus on what matters most—your customers.
              </motion.p>
              
              <motion.div 
                variants={heroVariants}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
              >
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full sm:w-auto min-h-[44px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6"
                  motionPreset="bounce"
                >
                  Start Building Today
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
                
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="w-full sm:w-auto min-h-[44px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
                  motionPreset="default"
                >
                  View Documentation
                </Button>
              </motion.div>
              
              <motion.div 
                variants={heroVariants}
                className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-primary-foreground/60"
              >
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
                    <AnimatedCounter to={99.9} format={percentageFormatter(1)} duration={2} />
                  </div>
                  <div className="text-xs sm:text-sm">Uptime SLA</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-primary-foreground/20" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
                    <AnimatedCounter to={1.2} decimals={1} suffix="s" duration={2} prefix="<" />
                  </div>
                  <div className="text-xs sm:text-sm">Avg Response</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-primary-foreground/20" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
                    <AnimatedCounter to={4} duration={1.5} />
                  </div>
                  <div className="text-xs sm:text-sm">Major Banks</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Why Choose Rails?</h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-none sm:max-w-xl lg:max-w-2xl mx-auto">
                We handle the complexity of financial infrastructure so you can focus on building great products
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-none lg:max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={cardHover}
                className="cursor-pointer"
              >
                <Card className="text-center p-4 sm:p-6 lg:p-8 h-full hover:shadow-lg transition-shadow duration-300" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <CardHeader className="pb-3 sm:pb-4">
                    <motion.div 
                      className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4"
                      style={{ backgroundColor: '#f0f0f3' }}
                      whileHover={{ 
                        rotate: 5,
                        scale: 1.1,
                        transition: { type: "spring", stiffness: 300, damping: 15 }
                      }}
                    >
                      <div style={{ color: '#030213' }}>{feature.icon}</div>
                    </motion.div>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm sm:text-base lg:text-lg">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#f3f3f5' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Our Products</h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-none sm:max-w-xl lg:max-w-2xl mx-auto">
                Enterprise-grade financial solutions designed for the modern economy
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-none lg:max-w-6xl mx-auto">
            {/* Weekend Settlements */}
            <ScrollReveal delay={0.1} direction="left">
              <motion.div whileHover={cardHover}>
                <Card className="p-6 sm:p-8 relative overflow-hidden h-full" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">Live Now</Badge>
                  </div>
                  <CardHeader className="p-0 mb-4 sm:mb-6">
                    <motion.div 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                      style={{ backgroundColor: '#030213' }}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5,
                        transition: { type: "spring", stiffness: 300, damping: 15 }
                      }}
                    >
                      <Building2 className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#ffffff' }} />
                    </motion.div>
                    <CardTitle className="text-xl sm:text-2xl">Weekend Settlements</CardTitle>
                    <CardDescription className="text-sm sm:text-base lg:text-lg">
                      Process transactions from South Africa's top 4 banks during weekends with real-time clearing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-3 sm:space-y-4 mb-6">
                      {[
                        "Real-time webhook notifications",
                        "99.2% transaction success rate",
                        "Monday clearing preparation",
                        "Reserve management included"
                      ].map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="flex items-center space-x-3"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                          <span className="text-sm sm:text-base">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                    <Button 
                      className="w-full min-h-[44px] text-sm sm:text-base" 
                      onClick={handleProductsClick}
                      motionPreset="default"
                    >
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </ScrollReveal>

            {/* Bank-as-a-Service */}
            <ScrollReveal delay={0.2} direction="right">
              <motion.div whileHover={cardHover}>
                <Card className="p-6 sm:p-8 relative overflow-hidden h-full" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="text-xs sm:text-sm">Coming Soon</Badge>
                  </div>
                  <CardHeader className="p-0 mb-4 sm:mb-6">
                    <motion.div 
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5,
                        transition: { type: "spring", stiffness: 300, damping: 15 }
                      }}
                    >
                      <Database className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-xl sm:text-2xl">Bank-as-a-Service</CardTitle>
                    <CardDescription className="text-sm sm:text-base lg:text-lg">
                      Full banking infrastructure for startups with banking licenses to launch products fast
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-3 sm:space-y-4 mb-6">
                      {[
                        "Complete core banking system",
                        "Regulatory compliance built-in",
                        "White-label ready",
                        "Scale from day one"
                      ].map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="flex items-center space-x-3"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm sm:text-base">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full min-h-[44px] text-sm sm:text-base" 
                      onClick={handleProductsClick}
                      motionPreset="default"
                    >
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Interactive API Section */}
      <InteractiveApiSection />

      {/* Connected Banks */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Connected to South Africa's Top Banks</h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
                Direct integrations with all major South African financial institutions
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-none sm:max-w-2xl lg:max-w-4xl mx-auto">
            {banks.map((bank, index) => (
              <motion.div
                key={index}
                whileHover={cardHover}
                className="cursor-pointer"
              >
                <Card className="p-4 sm:p-6 text-center h-full hover:shadow-lg transition-shadow duration-300">
                  <motion.div 
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                    whileHover={{ 
                      rotate: 5,
                      scale: 1.1,
                      transition: { type: "spring", stiffness: 300, damping: 15 }
                    }}
                  >
                    <span className="text-base sm:text-xl font-bold text-primary">{bank.abbr}</span>
                  </motion.div>
                  <h3 className="font-medium mb-2 text-sm sm:text-base">{bank.name}</h3>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs">
                    <motion.div 
                      className="w-2 h-2 bg-emerald-500 rounded-full mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {bank.status}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-16 sm:py-20 lg:py-24 text-white"
        style={{
          background: 'linear-gradient(to right, #030213, #030213e6)'
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Build the Future of Finance?</h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 max-w-none sm:max-w-xl lg:max-w-2xl mx-auto">
                Join leading fintechs who trust Rails for their financial infrastructure needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full sm:w-auto min-h-[44px] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6"
                  motionPreset="bounce"
                >
                  Get Started Free
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
          </ScrollReveal>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}