import { describe, expect, it } from "vitest";

import {
  resolveInitialChartMode,
  resolveInitialChartRange,
} from "./portfolio-value-over-time-chart-helpers";

describe("resolveInitialChartMode", () => {
  it("defaults to VALUE when there is no history", () => {
    expect(resolveInitialChartMode([])).toBe("VALUE");
  });

  it("defaults to VALUE when there is a single snapshot point", () => {
    expect(
      resolveInitialChartMode([
        {
          bucketDate: "2026-02-08",
          totalValuePln: 0,
          totalValueUsd: null,
          totalValueEur: null,
          netExternalCashflowPln: 0,
          netExternalCashflowUsd: 0,
          netExternalCashflowEur: 0,
          netImplicitTransferPln: 0,
          netImplicitTransferUsd: 0,
          netImplicitTransferEur: 0,
          isPartialPln: false,
          isPartialUsd: false,
          isPartialEur: false,
        },
      ])
    ).toBe("VALUE");
  });

  it("defaults to PERFORMANCE when there are at least two snapshot points", () => {
    expect(
      resolveInitialChartMode([
        {
          bucketDate: "2026-02-07",
          totalValuePln: 0,
          totalValueUsd: null,
          totalValueEur: null,
          netExternalCashflowPln: 0,
          netExternalCashflowUsd: 0,
          netExternalCashflowEur: 0,
          netImplicitTransferPln: 0,
          netImplicitTransferUsd: 0,
          netImplicitTransferEur: 0,
          isPartialPln: false,
          isPartialUsd: false,
          isPartialEur: false,
        },
        {
          bucketDate: "2026-02-08",
          totalValuePln: 0,
          totalValueUsd: null,
          totalValueEur: null,
          netExternalCashflowPln: 0,
          netExternalCashflowUsd: 0,
          netExternalCashflowEur: 0,
          netImplicitTransferPln: 0,
          netImplicitTransferUsd: 0,
          netImplicitTransferEur: 0,
          isPartialPln: false,
          isPartialUsd: false,
          isPartialEur: false,
        },
      ])
    ).toBe("PERFORMANCE");
  });
});

describe("resolveInitialChartRange", () => {
  it("defaults to ALL when there is no history", () => {
    expect(resolveInitialChartRange([])).toBe("ALL");
  });

  it("defaults to ALL when there is only one snapshot point", () => {
    expect(
      resolveInitialChartRange([
        {
          bucketDate: "2026-02-08",
          totalValuePln: 0,
          totalValueUsd: null,
          totalValueEur: null,
          netExternalCashflowPln: 0,
          netExternalCashflowUsd: 0,
          netExternalCashflowEur: 0,
          netImplicitTransferPln: 0,
          netImplicitTransferUsd: 0,
          netImplicitTransferEur: 0,
          isPartialPln: false,
          isPartialUsd: false,
          isPartialEur: false,
        },
      ])
    ).toBe("ALL");
  });

  it("defaults to YTD when there are at least two snapshot points", () => {
    expect(
      resolveInitialChartRange([
        {
          bucketDate: "2026-02-07",
          totalValuePln: 0,
          totalValueUsd: null,
          totalValueEur: null,
          netExternalCashflowPln: 0,
          netExternalCashflowUsd: 0,
          netExternalCashflowEur: 0,
          netImplicitTransferPln: 0,
          netImplicitTransferUsd: 0,
          netImplicitTransferEur: 0,
          isPartialPln: false,
          isPartialUsd: false,
          isPartialEur: false,
        },
        {
          bucketDate: "2026-02-08",
          totalValuePln: 0,
          totalValueUsd: null,
          totalValueEur: null,
          netExternalCashflowPln: 0,
          netExternalCashflowUsd: 0,
          netExternalCashflowEur: 0,
          netImplicitTransferPln: 0,
          netImplicitTransferUsd: 0,
          netImplicitTransferEur: 0,
          isPartialPln: false,
          isPartialUsd: false,
          isPartialEur: false,
        },
      ])
    ).toBe("YTD");
  });
});
