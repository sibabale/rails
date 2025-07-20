import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Database, Webhook, Zap, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollReveal } from './ScrollReveal';

export function InteractiveApiSection() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode preference
  React.useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const apiTypes = [
    {
      id: 'rest',
      name: 'REST APIs',
      icon: <Code className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: 'Simple, intuitive endpoints',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'graphql',
      name: 'GraphQL',
      icon: <Database className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: 'Flexible data querying',
      color: 'text-pink-600 dark:text-pink-400'
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      icon: <Webhook className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: 'Real-time notifications',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'sdks',
      name: 'SDKs',
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: 'Native libraries',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const codeExamples = {
    rest: {
      title: 'Transaction Processing',
      description: 'Submit financial transactions to the Rails API',
      language: 'javascript',
      code: `// Submit a transaction
const response = await fetch('http://localhost:8000/api/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    txn_ref: 'TXN_001',
    userId: 'user123',
    amount: 100.50,
    type: 'debit',
    currency: 'ZAR',
    description: 'Test transaction',
    source_account: 'ACC001',
    metadata: {
      ip_address: '127.0.0.1',
      session_id: 'sess_123'
    }
  })
});

const result = await response.json();

// Response structure
{
  "message": "Transaction received and validated",
  "txn_ref": "TXN_001",
  "status": "queued",
  "timestamp": "2025-07-19T14:32:00Z"
}

// Check API health
const health = await fetch('http://localhost:8000/api/health');
const healthData = await health.json();

// Get transaction history
const transactions = await fetch(
  'http://localhost:8000/api/transactions?userId=user123&limit=10'
);`
    },
    graphql: {
      title: 'GraphQL Example',
      description: 'Query settlement data with precise field selection',
      language: 'graphql',
      code: `# Query settlements with filtering and pagination
query GetSettlements($limit: Int, $status: SettlementStatus) {
  settlements(limit: $limit, status: $status) {
    edges {
      node {
        id
        amount
        status
        bankCode
        reference
        createdAt
        estimatedCompletion
        fees {
          processingFee
          currency
        }
        bank {
          name
          code
          status
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}

# Variables
{
  "limit": 10,
  "status": "PROCESSING"
}

# Create a new settlement
mutation CreateSettlement($input: CreateSettlementInput!) {
  createSettlement(input: $input) {
    settlement {
      id
      status
      amount
      estimatedCompletion
    }
    errors {
      field
      message
    }
  }
}

# Input variables
{
  "input": {
    "amount": 150000,
    "bankCode": "FNB",
    "reference": "WS_2025_001",
    "webhookUrl": "https://your-app.com/webhook"
  }
}`
    },
    webhooks: {
      title: 'Webhook Integration',
      description: 'Receive real-time notifications for settlement events',
      language: 'javascript',
      code: `// Configure webhook endpoint
const webhookConfig = await fetch('/api/v1/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_api_key_here'
  },
  body: JSON.stringify({
    url: 'https://your-app.com/rails-webhook',
    events: [
      'settlement.created',
      'settlement.processing',
      'settlement.completed',
      'settlement.failed'
    ],
    secret: 'whsec_your_webhook_secret'
  })
});

// Webhook payload example (settlement.completed)
const webhookPayload = {
  id: 'evt_1a2b3c4d5e',
  type: 'settlement.completed',
  created: 1642678800,
  data: {
    object: {
      id: 'sttl_7k8j9l0m1n2o',
      amount: 150000,
      bank_code: 'FNB',
      status: 'completed',
      reference: 'WS_2025_001',
      completion_time: '2025-07-21T08:45:32Z',
      fees: {
        processing_fee: 1500,
        currency: 'ZAR'
      }
    }
  }
};

// Webhook verification (Express.js)
const crypto = require('crypto');

app.post('/rails-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const payload = req.body;
  const signature = req.headers['x-rails-signature'];
  const secret = process.env.RAILS_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  if (signature === \`sha256=\${expectedSignature}\`) {
    // Process webhook
    const event = JSON.parse(payload);
    console.log('Received webhook:', event.type);
    res.status(200).send('OK');
  } else {
    res.status(400).send('Invalid signature');
  }
});`
    },
    sdks: {
      title: 'SDK Examples',
      description: 'Native libraries for seamless integration',
      language: 'javascript',
      code: `// Node.js SDK
npm install @rails/node-sdk

const { Rails } = require('@rails/node-sdk');
const rails = new Rails({
  apiKey: 'your_api_key_here',
  environment: 'sandbox' // or 'production'
});

// Process settlement
try {
  const settlement = await rails.settlements.create({
    amount: 150000,
    bankCode: 'FNB',
    reference: 'WS_2025_001',
    webhookUrl: 'https://your-app.com/webhook'
  });
  
  console.log('Settlement created:', settlement.id);
} catch (error) {
  console.error('Settlement failed:', error.message);
}

// Python SDK
pip install rails-python

from rails import Rails

rails = Rails(api_key='your_api_key_here')

settlement = rails.settlements.create(
    amount=150000,
    bank_code='FNB', 
    reference='WS_2025_001',
    webhook_url='https://your-app.com/webhook'
)

print(f"Settlement created: {settlement.id}")

// React/JavaScript SDK
npm install @rails/react-sdk

import { useRails, Settlement } from '@rails/react-sdk';

function SettlementForm() {
  const { processSettlement, loading, error } = useRails({
    apiKey: 'your_api_key_here'
  });
  
  const handleSubmit = async (data) => {
    try {
      const result = await processSettlement({
        amount: data.amount,
        bankCode: data.bank,
        reference: data.reference
      });
      
      console.log('Settlement processed:', result);
    } catch (err) {
      console.error('Processing failed:', err);
    }
  };
  
  return (
    <Settlement 
      onSubmit={handleSubmit} 
      loading={loading}
      error={error}
    />
  );
}

// PHP SDK
composer require rails/php-sdk

use Rails\\Client;

$rails = new Client([
    'api_key' => 'your_api_key_here',
    'environment' => 'sandbox'
]);

$settlement = $rails->settlements->create([
    'amount' => 150000,
    'bank_code' => 'FNB',
    'reference' => 'WS_2025_001',
    'webhook_url' => 'https://your-app.com/webhook'
]);

echo "Settlement ID: " . $settlement->id;`
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-none lg:max-w-7xl mx-auto">
          {/* Header - Explicitly override spacing and typography */}
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6"
                style={{ 
                  fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                  lineHeight: '1.2',
                  marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
                }}
              >
                Developer-First APIs
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-none sm:max-w-2xl lg:max-w-3xl mx-auto"
                style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)',
                  lineHeight: '1.6',
                  maxWidth: '48rem'
                }}
              >
                Modern, well-documented APIs designed for developers. Get started in minutes with comprehensive examples and SDKs.
              </motion.p>
            </div>
          </ScrollReveal>

          {/* Interactive API Tabs */}
          <ScrollReveal delay={0.2}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs defaultValue="rest" className="w-full">
                {/* API Type Selector - Override default spacing */}
                <div className="mb-8 sm:mb-12">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0 h-auto p-1 bg-muted/50">
                    {apiTypes.map((type) => (
                      <TabsTrigger
                        key={type.id}
                        value={type.id}
                        className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 min-h-[60px] sm:min-h-[44px] text-left data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                        style={{
                          padding: 'clamp(0.75rem, 2vw, 1rem)',
                          gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                          minHeight: '44px'
                        }}
                      >
                        <motion.div 
                          className={`${type.color} flex-shrink-0`}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                          {type.icon}
                        </motion.div>
                        <div className="text-center sm:text-left min-w-0">
                          <div 
                            className="font-medium text-xs sm:text-sm truncate"
                            style={{ 
                              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                              fontWeight: '500'
                            }}
                          >
                            {type.name}
                          </div>
                          <div 
                            className="text-xs text-muted-foreground hidden sm:block truncate"
                            style={{ 
                              fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                              lineHeight: '1.4'
                            }}
                          >
                            {type.description}
                          </div>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Code Examples - Explicitly styled for responsiveness */}
                <AnimatePresence mode="wait">
                  {Object.entries(codeExamples).map(([key, example]) => (
                    <TabsContent key={key} value={key} className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden card-responsive">
                          <CardHeader 
                            className="pb-4"
                            style={{ 
                              padding: 'clamp(1rem, 3vw, 1.5rem)',
                              paddingBottom: 'clamp(0.75rem, 2vw, 1rem)'
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="min-w-0 flex-1">
                                <CardTitle 
                                  className="text-lg sm:text-xl mb-2 truncate"
                                  style={{
                                    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                                    marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                                    fontWeight: '600'
                                  }}
                                >
                                  {example.title}
                                </CardTitle>
                                <CardDescription 
                                  className="text-sm sm:text-base"
                                  style={{
                                    fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                                    lineHeight: '1.5'
                                  }}
                                >
                                  {example.description}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)' }}
                                >
                                  Live Example
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(example.code, key)}
                                  className="min-h-[36px] px-3 gap-2 flex-shrink-0 btn-responsive"
                                  motionPreset="subtle"
                                  style={{
                                    minHeight: '44px',
                                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                                    gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                                  }}
                                >
                                  {copiedCode === key ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      <span className="text-xs sm:text-sm">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span className="text-xs sm:text-sm hidden sm:inline">Copy</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="relative">
                              {/* Syntax Highlighted Code Block with explicit responsive styling */}
                              <motion.div 
                                className="overflow-hidden code-container"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                <div 
                                  className="max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto"
                                  style={{ maxHeight: 'clamp(300px, 50vh, 600px)' }}
                                >
                                  <SyntaxHighlighter
                                    language={example.language}
                                    style={isDarkMode ? oneDark : oneLight}
                                    customStyle={{
                                      margin: 0,
                                      padding: 'clamp(1rem, 3vw, 1.5rem)',
                                      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                      lineHeight: '1.6',
                                      borderRadius: 0,
                                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                                      maxWidth: '100%',
                                      overflow: 'auto'
                                    }}
                                    wrapLines={true}
                                    wrapLongLines={true}
                                    showLineNumbers={false}
                                    className="syntax-highlighter"
                                    codeTagProps={{
                                      style: {
                                        fontSize: 'inherit',
                                        lineHeight: 'inherit',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'inherit'
                                      }
                                    }}
                                  >
                                    {example.code}
                                  </SyntaxHighlighter>
                                </div>
                              </motion.div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </TabsContent>
                  ))}
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </ScrollReveal>

          {/* Documentation Links - Explicitly styled for responsiveness */}
          <ScrollReveal delay={0.4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 sm:mt-12 text-center"
              style={{ marginTop: 'clamp(2rem, 5vw, 3rem)' }}
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="min-h-[44px] px-6 sm:px-8 text-sm sm:text-base btn-responsive"
                  motionPreset="default"
                  style={{
                    minHeight: '44px',
                    padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)'
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Full API Documentation</span>
                  <span className="sm:hidden">API Docs</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="min-h-[44px] px-6 sm:px-8 text-sm sm:text-base btn-responsive"
                  motionPreset="subtle"
                  style={{
                    minHeight: '44px',
                    padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                  }}
                >
                  <span className="hidden sm:inline">Download SDKs</span>
                  <span className="sm:hidden">SDKs</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="min-h-[44px] px-6 sm:px-8 text-sm sm:text-base btn-responsive"
                  motionPreset="subtle"
                  style={{
                    minHeight: '44px',
                    padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                  }}
                >
                  <span className="hidden sm:inline">Try in Sandbox</span>
                  <span className="sm:hidden">Sandbox</span>
                </Button>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}