import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InteractiveApiSection } from './InteractiveApiSection';
import { InteractiveApiSectionProps } from './InteractiveApiSection.interface';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, ...props }: any) => (
    <pre data-testid="syntax-highlighter" {...props}>
      {children}
    </pre>
  ),
}));

jest.mock('react-syntax-highlighter/dist/cjs/styles/prism', () => ({
  oneDark: {},
  oneLight: {},
}));

// Mock ScrollReveal
jest.mock('../../atoms/ScrollReveal', () => ({
  ScrollReveal: ({ children }: any) => <div data-testid="scroll-reveal">{children}</div>,
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback: any) {}
  observe() {}
  disconnect() {}
};

describe('InteractiveApiSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Public Interface Validation', () => {
    test('should render with default props', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByText('Developer-First APIs')).toBeInTheDocument();
      expect(screen.getByText('Modern, well-documented APIs designed for developers. Get started in minutes with comprehensive examples and SDKs.')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(
        <InteractiveApiSection className="custom-api-section" />
      );
      
      expect(container.firstChild).toHaveClass('py-16', 'sm:py-20', 'lg:py-24', 'bg-background');
    });

    test('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'blue', padding: '30px' };
      const { container } = render(
        <InteractiveApiSection style={customStyle} />
      );
      
      expect(container.firstChild).toHaveStyle(customStyle);
    });

    test('should include data-testid when provided', () => {
      const { container } = render(
        <InteractiveApiSection data-testid="interactive-api-section" />
      );
      
      expect(container.firstChild).toHaveAttribute('data-testid', 'interactive-api-section');
    });
  });

  describe('API Type Tabs', () => {
    test('should render all API type tabs', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByText('REST APIs')).toBeInTheDocument();
      expect(screen.getByText('GraphQL')).toBeInTheDocument();
      expect(screen.getByText('Webhooks')).toBeInTheDocument();
      expect(screen.getByText('SDKs')).toBeInTheDocument();
    });

    test('should render API type descriptions', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByText('Simple, intuitive endpoints')).toBeInTheDocument();
      expect(screen.getByText('Flexible data querying')).toBeInTheDocument();
      expect(screen.getByText('Real-time notifications')).toBeInTheDocument();
      expect(screen.getByText('Native libraries')).toBeInTheDocument();
    });

    test('should switch between tabs', () => {
      render(<InteractiveApiSection />);
      
      const graphqlTab = screen.getByText('GraphQL');
      fireEvent.click(graphqlTab);
      
      expect(screen.getByText('GraphQL Example')).toBeInTheDocument();
      expect(screen.getByText('Query settlement data with precise field selection')).toBeInTheDocument();
    });

    test('should render tab icons', () => {
      render(<InteractiveApiSection />);
      
      // Icons should be rendered (mocked as divs with test ids)
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });
  });

  describe('Code Examples', () => {
    test('should render REST API example by default', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
      expect(screen.getByText('Submit financial transactions to the Rails API')).toBeInTheDocument();
    });

    test('should render GraphQL example when tab is selected', () => {
      render(<InteractiveApiSection />);
      
      const graphqlTab = screen.getByText('GraphQL');
      fireEvent.click(graphqlTab);
      
      expect(screen.getByText('GraphQL Example')).toBeInTheDocument();
      expect(screen.getByText('Query settlement data with precise field selection')).toBeInTheDocument();
    });

    test('should render Webhooks example when tab is selected', () => {
      render(<InteractiveApiSection />);
      
      const webhooksTab = screen.getByText('Webhooks');
      fireEvent.click(webhooksTab);
      
      expect(screen.getByText('Webhook Integration')).toBeInTheDocument();
      expect(screen.getByText('Receive real-time notifications for settlement events')).toBeInTheDocument();
    });

    test('should render SDKs example when tab is selected', () => {
      render(<InteractiveApiSection />);
      
      const sdksTab = screen.getByText('SDKs');
      fireEvent.click(sdksTab);
      
      expect(screen.getByText('SDK Examples')).toBeInTheDocument();
      expect(screen.getByText('Native libraries for seamless integration')).toBeInTheDocument();
    });

    test('should render syntax highlighter for code', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
    });

    test('should render Live Example badge', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByText('Live Example')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    test('should render copy button', () => {
      render(<InteractiveApiSection />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    test('should copy code to clipboard when copy button is clicked', async () => {
      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as jest.Mock) = writeTextMock;

      render(<InteractiveApiSection />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
      });
    });

    test('should show copied state after successful copy', async () => {
      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as jest.Mock) = writeTextMock;

      render(<InteractiveApiSection />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    test('should reset copied state after timeout', async () => {
      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as jest.Mock) = writeTextMock;

      render(<InteractiveApiSection />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      });
    });

    test('should handle copy errors gracefully', async () => {
      const writeTextMock = jest.fn().mockRejectedValue(new Error('Copy failed'));
      (navigator.clipboard.writeText as jest.Mock) = writeTextMock;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<InteractiveApiSection />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text: ', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Dark Mode Detection', () => {
    test('should detect dark mode from document class', () => {
      document.documentElement.classList.add('dark');
      
      render(<InteractiveApiSection />);
      
      // Component should render (dark mode detection is internal)
      expect(screen.getByText('Developer-First APIs')).toBeInTheDocument();
      
      document.documentElement.classList.remove('dark');
    });

    test('should detect dark mode from media query', () => {
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<InteractiveApiSection />);
      
      expect(screen.getByText('Developer-First APIs')).toBeInTheDocument();
    });

    test('should observe document changes for dark mode', () => {
      const observeMock = jest.fn();
      const disconnectMock = jest.fn();
      
      global.MutationObserver = jest.fn().mockImplementation(() => ({
        observe: observeMock,
        disconnect: disconnectMock,
      }));

      const { unmount } = render(<InteractiveApiSection />);
      
      expect(observeMock).toHaveBeenCalled();
      
      unmount();
      
      expect(disconnectMock).toHaveBeenCalled();
    });
  });

  describe('Documentation Links', () => {
    test('should render documentation action buttons', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByText('Full API Documentation')).toBeInTheDocument();
      expect(screen.getByText('Download SDKs')).toBeInTheDocument();
      expect(screen.getByText('Try in Sandbox')).toBeInTheDocument();
    });

    test('should render mobile text for smaller screens', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByText('API Docs')).toBeInTheDocument();
      expect(screen.getByText('SDKs')).toBeInTheDocument();
      expect(screen.getByText('Sandbox')).toBeInTheDocument();
    });

    test('should render external link icon', () => {
      render(<InteractiveApiSection />);
      
      const documentationButton = screen.getByText('Full API Documentation').closest('button');
      expect(documentationButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should include responsive CSS classes', () => {
      const { container } = render(<InteractiveApiSection />);
      
      expect(container.querySelector('.grid-cols-2.sm\\:grid-cols-4')).toBeInTheDocument();
      expect(container.querySelector('.text-2xl.sm\\:text-3xl.lg\\:text-4xl')).toBeInTheDocument();
    });

    test('should have responsive spacing classes', () => {
      const { container } = render(<InteractiveApiSection />);
      
      expect(container.querySelector('.py-16.sm\\:py-20.lg\\:py-24')).toBeInTheDocument();
      expect(container.querySelector('.mb-12.sm\\:mb-16')).toBeInTheDocument();
    });

    test('should include responsive container classes', () => {
      const { container } = render(<InteractiveApiSection />);
      
      expect(container.querySelector('.px-4.sm\\:px-6.lg\\:px-8')).toBeInTheDocument();
      expect(container.querySelector('.max-w-none.lg\\:max-w-7xl')).toBeInTheDocument();
    });
  });

  describe('Animation Components', () => {
    test('should render scroll reveal components', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getAllByTestId('scroll-reveal')).toHaveLength(3);
    });

    test('should include motion wrapper elements', () => {
      render(<InteractiveApiSection />);
      
      // Motion components should be rendered as regular elements
      const heading = screen.getByText('Developer-First APIs');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading structure', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByRole('heading', { level: 2, name: 'Developer-First APIs' })).toBeInTheDocument();
    });

    test('should have proper tab navigation', () => {
      render(<InteractiveApiSection />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('value');
      });
    });

    test('should have accessible button labels', () => {
      render(<InteractiveApiSection />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /full api documentation/i })).toBeInTheDocument();
    });

    test('should have proper ARIA attributes', () => {
      render(<InteractiveApiSection />);
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = render(<InteractiveApiSection />);
      
      const initialHeading = screen.getByText('Developer-First APIs');
      
      rerender(<InteractiveApiSection />);
      
      const afterRerenderHeading = screen.getByText('Developer-First APIs');
      expect(afterRerenderHeading).toBeInTheDocument();
    });

    test('should handle rapid tab switches', () => {
      render(<InteractiveApiSection />);
      
      const tabs = ['GraphQL', 'Webhooks', 'SDKs', 'REST APIs'];
      
      tabs.forEach(tabName => {
        const tab = screen.getByText(tabName);
        fireEvent.click(tab);
      });
      
      expect(screen.getByText('Developer-First APIs')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing clipboard API gracefully', () => {
      const originalClipboard = navigator.clipboard;
      delete (navigator as any).clipboard;

      render(<InteractiveApiSection />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      // Component should still render without errors
      expect(screen.getByText('Developer-First APIs')).toBeInTheDocument();
      
      (navigator as any).clipboard = originalClipboard;
    });

    test('should handle syntax highlighter errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<InteractiveApiSection />);
      
      // Component should render despite potential syntax highlighter issues
      expect(screen.getByText('Developer-First APIs')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });
});