import { ReactNode } from 'react';

// Core Props Interface
export interface InteractiveApiSectionProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

// API Type Configuration
export interface ApiType {
  id: string;
  name: string;
  icon: ReactNode;
  description: string;
  color: string;
}

// Code Example Structure
export interface CodeExample {
  title: string;
  description: string;
  language: string;
  code: string;
}

// State Management Interface
export interface InteractiveApiSectionState {
  copiedCode: string | null;
  isDarkMode: boolean;
  activeTab: string;
}

// Event Handlers
export interface InteractiveApiSectionEvents {
  onTabChange?: (tabId: string) => void;
  onCodeCopy?: (code: string, exampleId: string) => void;
  onDocumentationClick?: () => void;
  onSdkDownloadClick?: () => void;
  onSandboxClick?: () => void;
}

// Copy Functionality
export interface CopyToClipboardFunction {
  (text: string, id: string): Promise<void>;
}

// Dark Mode Detection
export interface DarkModeDetection {
  checkDarkMode: () => boolean;
  observeChanges: (callback: (isDark: boolean) => void) => () => void;
}

// Code Examples Collection
export interface CodeExamplesCollection {
  rest: CodeExample;
  graphql: CodeExample;
  webhooks: CodeExample;
  sdks: CodeExample;
}

// API Types Collection
export interface ApiTypesCollection {
  rest: ApiType;
  graphql: ApiType;
  webhooks: ApiType;
  sdks: ApiType;
}

// Syntax Highlighter Props
export interface SyntaxHighlighterConfig {
  language: string;
  style: any;
  customStyle: Record<string, any>;
  wrapLines: boolean;
  wrapLongLines: boolean;
  showLineNumbers: boolean;
  className: string;
  codeTagProps: {
    style: Record<string, any>;
  };
}

// Button Configuration
export interface ActionButton {
  text: string;
  mobileText?: string;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: ReactNode;
  onClick?: () => void;
}

// Responsive Styling
export interface ResponsiveStyles {
  fontSize: string;
  padding: string;
  gap: string;
  margin: string;
  minHeight: string;
  maxHeight: string;
}

// Animation Variants
export interface AnimationVariants {
  initial: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
  };
  animate: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
  };
  exit?: {
    opacity: number;
    y?: number;
    x?: number;
  };
  transition?: {
    duration?: number;
    delay?: number;
    type?: string;
    stiffness?: number;
    damping?: number;
  };
}

// Tab Content Props
export interface TabContentProps {
  value: string;
  example: CodeExample;
  copiedCode: string | null;
  isDarkMode: boolean;
  onCopyCode: CopyToClipboardFunction;
}

// Tab Trigger Props
export interface TabTriggerProps {
  type: ApiType;
  isActive: boolean;
  onClick: () => void;
}

// Documentation Links Props
export interface DocumentationLinksProps {
  buttons: ActionButton[];
  className?: string;
  style?: React.CSSProperties;
}

// Utility Types
export type InteractiveApiSectionComponent = React.FC<InteractiveApiSectionProps>;
export type ApiTypeId = 'rest' | 'graphql' | 'webhooks' | 'sdks';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type CopyStatus = 'idle' | 'copying' | 'copied' | 'error';