# Rails SDK

## Overview

Rails PoC API: OpenAPI 3.0 specification for the Rails PoC API

### Available Operations

* [postWebhook](#postwebhook) - Receive a transaction webhook
* [getLedgerPending](#getledgerpending) - Get pending transactions
* [postLedgerSettle](#postledgersettle) - Settle pending transactions
* [getTransactions](#gettransactions) - Get transactions with filters and summary
* [postSimulatorStart](#postsimulatorstart) - Start transaction simulation
* [getDashboardMetrics](#getdashboardmetrics) - Get dashboard metrics
* [getHealth](#gethealth) - Health check

## postWebhook

Receive a transaction webhook

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/webhook" method="post" path="/webhook" -->
```typescript
import { Rails } from "rails";

const rails = new Rails();

async function run() {
  const result = await rails.postWebhook({});

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { RailsCore } from "rails/core.js";
import { postWebhook } from "rails/funcs/postWebhook.js";

// Use `RailsCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const rails = new RailsCore();

async function run() {
  const res = await postWebhook(rails, {});
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("postWebhook failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [models.Transaction](../../models/transaction.md)                                                                                                                              | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.PostWebhookResponse](../../models/operations/postwebhookresponse.md)\>**

### Errors

| Error Type               | Status Code              | Content Type             |
| ------------------------ | ------------------------ | ------------------------ |
| errors.ErrorT            | 400                      | application/json         |
| errors.ErrorT            | 500                      | application/json         |
| errors.RailsDefaultError | 4XX, 5XX                 | \*/\*                    |

## getLedgerPending

Get pending transactions

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/ledger/pending" method="get" path="/ledger/pending" -->
```typescript
import { Rails } from "rails";

const rails = new Rails();

async function run() {
  const result = await rails.getLedgerPending();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { RailsCore } from "rails/core.js";
import { getLedgerPending } from "rails/funcs/getLedgerPending.js";

// Use `RailsCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const rails = new RailsCore();

async function run() {
  const res = await getLedgerPending(rails);
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("getLedgerPending failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.GetLedgerPendingResponse](../../models/operations/getledgerpendingresponse.md)\>**

### Errors

| Error Type               | Status Code              | Content Type             |
| ------------------------ | ------------------------ | ------------------------ |
| errors.ErrorT            | 500                      | application/json         |
| errors.RailsDefaultError | 4XX, 5XX                 | \*/\*                    |

## postLedgerSettle

Settle pending transactions

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/ledger/settle" method="post" path="/ledger/settle" -->
```typescript
import { Rails } from "rails";

const rails = new Rails();

async function run() {
  const result = await rails.postLedgerSettle();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { RailsCore } from "rails/core.js";
import { postLedgerSettle } from "rails/funcs/postLedgerSettle.js";

// Use `RailsCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const rails = new RailsCore();

async function run() {
  const res = await postLedgerSettle(rails);
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("postLedgerSettle failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.PostLedgerSettleResponse](../../models/operations/postledgersettleresponse.md)\>**

### Errors

| Error Type               | Status Code              | Content Type             |
| ------------------------ | ------------------------ | ------------------------ |
| errors.ErrorT            | 400                      | application/json         |
| errors.ErrorT            | 500                      | application/json         |
| errors.RailsDefaultError | 4XX, 5XX                 | \*/\*                    |

## getTransactions

Get transactions with filters and summary

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/transactions" method="get" path="/transactions" -->
```typescript
import { Rails } from "rails";

const rails = new Rails();

async function run() {
  const result = await rails.getTransactions();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { RailsCore } from "rails/core.js";
import { getTransactions } from "rails/funcs/getTransactions.js";

// Use `RailsCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const rails = new RailsCore();

async function run() {
  const res = await getTransactions(rails);
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("getTransactions failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GetTransactionsRequest](../../models/operations/gettransactionsrequest.md)                                                                                         | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.GetTransactionsResponse](../../models/operations/gettransactionsresponse.md)\>**

### Errors

| Error Type               | Status Code              | Content Type             |
| ------------------------ | ------------------------ | ------------------------ |
| errors.ErrorT            | 400                      | application/json         |
| errors.ErrorT            | 500                      | application/json         |
| errors.RailsDefaultError | 4XX, 5XX                 | \*/\*                    |

## postSimulatorStart

Start transaction simulation

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/simulator/start" method="post" path="/simulator/start" -->
```typescript
import { Rails } from "rails";

const rails = new Rails();

async function run() {
  const result = await rails.postSimulatorStart({});

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { RailsCore } from "rails/core.js";
import { postSimulatorStart } from "rails/funcs/postSimulatorStart.js";

// Use `RailsCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const rails = new RailsCore();

async function run() {
  const res = await postSimulatorStart(rails, {});
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("postSimulatorStart failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PostSimulatorStartRequest](../../models/operations/postsimulatorstartrequest.md)                                                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.PostSimulatorStartResponse](../../models/operations/postsimulatorstartresponse.md)\>**

### Errors

| Error Type               | Status Code              | Content Type             |
| ------------------------ | ------------------------ | ------------------------ |
| errors.ErrorT            | 400                      | application/json         |
| errors.ErrorT            | 500                      | application/json         |
| errors.RailsDefaultError | 4XX, 5XX                 | \*/\*                    |

## getDashboardMetrics

Get dashboard metrics

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/dashboard/metrics" method="get" path="/dashboard/metrics" -->
```typescript
import { Rails } from "rails";

const rails = new Rails();

async function run() {
  const result = await rails.getDashboardMetrics();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { RailsCore } from "rails/core.js";
import { getDashboardMetrics } from "rails/funcs/getDashboardMetrics.js";

// Use `RailsCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const rails = new RailsCore();

async function run() {
  const res = await getDashboardMetrics(rails);
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("getDashboardMetrics failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.GetDashboardMetricsResponse](../../models/operations/getdashboardmetricsresponse.md)\>**

### Errors

| Error Type               | Status Code              | Content Type             |
| ------------------------ | ------------------------ | ------------------------ |
| errors.ErrorT            | 500                      | application/json         |
| errors.RailsDefaultError | 4XX, 5XX                 | \*/\*                    |

## getHealth

Health check

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/health" method="get" path="/health" -->
```typescript
import { Rails } from "rails";

const rails = new Rails();

async function run() {
  const result = await rails.getHealth();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { RailsCore } from "rails/core.js";
import { getHealth } from "rails/funcs/getHealth.js";

// Use `RailsCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const rails = new RailsCore();

async function run() {
  const res = await getHealth(rails);
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("getHealth failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.GetHealthResponse](../../models/operations/gethealthresponse.md)\>**

### Errors

| Error Type               | Status Code              | Content Type             |
| ------------------------ | ------------------------ | ------------------------ |
| errors.ErrorT            | 500                      | application/json         |
| errors.RailsDefaultError | 4XX, 5XX                 | \*/\*                    |