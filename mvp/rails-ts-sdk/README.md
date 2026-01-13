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

<!-- Start Summary [summary] -->
## Summary

Rails PoC API: OpenAPI 3.0 specification for the Rails PoC API
<!-- End Summary [summary] -->

<!-- Start Table of Contents [toc] -->
## Table of Contents
<!-- $toc-max-depth=2 -->
* [Rails TypeScript SDK](#rails-typescript-sdk)
  * [Installation](#installation)
  * [Quick Start](#quick-start)
  * [API Endpoints](#api-endpoints)
  * [Error Handling](#error-handling)
  * [Configuration](#configuration)
  * [TypeScript Support](#typescript-support)
  * [License](#license)
  * [SDK Installation](#sdk-installation)
  * [Requirements](#requirements)
  * [SDK Example Usage](#sdk-example-usage)
  * [Available Resources and Operations](#available-resources-and-operations)
  * [Standalone functions](#standalone-functions)
  * [Retries](#retries)
  * [Error Handling](#error-handling-1)
  * [Server Selection](#server-selection)
  * [Custom HTTP Client](#custom-http-client)
  * [Debugging](#debugging)

<!-- End Table of Contents [toc] -->

<!-- Start SDK Installation [installation] -->
## SDK Installation

> [!TIP]
> To finish publishing your SDK to npm and others you must [run your first generation action](https://www.speakeasy.com/docs/github-setup#step-by-step-guide).


The SDK can be installed with either [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), [bun](https://bun.sh/) or [yarn](https://classic.yarnpkg.com/en/) package managers.

### NPM

```bash
npm add <UNSET>
```

### PNPM

```bash
pnpm add <UNSET>
```

### Bun

```bash
bun add <UNSET>
```

### Yarn

```bash
yarn add <UNSET>
```

> [!NOTE]
> This package is published with CommonJS and ES Modules (ESM) support.
<!-- End SDK Installation [installation] -->

<!-- Start Requirements [requirements] -->
## Requirements

For supported JavaScript runtimes, please consult [RUNTIMES.md](RUNTIMES.md).
<!-- End Requirements [requirements] -->

<!-- Start SDK Example Usage [usage] -->
## SDK Example Usage

### Example

```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.postWebhook({});

  console.log(result);
}

run();

```
<!-- End SDK Example Usage [usage] -->

<!-- Start Available Resources and Operations [operations] -->
## Available Resources and Operations

<details open>
<summary>Available methods</summary>

### [Cmos SDK](docs/sdks/cmos/README.md)

* [postWebhook](docs/sdks/cmos/README.md#postwebhook) - Receive a transaction webhook
* [getLedgerPending](docs/sdks/cmos/README.md#getledgerpending) - Get pending transactions
* [postLedgerSettle](docs/sdks/cmos/README.md#postledgersettle) - Settle pending transactions
* [getTransactions](docs/sdks/cmos/README.md#gettransactions) - Get transactions with filters and summary
* [postSimulatorStart](docs/sdks/cmos/README.md#postsimulatorstart) - Start transaction simulation
* [getDashboardMetrics](docs/sdks/cmos/README.md#getdashboardmetrics) - Get dashboard metrics
* [getHealth](docs/sdks/cmos/README.md#gethealth) - Health check

</details>
<!-- End Available Resources and Operations [operations] -->

<!-- Start Standalone functions [standalone-funcs] -->
## Standalone functions

All the methods listed above are available as standalone functions. These
functions are ideal for use in applications running in the browser, serverless
runtimes or other environments where application bundle size is a primary
concern. When using a bundler to build your application, all unused
functionality will be either excluded from the final bundle or tree-shaken away.

To read more about standalone functions, check [FUNCTIONS.md](FUNCTIONS.md).

<details>

<summary>Available standalone functions</summary>

- [`getDashboardMetrics`](docs/sdks/cmos/README.md#getdashboardmetrics) - Get dashboard metrics
- [`getHealth`](docs/sdks/cmos/README.md#gethealth) - Health check
- [`getLedgerPending`](docs/sdks/cmos/README.md#getledgerpending) - Get pending transactions
- [`getTransactions`](docs/sdks/cmos/README.md#gettransactions) - Get transactions with filters and summary
- [`postLedgerSettle`](docs/sdks/cmos/README.md#postledgersettle) - Settle pending transactions
- [`postSimulatorStart`](docs/sdks/cmos/README.md#postsimulatorstart) - Start transaction simulation
- [`postWebhook`](docs/sdks/cmos/README.md#postwebhook) - Receive a transaction webhook

</details>
<!-- End Standalone functions [standalone-funcs] -->

<!-- Start Retries [retries] -->
## Retries

Some of the endpoints in this SDK support retries.  If you use the SDK without any configuration, it will fall back to the default retry strategy provided by the API.  However, the default retry strategy can be overridden on a per-operation basis, or across the entire SDK.

To change the default retry strategy for a single API call, simply provide a retryConfig object to the call:
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.postWebhook({}, {
    retries: {
      strategy: "backoff",
      backoff: {
        initialInterval: 1,
        maxInterval: 50,
        exponent: 1.1,
        maxElapsedTime: 100,
      },
      retryConnectionErrors: false,
    },
  });

  console.log(result);
}

run();

```

If you'd like to override the default retry strategy for all operations that support retries, you can provide a retryConfig at SDK initialization:
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos({
  retryConfig: {
    strategy: "backoff",
    backoff: {
      initialInterval: 1,
      maxInterval: 50,
      exponent: 1.1,
      maxElapsedTime: 100,
    },
    retryConnectionErrors: false,
  },
});

async function run() {
  const result = await cmos.postWebhook({});

  console.log(result);
}

run();

```
<!-- End Retries [retries] -->

<!-- Start Error Handling [errors] -->
## Error Handling

[`CmosError`](src/models/errors/cmoserror.ts) is the base class for all HTTP error responses. It has the following properties:

| Property            | Type       | Description                                                                             |
| ------------------- | ---------- | --------------------------------------------------------------------------------------- |
| `error.message`     | `string`   | Error message                                                                           |
| `error.statusCode`  | `number`   | HTTP response status code eg `404`                                                      |
| `error.headers`     | `Headers`  | HTTP response headers                                                                   |
| `error.body`        | `string`   | HTTP body. Can be empty string if no body is returned.                                  |
| `error.rawResponse` | `Response` | Raw HTTP response                                                                       |
| `error.data$`       |            | Optional. Some errors may contain structured data. [See Error Classes](#error-classes). |

### Example
```typescript
import { Cmos } from "cmos";
import * as errors from "cmos/models/errors";

const cmos = new Cmos();

async function run() {
  try {
    const result = await cmos.postWebhook({});

    console.log(result);
  } catch (error) {
    // The base class for HTTP error responses
    if (error instanceof errors.CmosError) {
      console.log(error.message);
      console.log(error.statusCode);
      console.log(error.body);
      console.log(error.headers);

      // Depending on the method different errors may be thrown
      if (error instanceof errors.ErrorT) {
        console.log(error.data$.error); // string
        console.log(error.data$.message); // string
      }
    }
  }
}

run();

```

### Error Classes
**Primary errors:**
* [`CmosError`](src/models/errors/cmoserror.ts): The base class for HTTP error responses.
  * [`ErrorT`](./src/models/errors/errort.ts): Generic error.

<details><summary>Less common errors (6)</summary>

<br />

**Network errors:**
* [`ConnectionError`](src/models/errors/httpclienterrors.ts): HTTP client was unable to make a request to a server.
* [`RequestTimeoutError`](src/models/errors/httpclienterrors.ts): HTTP request timed out due to an AbortSignal signal.
* [`RequestAbortedError`](src/models/errors/httpclienterrors.ts): HTTP request was aborted by the client.
* [`InvalidRequestError`](src/models/errors/httpclienterrors.ts): Any input used to create a request is invalid.
* [`UnexpectedClientError`](src/models/errors/httpclienterrors.ts): Unrecognised or unexpected error.


**Inherit from [`CmosError`](src/models/errors/cmoserror.ts)**:
* [`ResponseValidationError`](src/models/errors/responsevalidationerror.ts): Type mismatch between the data returned from the server and the structure expected by the SDK. See `error.rawValue` for the raw value and `error.pretty()` for a nicely formatted multi-line string.

</details>
<!-- End Error Handling [errors] -->

<!-- Start Server Selection [server] -->
## Server Selection

### Override Server URL Per-Client

The default server can be overridden globally by passing a URL to the `serverURL: string` optional parameter when initializing the SDK client instance. For example:
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos({
  serverURL: "http://localhost:8000/api",
});

async function run() {
  const result = await cmos.postWebhook({});

  console.log(result);
}

run();

```
<!-- End Server Selection [server] -->

<!-- Start Custom HTTP Client [http-client] -->
## Custom HTTP Client

The TypeScript SDK makes API calls using an `HTTPClient` that wraps the native
[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). This
client is a thin wrapper around `fetch` and provides the ability to attach hooks
around the request lifecycle that can be used to modify the request or handle
errors and response.

The `HTTPClient` constructor takes an optional `fetcher` argument that can be
used to integrate a third-party HTTP client or when writing tests to mock out
the HTTP client and feed in fixtures.

The following example shows how to use the `"beforeRequest"` hook to to add a
custom header and a timeout to requests and how to use the `"requestError"` hook
to log errors:

```typescript
import { Cmos } from "cmos";
import { HTTPClient } from "cmos/lib/http";

const httpClient = new HTTPClient({
  // fetcher takes a function that has the same signature as native `fetch`.
  fetcher: (request) => {
    return fetch(request);
  }
});

httpClient.addHook("beforeRequest", (request) => {
  const nextRequest = new Request(request, {
    signal: request.signal || AbortSignal.timeout(5000)
  });

  nextRequest.headers.set("x-custom-header", "custom value");

  return nextRequest;
});

httpClient.addHook("requestError", (error, request) => {
  console.group("Request Error");
  console.log("Reason:", `${error}`);
  console.log("Endpoint:", `${request.method} ${request.url}`);
  console.groupEnd();
});

const sdk = new Cmos({ httpClient: httpClient });
```
<!-- End Custom HTTP Client [http-client] -->

<!-- Start Debugging [debug] -->
## Debugging

You can setup your SDK to emit debug logs for SDK requests and responses.

You can pass a logger that matches `console`'s interface as an SDK option.

> [!WARNING]
> Beware that debug logging will reveal secrets, like API tokens in headers, in log messages printed to a console or files. It's recommended to use this feature only during local development and not in production.

```typescript
import { Cmos } from "cmos";

const sdk = new Cmos({ debugLogger: console });
```

You can also enable a default debug logger by setting an environment variable `CMOS_DEBUG` to true.
<!-- End Debugging [debug] -->

<!-- Placeholder for Future Speakeasy SDK Sections -->
