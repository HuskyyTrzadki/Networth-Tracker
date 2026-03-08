import { describe, expect, it } from "vitest";

import { computeDailyReturns, computePeriodReturn } from "./twr";

describe("computeDailyReturns", () => {
  it("treats a flow-only collapse day as cashflow-adjusted, not as a catastrophic loss", () => {
    const dailyReturns = computeDailyReturns([
      {
        bucketDate: "2025-01-29",
        totalValue: 7502.36,
        externalCashflow: 0,
        implicitTransfer: 0,
        isPartial: false,
      },
      {
        bucketDate: "2025-01-30",
        totalValue: 25.17,
        externalCashflow: -7477.19,
        implicitTransfer: 0,
        isPartial: false,
      },
      {
        bucketDate: "2025-02-03",
        totalValue: 25.17,
        externalCashflow: 0,
        implicitTransfer: 0,
        isPartial: false,
      },
    ]);

    expect(dailyReturns[0]?.value).toBeCloseTo(0, 8);
    expect(dailyReturns[1]?.value).toBeCloseTo(0, 8);
    expect(computePeriodReturn(dailyReturns).value).toBeCloseTo(0, 8);
  });
});
