import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Make jest available globally for compatibility with existing tests
declare global {
  var jest: typeof vi
}

// Assign vi to jest for compatibility
globalThis.jest = vi

// Mock window.matchMedia for JSDOM environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock framer-motion with proper value mocking
const createMotionComponent = (element: string) => {
  return React.forwardRef<any, any>(({ children, ...props }, ref) => {
    // Filter out framer-motion specific props
    const {
      animate,
      initial,
      exit,
      variants,
      transition,
      whileHover,
      whileTap,
      whileFocus,
      whileDrag,
      whileInView,
      drag,
      dragControls,
      dragListener,
      dragConstraints,
      dragElastic,
      dragMomentum,
      dragPropagation,
      dragSnapToOrigin,
      dragTransition,
      onDrag,
      onDragStart,
      onDragEnd,
      onDirectionLock,
      onViewportEnter,
      onViewportLeave,
      onAnimationStart,
      onAnimationComplete,
      onUpdate,
      onTap,
      onTapStart,
      onTapCancel,
      onHoverStart,
      onHoverEnd,
      onFocus,
      onBlur,
      onDragTransitionEnd,
      layoutId,
      layout,
      layoutDependency,
      layoutScroll,
      layoutRoot,
      ...domProps
    } = props;

    return React.createElement(element, { ...domProps, ref }, children);
  });
};

vi.mock('framer-motion', () => ({
  motion: {
    div: createMotionComponent('div'),
    button: createMotionComponent('button'),
    span: createMotionComponent('span'),
    section: createMotionComponent('section'),
    article: createMotionComponent('article'),
    h1: createMotionComponent('h1'),
    h2: createMotionComponent('h2'),
    h3: createMotionComponent('h3'),
    p: createMotionComponent('p'),
  },
  useMotionValue: vi.fn((initial) => ({
    get: vi.fn(() => initial || 0),
    set: vi.fn(),
    destroy: vi.fn(),
    stop: vi.fn(),
    onChange: vi.fn(),
    clearListeners: vi.fn(),
  })),
  useTransform: vi.fn((source, transformer) => {
    // Return a string or number instead of an object to avoid React child error
    if (typeof transformer === 'function') {
      return transformer(source?.get ? source.get() : 0);
    }
    return '0';
  }),
  animate: vi.fn(() => ({
    stop: vi.fn(),
    then: vi.fn(),
  })),
  useInView: vi.fn(() => [React.createRef(), true]),
  useAnimation: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  })),
  AnimatePresence: ({ children }: any) => children,
  Variants: {},
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  Link: ({ children, ...props }: any) => React.createElement('a', props, children),
  BrowserRouter: ({ children }: any) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
  Router: ({ children }: any) => React.createElement('div', { 'data-testid': 'router' }, children),
  Routes: ({ children }: any) => React.createElement('div', { 'data-testid': 'routes' }, children),
  Route: ({ children, element }: any) => React.createElement('div', { 'data-testid': 'route' }, children || element),
  Navigate: ({ to }: any) => React.createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
  useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
  useParams: vi.fn(() => ({})),
  useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
}))

// Mock Redux
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(() => vi.fn()),
  useSelector: vi.fn(),
  Provider: ({ children }: any) => children,
  connect: vi.fn(() => (component: any) => component),
}))

// Mock API
vi.mock('../lib/api', () => ({
  api: {
    getTransactions: vi.fn(),
    registerBank: vi.fn(),
    loginBank: vi.fn(),
  },
}))

// Mock tokenManager
vi.mock('../lib/tokenManager', () => ({
  tokenManager: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
  },
})) 