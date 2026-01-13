# Cmos SDK

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
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.postWebhook({});

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { CmosCore } from "cmos/core.js";
import { postWebhook } from "cmos/funcs/postWebhook.js";

// Use `CmosCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const cmos = new CmosCore();

async function run() {
  const res = await postWebhook(cmos, {});
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

| Error Type              | Status Code             | Content Type            |
| ----------------------- | ----------------------- | ----------------------- |
| errors.ErrorT           | 400                     | application/json        |
| errors.ErrorT           | 500                     | application/json        |
| errors.CmosDefaultError | 4XX, 5XX                | \*/\*                   |

## getLedgerPending

Get pending transactions

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/ledger/pending" method="get" path="/ledger/pending" -->
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.getLedgerPending();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { CmosCore } from "cmos/core.js";
import { getLedgerPending } from "cmos/funcs/getLedgerPending.js";

// Use `CmosCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const cmos = new CmosCore();

async function run() {
  const res = await getLedgerPending(cmos);
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

| Error Type              | Status Code             | Content Type            |
| ----------------------- | ----------------------- | ----------------------- |
| errors.ErrorT           | 500                     | application/json        |
| errors.CmosDefaultError | 4XX, 5XX                | \*/\*                   |

## postLedgerSettle

Settle pending transactions

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/ledger/settle" method="post" path="/ledger/settle" -->
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.postLedgerSettle();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { CmosCore } from "cmos/core.js";
import { postLedgerSettle } from "cmos/funcs/postLedgerSettle.js";

// Use `CmosCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const cmos = new CmosCore();

async function run() {
  const res = await postLedgerSettle(cmos);
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

| Error Type              | Status Code             | Content Type            |
| ----------------------- | ----------------------- | ----------------------- |
| errors.ErrorT           | 400                     | application/json        |
| errors.ErrorT           | 500                     | application/json        |
| errors.CmosDefaultError | 4XX, 5XX                | \*/\*                   |

## getTransactions

Get transactions with filters and summary

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/transactions" method="get" path="/transactions" -->
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.getTransactions();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { CmosCore } from "cmos/core.js";
import { getTransactions } from "cmos/funcs/getTransactions.js";

// Use `CmosCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const cmos = new CmosCore();

async function run() {
  const res = await getTransactions(cmos);
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

| Error Type              | Status Code             | Content Type            |
| ----------------------- | ----------------------- | ----------------------- |
| errors.ErrorT           | 400                     | application/json        |
| errors.ErrorT           | 500                     | application/json        |
| errors.CmosDefaultError | 4XX, 5XX                | \*/\*                   |

## postSimulatorStart

Start transaction simulation

### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/simulator/start" method="post" path="/simulator/start" -->
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.postSimulatorStart({});

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { CmosCore } from "cmos/core.js";
import { postSimulatorStart } from "cmos/funcs/postSimulatorStart.js";

// Use `CmosCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const cmos = new CmosCore();

async function run() {
  const res = await postSimulatorStart(cmos, {});
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

| Error Type              | Status Code             | Content Type            |
| ----------------------- | ----------------------- | ----------------------- |
| errors.ErrorT           | 400                     | application/json        |
| errors.ErrorT           | 500                     | application/json        |
| errors.CmosDefaultError | 4XX, 5XX                | \*/\*                   |

## getDashboardMetrics

Get dashboard metrics

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/dashboard/metrics" method="get" path="/dashboard/metrics" -->
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.getDashboardMetrics();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { CmosCore } from "cmos/core.js";
import { getDashboardMetrics } from "cmos/funcs/getDashboardMetrics.js";

// Use `CmosCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const cmos = new CmosCore();

async function run() {
  const res = await getDashboardMetrics(cmos);
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

| Error Type              | Status Code             | Content Type            |
| ----------------------- | ----------------------- | ----------------------- |
| errors.ErrorT           | 500                     | application/json        |
| errors.CmosDefaultError | 4XX, 5XX                | \*/\*                   |

## getHealth

Health check

### Example Usage

<!-- UsageSnippet language="typescript" operationID="get_/health" method="get" path="/health" -->
```typescript
import { Cmos } from "cmos";

const cmos = new Cmos();

async function run() {
  const result = await cmos.getHealth();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { CmosCore } from "cmos/core.js";
import { getHealth } from "cmos/funcs/getHealth.js";

// Use `CmosCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const cmos = new CmosCore();

async function run() {
  const res = await getHealth(cmos);
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

| Error Type              | Status Code             | Content Type            |
| ----------------------- | ----------------------- | ----------------------- |
| errors.ErrorT           | 500                     | application/json        |
| errors.CmosDefaultError | 4XX, 5XX                | \*/\*                   |