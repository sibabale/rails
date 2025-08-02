import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Footer } from './Footer';
import type { FooterProps } from './Footer.interface';

// Mock the ImageWithFallback component
jest.mock('../../figma/ImageWithFallback', () => ({
  ImageWithFallback: ({ src, alt, className, onLoad, onError, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onLoad={onLoad}
      onError={onError}
      {...props}
      data-testid="bank-logo"
    />
  ),
}));

describe('Footer', () => {
  describe('Public Interface Validation', () => {
    test('should render with default props', () => {
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText('Rails')).toBeInTheDocument();
      expect(screen.getByText(/Modern financial infrastructure/)).toBeInTheDocument();
      expect(screen.getByText('© 2025 Rails POC. All rights reserved.')).toBeInTheDocument();
    });

    test('should handle optional props correctly', () => {
      const customProps: FooterProps = {
        companyName: 'Custom Company',
        companyDescription: 'Custom description text',
        contactEmail: 'custom@example.com',
        supportEmail: 'support@example.com',
        copyrightYear: 2024,
        copyrightText: '© 2024 Custom Company. All rights reserved.',
        madeWithLoveText: 'Made with ❤️ in Custom Location',
        showLegalDisclaimer: false,
        showConnectedBanks: false,
        theme: {
          backgroundColor: '#f0f0f0',
          textColor: '#333333',
        },
      };

      render(<Footer {...customProps} />);
      
      expect(screen.getByText('Custom Company')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
      expect(screen.getByText('custom@example.com')).toBeInTheDocument();
      expect(screen.getByText('support@example.com')).toBeInTheDocument();
      expect(screen.getByText('© 2024 Custom Company. All rights reserved.')).toBeInTheDocument();
      expect(screen.getByText('Made with ❤️ in Custom Location')).toBeInTheDocument();
    });

    test('should validate prop types', () => {
      const { rerender } = render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      rerender(<Footer showLegalDisclaimer={false} />);
      
      expect(screen.queryByText(/Important Legal Disclaimer/)).not.toBeInTheDocument();
    });

    test('should handle custom link sections', () => {
      const customProductLinks = [
        { name: 'Custom Product 1', href: '#product1' },
        { name: 'Custom Product 2', href: '#product2' },
      ];

      const customCompanyLinks = [
        { name: 'Custom About', href: '#about' },
        { name: 'Custom Contact', href: '#contact' },
      ];

      render(
        <Footer 
          productLinks={customProductLinks}
          companyLinks={customCompanyLinks}
        />
      );
      
      expect(screen.getByText('Custom Product 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Product 2')).toBeInTheDocument();
      expect(screen.getByText('Custom About')).toBeInTheDocument();
      expect(screen.getByText('Custom Contact')).toBeInTheDocument();
    });

    test('should handle custom bank logos', () => {
      const customBanks = [
        {
          name: 'Test Bank',
          logo: 'https://example.com/test-bank-logo.png',
          alt: 'Test Bank Logo',
          website: 'https://testbank.com',
        },
      ];

      render(<Footer bankLogos={customBanks} />);
      
      const bankLogo = screen.getByAltText('Test Bank Logo');
      expect(bankLogo).toBeInTheDocument();
      expect(bankLogo).toHaveAttribute('src', 'https://example.com/test-bank-logo.png');
    });
  });

  describe('Event Handling', () => {
    test('should call onNavigate when navigation links are clicked', async () => {
      const handleNavigate = jest.fn();
      const user = userEvent.setup();
      
      render(<Footer onNavigate={handleNavigate} />);
      
      const productLink = screen.getByText('Weekend Settlements');
      await user.click(productLink);
      
      expect(handleNavigate).toHaveBeenCalledWith('products');
    });

    test('should call onLinkClick when custom links are clicked', async () => {
      const handleLinkClick = jest.fn();
      const user = userEvent.setup();
      
      const customLink = {
        name: 'Custom Link',
        href: '#custom',
        onClick: handleLinkClick,
      };
      
      render(<Footer productLinks={[customLink]} />);
      
      const link = screen.getByText('Custom Link');
      await user.click(link);
      
      expect(handleLinkClick).toHaveBeenCalled();
    });

    test('should call onBankLogoClick when bank logo is clicked', async () => {
      const handleBankLogoClick = jest.fn();
      const user = userEvent.setup();
      
      const customBank = {
        name: 'Test Bank',
        logo: 'https://example.com/test-bank-logo.png',
        alt: 'Test Bank Logo',
        clickable: true,
        onClick: handleBankLogoClick,
      };
      
      render(<Footer bankLogos={[customBank]} />);
      
      const bankLogo = screen.getByAltText('Test Bank Logo');
      await user.click(bankLogo);
      
      expect(handleBankLogoClick).toHaveBeenCalled();
    });

    test('should handle external link clicks', async () => {
      const user = userEvent.setup();
      
      render(<Footer />);
      
      const externalLink = screen.getByText('API Documentation');
      await user.click(externalLink);
      
      // Should not navigate internally, but stay on page
      expect(externalLink).toBeInTheDocument();
    });

    test('should handle email link clicks', async () => {
      const handleEmailClick = jest.fn();
      const user = userEvent.setup();
      
      // Mock window.open to test email links
      const mockOpen = jest.spyOn(window, 'open').mockImplementation();
      
      render(<Footer onEmailClick={handleEmailClick} />);
      
      const emailLink = screen.getByText('hello@rails.co.za');
      await user.click(emailLink);
      
      expect(handleEmailClick).toHaveBeenCalledWith('hello@rails.co.za');
      
      mockOpen.mockRestore();
    });
  });

  describe('Visual States', () => {
    test('should show/hide sections based on props', () => {
      const { rerender } = render(<Footer />);
      
      expect(screen.getByText('Connected Banks')).toBeInTheDocument();
      expect(screen.getByText(/Important Legal Disclaimer/)).toBeInTheDocument();
      
      rerender(
        <Footer 
          showConnectedBanks={false} 
          showLegalDisclaimer={false} 
        />
      );
      
      expect(screen.queryByText('Connected Banks')).not.toBeInTheDocument();
      expect(screen.queryByText(/Important Legal Disclaimer/)).not.toBeInTheDocument();
    });

    test('should display bank logos with proper styling', () => {
      render(<Footer />);
      
      const bankLogos = screen.getAllByTestId('bank-logo');
      expect(bankLogos.length).toBeGreaterThan(0);
      
      bankLogos.forEach((logo) => {
        expect(logo).toHaveClass('opacity-60');
        expect(logo).toHaveClass('hover:opacity-100');
        expect(logo).toHaveClass('filter');
        expect(logo).toHaveClass('grayscale');
      });
    });

    test('should apply hover effects to links', async () => {
      const user = userEvent.setup();
      
      render(<Footer />);
      
      const productLink = screen.getByText('Weekend Settlements');
      
      await user.hover(productLink);
      
      // Check if hover styles are applied (through CSS classes)
      expect(productLink).toHaveClass('transition-colors');
    });

    test('should display legal disclaimer with proper styling', () => {
      render(<Footer />);
      
      const disclaimer = screen.getByText(/Important Legal Disclaimer/);
      expect(disclaimer).toBeInTheDocument();
      
      const disclaimerContainer = disclaimer.closest('.bg-amber-50');
      expect(disclaimerContainer).toBeInTheDocument();
      expect(disclaimerContainer).toHaveClass('border');
      expect(disclaimerContainer).toHaveClass('border-amber-200');
    });

    test('should handle responsive layout', () => {
      render(<Footer />);
      
      const mainContainer = screen.getByRole('contentinfo');
      expect(mainContainer).toHaveClass('border-t');
      
      // Check for responsive grid classes
      const gridContainer = mainContainer.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('sm:grid-cols-2');
      expect(gridContainer).toHaveClass('lg:grid-cols-6');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<Footer />);
      
      const firstLink = screen.getByText('Weekend Settlements');
      const secondLink = screen.getByText('Bank-as-a-Service');
      
      // Tab to first link
      await user.tab();
      expect(firstLink.closest('button')).toHaveFocus();
      
      // Tab to second link
      await user.tab();
      expect(secondLink.closest('button')).toHaveFocus();
    });

    test('should have proper heading hierarchy', () => {
      render(<Footer />);
      
      const headings = screen.getAllByRole('heading');
      
      // Check that section headings exist
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });

    test('should have proper image alt text', () => {
      render(<Footer />);
      
      const bankLogos = screen.getAllByTestId('bank-logo');
      bankLogos.forEach((logo) => {
        expect(logo).toHaveAttribute('alt');
        expect(logo.getAttribute('alt')).not.toBe('');
      });
    });

    test('should handle screen reader compatibility', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      
      // Check for screen reader friendly text
      expect(screen.getByText(/Rails is not a bank/)).toBeInTheDocument();
      expect(screen.getByText(/All transaction data displayed is mock data/)).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('should work with navigation callback', async () => {
      const mockNavigate = jest.fn();
      const user = userEvent.setup();
      
      render(<Footer onNavigate={mockNavigate} />);
      
      const productLink = screen.getByText('Weekend Settlements');
      await user.click(productLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('products');
    });

    test('should handle image loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Footer />);
      
      const bankLogos = screen.getAllByTestId('bank-logo');
      
      // Simulate image load error
      fireEvent.error(bankLogos[0]);
      
      // Should not throw or crash
      expect(bankLogos[0]).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('should handle missing props gracefully', () => {
      const { rerender } = render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      
      rerender(<Footer onNavigate={undefined} />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty link arrays', () => {
      render(
        <Footer 
          productLinks={[]}
          companyLinks={[]}
          developerLinks={[]}
          supportLinks={[]}
          legalLinks={[]}
        />
      );
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('should handle very long text content', () => {
      const longDescription = 'A'.repeat(1000);
      const longCompanyName = 'B'.repeat(100);
      
      render(
        <Footer 
          companyName={longCompanyName}
          companyDescription={longDescription}
        />
      );
      
      expect(screen.getByText(longCompanyName)).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    test('should handle invalid image URLs', () => {
      const invalidBanks = [
        {
          name: 'Invalid Bank',
          logo: 'invalid-url',
          alt: 'Invalid Bank Logo',
        },
      ];
      
      render(<Footer bankLogos={invalidBanks} />);
      
      const invalidLogo = screen.getByAltText('Invalid Bank Logo');
      expect(invalidLogo).toBeInTheDocument();
      expect(invalidLogo).toHaveAttribute('src', 'invalid-url');
    });

    test('should handle missing callback functions', async () => {
      const user = userEvent.setup();
      
      render(<Footer onNavigate={undefined} />);
      
      const productLink = screen.getByText('Weekend Settlements');
      
      // Should not throw error when callback is undefined
      await user.click(productLink);
      
      expect(productLink).toBeInTheDocument();
    });

    test('should handle special characters in content', () => {
      const specialContent = 'Company™ with special chars: @#$%^&*()';
      
      render(<Footer companyName={specialContent} />);
      
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });
  });
});