// Test setup file
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
process.env.SIM_WEBHOOK_ENDPOINT = 'http://localhost:8000/api/webhook';
process.env.ADMIN_TOKEN = 'test-admin-token-123456789012345678901234';
process.env.JWT_SECRET = 'test-jwt-secret-123456789012345678901234';

// Mock PostHog globally for tests
jest.mock('../src/posthog/posthog', () => ({
  posthogClient: {
    capture: jest.fn(),
    shutdown: jest.fn().mockResolvedValue()
  }
}));

// Suppress console logs during tests unless needed
if (!process.env.DEBUG_TESTS) {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}