import React from 'react';

export interface FooterProps {
  /** Navigation callback for internal routing */
  onNavigate?: (page: 'home' | 'dashboard' | 'products') => void;
  
  /** CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Whether to show the company info section */
  showCompanyInfo?: boolean;
  
  /** Custom company name */
  companyName?: string;
  
  /** Custom company description */
  companyDescription?: string;
  
  /** Custom contact email */
  contactEmail?: string;
  
  /** Custom support email */
  supportEmail?: string;
  
  /** Whether to show the product links section */
  showProductLinks?: boolean;
  
  /** Custom product links */
  productLinks?: FooterLink[];
  
  /** Whether to show the company links section */
  showCompanyLinks?: boolean;
  
  /** Custom company links */
  companyLinks?: FooterLink[];
  
  /** Whether to show the developers links section */
  showDeveloperLinks?: boolean;
  
  /** Custom developer links */
  developerLinks?: FooterLink[];
  
  /** Whether to show the support links section */
  showSupportLinks?: boolean;
  
  /** Custom support links */
  supportLinks?: FooterLink[];
  
  /** Whether to show the connected banks section */
  showConnectedBanks?: boolean;
  
  /** Custom bank logos */
  bankLogos?: BankLogo[];
  
  /** Whether to show the legal disclaimer */
  showLegalDisclaimer?: boolean;
  
  /** Custom legal disclaimer text */
  legalDisclaimerText?: string;
  
  /** Whether to show the legal links */
  showLegalLinks?: boolean;
  
  /** Custom legal links */
  legalLinks?: FooterLink[];
  
  /** Copyright year */
  copyrightYear?: number;
  
  /** Copyright text */
  copyrightText?: string;
  
  /** Whether to show the "Made with ❤️" text */
  showMadeWithLove?: boolean;
  
  /** Custom "made with love" text */
  madeWithLoveText?: string;
  
  /** Custom theme colors */
  theme?: FooterTheme;
}

export interface FooterLink {
  /** Display name of the link */
  name: string;
  
  /** URL or href for the link */
  href?: string;
  
  /** Click handler for internal navigation */
  onClick?: () => void;
  
  /** Whether the link opens in a new tab */
  external?: boolean;
  
  /** Icon component to display with the link */
  icon?: React.ReactNode;
  
  /** Whether the link is disabled */
  disabled?: boolean;
  
  /** Accessibility label */
  ariaLabel?: string;
}

export interface BankLogo {
  /** Bank name */
  name: string;
  
  /** Logo image URL */
  logo: string;
  
  /** Alt text for the logo */
  alt: string;
  
  /** Website URL for the bank */
  website?: string;
  
  /** Whether the logo should be clickable */
  clickable?: boolean;
}

export interface FooterTheme {
  /** Background color */
  backgroundColor?: string;
  
  /** Primary text color */
  textColor?: string;
  
  /** Secondary text color (for descriptions) */
  secondaryTextColor?: string;
  
  /** Link hover color */
  linkHoverColor?: string;
  
  /** Border color */
  borderColor?: string;
  
  /** Company info background */
  companyInfoBackground?: string;
  
  /** Legal disclaimer background */
  legalDisclaimerBackground?: string;
  
  /** Legal disclaimer border */
  legalDisclaimerBorder?: string;
}

export interface FooterState {
  /** Currently hovered link */
  hoveredLink: string | null;
  
  /** Currently hovered bank logo */
  hoveredBank: string | null;
  
  /** Whether any links are being interacted with */
  isInteracting: boolean;
  
  /** Current viewport size for responsive behavior */
  viewportSize: 'mobile' | 'tablet' | 'desktop';
  
  /** Whether images have loaded */
  imagesLoaded: boolean;
}

export interface FooterEvents {
  /** Called when a footer link is clicked */
  onLinkClick?: (link: FooterLink) => void;
  
  /** Called when a bank logo is clicked */
  onBankLogoClick?: (bank: BankLogo) => void;
  
  /** Called when the company logo is clicked */
  onCompanyLogoClick?: () => void;
  
  /** Called when navigation is requested */
  onNavigationRequest?: (page: string) => void;
  
  /** Called when external link is clicked */
  onExternalLinkClick?: (url: string) => void;
  
  /** Called when email link is clicked */
  onEmailClick?: (email: string) => void;
  
  /** Called when legal link is clicked */
  onLegalLinkClick?: (link: FooterLink) => void;
}

export interface FooterSections {
  /** Company information section data */
  companyInfo: {
    name: string;
    description: string;
    contact: {
      email: string;
      support: string;
    };
  };
  
  /** Product links section data */
  products: FooterLink[];
  
  /** Company links section data */
  company: FooterLink[];
  
  /** Developer links section data */
  developers: FooterLink[];
  
  /** Support links section data */
  support: FooterLink[];
  
  /** Legal links section data */
  legal: FooterLink[];
  
  /** Connected banks data */
  banks: BankLogo[];
}

export interface FooterUtils {
  /** Format email for display */
  formatEmail: (email: string) => string;
  
  /** Check if link is external */
  isExternalLink: (url: string) => boolean;
  
  /** Get current year for copyright */
  getCurrentYear: () => number;
  
  /** Handle responsive image loading */
  handleImageLoad: (bankName: string) => void;
  
  /** Handle link accessibility */
  getAriaLabel: (link: FooterLink) => string;
  
  /** Handle bank logo fallback */
  getBankLogoFallback: (bank: BankLogo) => string;
}