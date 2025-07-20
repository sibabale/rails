import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface FooterProps {
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const productLinks = [
    { name: "Weekend Settlements", href: "#", onClick: () => onNavigate?.('products') },
    { name: "Bank-as-a-Service", href: "#", onClick: () => onNavigate?.('products') },
    { name: "API Documentation", href: "#" },
    { name: "SDK Downloads", href: "#" },
    { name: "Webhooks", href: "#" }
  ];

  const companyLinks = [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#" },
    { name: "Press", href: "#" }
  ];

  const developersLinks = [
    { name: "API Reference", href: "#" },
    { name: "Integration Guides", href: "#" },
    { name: "Code Examples", href: "#" },
    { name: "Sandbox", href: "#" },
    { name: "Status Page", href: "#" }
  ];

  const supportLinks = [
    { name: "Help Center", href: "#" },
    { name: "Community", href: "#" },
    { name: "Support Tickets", href: "#" },
    { name: "System Status", href: "#" },
    { name: "Security", href: "#" }
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
    { name: "Compliance", href: "#" }
  ];

  // Bank logos from Brandfetch - using their brand assets
  const banks = [
    {
      name: "First National Bank",
      logo: "https://assets.brandfetch.io/idAnDTFapY/idJBrsSSZD/w/400/h/400/logo.png?c=1idAnDTFapY",
      alt: "FNB Logo"
    },
    {
      name: "ABSA Bank",
      logo: "https://assets.brandfetch.io/idANBBOaWy/id3z8ZtGVm/w/400/h/400/logo.png?c=1idANBBOaWy",
      alt: "ABSA Logo"
    },
    {
      name: "Standard Bank",
      logo: "https://assets.brandfetch.io/idRiGgLBV0/idJQnNSXDJ/w/400/h/400/logo.png?c=1idRiGgLBV0",
      alt: "Standard Bank Logo"
    },
    {
      name: "Nedbank",
      logo: "https://assets.brandfetch.io/idZjhcrpnt/idjYdI8Duz/w/400/h/400/logo.png?c=1idZjhcrpnt",
      alt: "Nedbank Logo"
    }
  ];

  return (
    <footer className="border-t" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.1)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-12">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#030213' }}>
                  <span className="font-bold text-sm sm:text-base" style={{ color: '#ffffff' }}>R</span>
                </div>
                <span className="font-semibold text-base sm:text-lg">Rails</span>
              </div>
              <p className="mb-4 sm:mb-6 max-w-none sm:max-w-md text-sm sm:text-base" style={{ color: '#717182' }}>
                Modern financial infrastructure for South Africa. Build banking products with confidence using our secure, scalable APIs.
              </p>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm" style={{ color: '#717182' }}>
                  <span className="font-medium">Contact:</span> hello@rails.co.za
                </p>
                <p className="text-xs sm:text-sm" style={{ color: '#717182' }}>
                  <span className="font-medium">Support:</span> support@rails.co.za
                </p>
              </div>
            </div>

            {/* Products */}
            <div className="sm:col-span-1">
              <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Products</h3>
              <ul className="space-y-2 sm:space-y-3">
                {productLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={link.onClick}
                      className="transition-colors text-xs sm:text-sm text-left min-h-[44px] flex items-center"
                      style={{ color: '#717182' }}
                      onMouseEnter={(e) => e.target.style.color = '#030213'}
                      onMouseLeave={(e) => e.target.style.color = '#717182'}
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="sm:col-span-1">
              <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
              <ul className="space-y-2 sm:space-y-3">
                {companyLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="transition-colors text-xs sm:text-sm min-h-[44px] flex items-center"
                      style={{ color: '#717182' }}
                      onMouseEnter={(e) => e.target.style.color = '#030213'}
                      onMouseLeave={(e) => e.target.style.color = '#717182'}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Developers */}
            <div className="sm:col-span-1">
              <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Developers</h3>
              <ul className="space-y-2 sm:space-y-3">
                {developersLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="transition-colors text-xs sm:text-sm min-h-[44px] flex items-center"
                      style={{ color: '#717182' }}
                      onMouseEnter={(e) => e.target.style.color = '#030213'}
                      onMouseLeave={(e) => e.target.style.color = '#717182'}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="sm:col-span-1">
              <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2 sm:space-y-3">
                {supportLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="transition-colors text-xs sm:text-sm min-h-[44px] flex items-center"
                      style={{ color: '#717182' }}
                      onMouseEnter={(e) => e.target.style.color = '#030213'}
                      onMouseLeave={(e) => e.target.style.color = '#717182'}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Connected Banks Section */}
        <div className="py-6 sm:py-8 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
          <div className="text-center mb-6 sm:mb-8">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Connected Banks</h4>
            <p className="text-xs sm:text-sm" style={{ color: '#717182' }}>
              Integrated with South Africa's leading financial institutions
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-12">
            {banks.map((bank, index) => (
              <div key={index} className="flex items-center justify-center">
                <ImageWithFallback
                  src={bank.logo}
                  alt={bank.alt}
                  className="h-6 sm:h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity filter grayscale hover:grayscale-0"
                  style={{ maxWidth: '100px', maxHeight: '32px' }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="py-6 sm:py-8 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 sm:p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 mt-0.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 text-sm sm:text-base">
                  Important Legal Disclaimer
                </h4>
                <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 space-y-2">
                  <p>
                    <strong>Rails is not a bank</strong> and is not a real financial services company. This is a proof-of-concept (POC) 
                    demonstration application created for educational and demonstration purposes only.
                  </p>
                  <p>
                    Rails has <strong>no affiliations</strong> with First National Bank (FNB), ABSA Bank, Standard Bank, 
                    Nedbank, or any other financial institutions mentioned on this website. The bank names and logos are 
                    used solely for demonstration purposes.
                  </p>
                  <p>
                    <strong>All transaction data displayed is mock data</strong> and does not represent real financial transactions. 
                    No actual money transfers, settlements, or banking operations are performed by this application.
                  </p>
                  <p className="hidden sm:block">
                    This demonstration should not be used for actual financial operations, and users should not input any 
                    real financial information or credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-4 sm:py-6 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 lg:space-x-6">
              <p className="text-xs sm:text-sm text-center md:text-left" style={{ color: '#717182' }}>
                © 2025 Rails POC. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 sm:gap-x-4">
                {legalLinks.map((link, index) => (
                  <a 
                    key={index}
                    href={link.href} 
                    className="text-xs sm:text-sm transition-colors min-h-[44px] flex items-center px-1"
                    style={{ color: '#717182' }}
                    onMouseEnter={(e) => e.target.style.color = '#030213'}
                    onMouseLeave={(e) => e.target.style.color = '#717182'}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <p className="text-xs sm:text-sm text-center" style={{ color: '#717182' }}>
                Made with ❤️ in South Africa
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}