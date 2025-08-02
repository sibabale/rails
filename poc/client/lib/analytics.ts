import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_KEY = 'phc_IUHpcAFiCLEWS1ccbpZuGbiTUaKOonvcXyI0VwfrIlk';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

// Check if analytics is enabled
const isAnalyticsEnabled = () => {
  // Use Vite's import.meta.env for environment variables
  const enabledInEnv = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  const isDev = import.meta.env.DEV;
  return enabledInEnv || isDev; // Enable in development for testing
};

// Initialize PostHog
export const initializeAnalytics = () => {
  if (isAnalyticsEnabled() && typeof window !== 'undefined') {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll handle this manually for better control
      capture_pageleave: true,
      cross_subdomain_cookie: false,
      persistence: 'localStorage',
      autocapture: false, // Disable automatic event capture for cleaner data
    });
  }
};

// Analytics event types for our A/B testing
export interface AnalyticsEvent {
  // Page tracking
  page_view: {
    page: string;
    title: string;
    url: string;
  };
  
  // A/B Testing events
  ab_test_assigned: {
    test_name: string;
    variant: string;
    tier?: string;
  };
  
  ab_test_conversion: {
    test_name: string;
    variant: string;
    conversion_event: string;
    tier?: string;
  };
  
  // Tier selection journey
  tier_selected: {
    tier: 'partnership' | 'developer';
    previous_page: string;
    time_on_page?: number;
  };
  
  // Registration funnel
  registration_started: {
    tier: 'partnership' | 'developer';
    variant?: string;
  };
  
  registration_step_completed: {
    step: number;
    tier: 'partnership' | 'developer';
    time_spent: number;
    variant?: string;
  };
  
  registration_submitted: {
    tier: 'partnership' | 'developer';
    variant?: string;
    time_to_complete: number;
  };
  
  registration_success: {
    tier: 'partnership' | 'developer';
    variant?: string;
    bank_id?: string;
  };
  
  registration_error: {
    tier: 'partnership' | 'developer';
    variant?: string;
    error_type: string;
    step?: number;
  };
}

// Type-safe event tracking
export const trackEvent = <T extends keyof AnalyticsEvent>(
  eventName: T,
  properties: AnalyticsEvent[T]
) => {
  if (!isAnalyticsEnabled()) return;
  
  const eventProperties = {
    ...properties,
    timestamp: Date.now(),
    url: window.location.href,
    user_agent: navigator.userAgent,
  };
  
  posthog.capture(eventName, eventProperties);
};

// Page view tracking
export const trackPageView = (page: string, title?: string) => {
  if (!isAnalyticsEnabled()) return;
  
  trackEvent('page_view', {
    page,
    title: title || document.title,
    url: window.location.href,
  });
  
  // Also send to PostHog's built-in pageview
  posthog.capture('$pageview');
};

// A/B Testing helpers
export const getFeatureFlag = (flagName: string): string | boolean => {
  if (!isAnalyticsEnabled()) return false;
  return posthog.getFeatureFlag(flagName) || false;
};

export const isFeatureEnabled = (flagName: string): boolean => {
  if (!isAnalyticsEnabled()) return false;
  return posthog.isFeatureEnabled(flagName) || false;
};

// Track A/B test assignment
export const trackABTestAssignment = (testName: string, variant: string, tier?: string) => {
  trackEvent('ab_test_assigned', {
    test_name: testName,
    variant,
    tier,
  });
};

// Track A/B test conversion
export const trackABTestConversion = (
  testName: string, 
  variant: string, 
  conversionEvent: string,
  tier?: string
) => {
  trackEvent('ab_test_conversion', {
    test_name: testName,
    variant,
    conversion_event: conversionEvent,
    tier,
  });
};

// User identification for registration flow
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isAnalyticsEnabled()) return;
  
  posthog.identify(userId, properties);
};

// Reset user (for testing)
export const resetUser = () => {
  if (!isAnalyticsEnabled()) return;
  
  posthog.reset();
};

// Export PostHog instance for advanced usage
export { posthog };

// Registration funnel helpers
export const trackRegistrationFunnel = {
  started: (tier: 'partnership' | 'developer', variant?: string) => {
    trackEvent('registration_started', { tier, variant });
  },
  
  stepCompleted: (step: number, tier: 'partnership' | 'developer', timeSpent: number, variant?: string) => {
    trackEvent('registration_step_completed', { step, tier, time_spent: timeSpent, variant });
  },
  
  submitted: (tier: 'partnership' | 'developer', timeToComplete: number, variant?: string) => {
    trackEvent('registration_submitted', { tier, variant, time_to_complete: timeToComplete });
  },
  
  success: (tier: 'partnership' | 'developer', variant?: string, bankId?: string) => {
    trackEvent('registration_success', { tier, variant, bank_id: bankId });
  },
  
  error: (tier: 'partnership' | 'developer', errorType: string, variant?: string, step?: number) => {
    trackEvent('registration_error', { tier, variant, error_type: errorType, step });
  },
};

export default {
  init: initializeAnalytics,
  track: trackEvent,
  pageView: trackPageView,
  getFeatureFlag,
  isFeatureEnabled,
  trackABTestAssignment,
  trackABTestConversion,
  identify: identifyUser,
  reset: resetUser,
  registration: trackRegistrationFunnel,
};