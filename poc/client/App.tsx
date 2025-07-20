import React, { useState, useEffect } from 'react';
import { AppProvider } from './lib/context';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { DashboardPage } from './components/DashboardPage';
import { ProductsPage } from './components/ProductsPage';
import { BankRegistrationForm } from './components/BankRegistrationForm';
import { BankLoginForm } from './components/BankLoginForm';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'products' | 'register' | 'login'>('home');

  // Update document title and meta description based on current page
  useEffect(() => {
    const pageConfig = {
      home: {
        title: 'Rails - Financial Infrastructure for South Africa',
        description: 'Modern financial infrastructure for South Africa. Build banking products with Rails\' secure, scalable APIs. Weekend settlements and Bank-as-a-Service solutions.'
      },
      products: {
        title: 'Products - Banking APIs & Infrastructure | Rails',
        description: 'Explore Rails financial products: Weekend Settlements for real-time processing and Bank-as-a-Service for complete banking infrastructure. Built for South African banks.'
      },
      dashboard: {
        title: 'Dashboard - Rails Financial Platform',
        description: 'Monitor your financial infrastructure with Rails dashboard. View transaction logs, bank connections, reserves, and settlement analytics in real-time.'
      },
      register: {
        title: 'Bank Registration - Join Rails Platform',
        description: 'Register your bank with Rails financial infrastructure platform. Complete compliance verification and get instant access to modern banking APIs.'
      },
      login: {
        title: 'Bank Login - Access Rails Dashboard',
        description: 'Access your Rails banking dashboard. Monitor transactions, manage clients, and view real-time analytics for your bank operations.'
      }
    };

    const config = pageConfig[currentPage];
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
    const pageUrl = currentPage === 'home' ? baseUrl : `${baseUrl}/${currentPage}`;
    canonicalLink.setAttribute('href', pageUrl);

    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', config.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', config.description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', pageUrl);

    // Update Twitter Card tags
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', config.title);

    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', config.description);

    // Add structured data for organization
    if (currentPage === 'home') {
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
  }, [currentPage]);

  const handleNavigation = (page: 'home' | 'dashboard' | 'products' | 'register' | 'login') => {
    setCurrentPage(page);
    
    // Scroll to top on navigation for better UX
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-background">
        {/* Skip link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        <header>
          <Navigation currentPage={currentPage} onNavigate={handleNavigation} />
        </header>
        
        <main id="main-content" role="main">
          {currentPage === 'home' && <HomePage onNavigate={handleNavigation} />}
          {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigation} />}
          {currentPage === 'products' && <ProductsPage onNavigate={handleNavigation} />}
          {currentPage === 'register' && (
            <div className="container mx-auto px-4 py-8">
              <BankRegistrationForm />
            </div>
          )}
          {currentPage === 'login' && (
            <div className="container mx-auto px-4 py-8">
              <BankLoginForm />
            </div>
          )}
        </main>
      </div>
    </AppProvider>
  );
}