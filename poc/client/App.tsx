import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { store, persistor } from './lib/store';
import { initializeAnalytics, trackPageView } from './lib/analytics';
import { Navigation } from './components/organisms/Navigation';
import { HomePage } from './components/pages/HomePage';
import { BankDashboardPage } from './components/pages/BankDashboardPage';
import { InternalDashboardPage } from './components/pages/InternalDashboardPage';
import { ProductsPage } from './components/pages/ProductsPage';
import { BankRegistrationForm } from './components/organisms/BankRegistrationForm';
import { BankLoginForm } from './components/organisms/BankLoginForm';

// Component to handle meta tags and analytics based on route
function MetaUpdater() {
  const location = useLocation();

  useEffect(() => {
    const pageConfig = {
      '/': {
        title: 'Rails - Financial Infrastructure for South Africa',
        description: 'Modern financial infrastructure for South Africa. Build banking products with Rails\' secure, scalable APIs. Weekend settlements and Bank-as-a-Service solutions.'
      },
      '/products': {
        title: 'Products - Banking APIs & Infrastructure | Rails',
        description: 'Explore Rails financial products: Weekend Settlements for real-time processing and Bank-as-a-Service for complete banking infrastructure. Built for South African banks.'
      },
      '/dashboard': {
        title: 'Bank Dashboard - Rails Financial Platform',
        description: 'Monitor your bank transactions and manage weekend settlements with Rails platform.'
      },
      '/dashboard/internal': {
        title: 'Internal Dashboard - Rails Financial Platform',
        description: 'Internal Rails dashboard with full system metrics and controls.'
      },
      '/register': {
        title: 'Bank Registration - Join Rails Platform',
        description: 'Register your bank with Rails financial infrastructure platform. Complete compliance verification and get instant access to modern banking APIs.'
      },
      '/login': {
        title: 'Bank Login - Access Rails Dashboard',
        description: 'Access your Rails banking dashboard. Monitor transactions, manage clients, and view real-time analytics for your bank operations.'
      }
    };

    const config = pageConfig[location.pathname] || pageConfig['/'];
    document.title = config.title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', config.description);

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const baseUrl = 'https://rails.co.za';
    const pageUrl = location.pathname === '/' ? baseUrl : `${baseUrl}${location.pathname}`;
    canonicalLink.setAttribute('href', pageUrl);

    // Add structured data for organization on home page
    if (location.pathname === '/') {
      let structuredData = document.querySelector('#structured-data');
      if (!structuredData) {
        structuredData = document.createElement('script');
        structuredData.setAttribute('type', 'application/ld+json');
        structuredData.setAttribute('id', 'structured-data');
        document.head.appendChild(structuredData);
      }
      
      const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Rails",
        "description": "Financial infrastructure platform providing banking APIs and settlement solutions for South Africa",
        "url": "https://rails.co.za",
        "logo": "https://rails.co.za/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+27-11-000-0000",
          "contactType": "customer service",
          "areaServed": "ZA",
          "availableLanguage": "en"
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "ZA",
          "addressRegion": "Gauteng"
        },
        "sameAs": [
          "https://linkedin.com/company/rails",
          "https://twitter.com/rails"
        ]
      };
      
      structuredData.textContent = JSON.stringify(organizationData);
    }

    // Track page view for analytics
    trackPageView(location.pathname, config.title);
  }, [location.pathname]);

  return null;
}

// Layout component that includes navigation
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand-950 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      
      <header>
        <Navigation />
      </header>
      
      <main id="main-content" role="main">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  // Initialize analytics on app startup
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>} persistor={persistor}>
        <BrowserRouter>
          <MetaUpdater />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<BankDashboardPage />} />
              <Route path="/dashboard/internal" element={<InternalDashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/register" element={
                <div className="container mx-auto px-4 py-8">
                  <BankRegistrationForm />
                </div>
              } />
              <Route path="/login" element={
                <div className="container mx-auto px-4 py-8">
                  <BankLoginForm />
                </div>
              } />
            </Routes>
          </Layout>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}