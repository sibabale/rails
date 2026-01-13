# GetDashboardMetricsResponse

Dashboard metrics

## Example Usage

```typescript
import { GetDashboardMetricsResponse } from "rails/models/operations";

let value: GetDashboardMetricsResponse = {};
```

## Fields

| Field                                                                                        | Type                                                                                         | Required                                                                                     | Description                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `activeBanks`                                                                                | *number*                                                                                     | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `totalRevenue`                                                                               | *number*                                                                                     | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `completionRate`                                                                             | *number*                                                                                     | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `revenueOverview`                                                                            | *number*[]                                                                                   | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `transactionLogs`                                                                            | [operations.TransactionLog](transactionlog.md)[]                     | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `activeBanksList`                                                                            | [operations.ActiveBanksList](activebankslist.md)[]                   | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `bankDistributions`                                                                          | [operations.BankDistribution](bankdistribution.md)[]                 | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `activeTransactions`                                                                         | [models.Transaction](../transaction.md)[]                                          | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `settlementOverview`                                                                         | [operations.SettlementOverview](settlementoverview.md)               | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `mondayClearingPreparation`                                                                  | [operations.MondayClearingPreparation](mondayclearingpreparation.md) | :heavy_minus_sign:                                                                           | N/A                                                                                          |