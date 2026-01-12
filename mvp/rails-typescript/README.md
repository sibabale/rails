# Rails TypeScript SDK

TypeScript SDK for the Rails Banking Infrastructure API. This SDK is auto-generated using Speakeasy and provides type-safe access to all Rails API endpoints.

## Installation

```bash
npm install @rails/sdk
```

## Quick Start

```typescript
import { RailsSDK } from '@rails/sdk';

// Initialize the SDK with your API key
const sdk = new RailsSDK({
  apiKey: 'your-api-key-here',
  // or use JWT token for authenticated endpoints
  // accessToken: 'your-jwt-token-here'
});

// Create a transaction
const transaction = await sdk.transactions.create({
  txn_ref: 'TXN-001',
  sender_account: 'ACC-123',
  receiver_account: 'ACC-456',
  sender_bank: 'FNB',
  receiver_bank: 'ABSA',
  amount: 1000.00,
  currency: 'ZAR'
});

// Get transactions
const result = await sdk.transactions.list({
  page: 1,
  pageSize: 20
});
```

## Authentication

The SDK supports two authentication methods:

### API Key Authentication
```typescript
const sdk = new RailsSDK({
  apiKey: 'your-api-key'
});
```

### JWT Bearer Token Authentication
```typescript
const sdk = new RailsSDK({
  accessToken: 'your-jwt-token'
});
```

## API Endpoints

### Transactions
- `sdk.transactions.create()` - Create a new transaction
- `sdk.transactions.list()` - List transactions with filters
- `sdk.transactions.get(txnRef)` - Get a single transaction

### Ledger
- `sdk.ledger.getPending()` - Get pending transactions
- `sdk.ledger.settle()` - Settle pending transactions

### Banks
- `sdk.banks.register()` - Register a new bank
- `sdk.banks.login()` - Authenticate and get tokens
- `sdk.banks.refreshToken()` - Refresh access token
- `sdk.banks.logout()` - Logout and invalidate token

### Dashboard
- `sdk.dashboard.getMetrics()` - Get dashboard metrics

### Health
- `sdk.health.check()` - Health check endpoint

## Error Handling

```typescript
try {
  await sdk.transactions.create({ ... });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.details);
  } else if (error instanceof ApiError) {
    console.error('API error:', error.message);
  }
}
```

## Configuration

```typescript
const sdk = new RailsSDK({
  apiKey: 'your-api-key',
  baseURL: 'https://api.rails.com', // Optional: override base URL
  timeout: 30000, // Optional: request timeout in ms
  retries: 3, // Optional: number of retries for failed requests
  debug: false // Optional: enable request/response logging
});
```

## TypeScript Support

Full TypeScript support with complete type definitions for all requests and responses.

## License

UNLICENSED - Private use only
