import { describe, expect, it } from "vitest";

import type { SnapshotChartRow } from "../../server/snapshots/types";
import { emptyDashboardBenchmarkSeries } from "./benchmark-config";
import { buildPortfolioValueOverTimeViewModel } from "./portfolio-value-over-time-view-model";

const row = (overrides: Partial<SnapshotChartRow>): SnapshotChartRow => ({
  bucketDate: "2026-02-09",
  totalValuePln: 1000,
  totalValueUsd: 250,
  totalValueEur: 220,
  netExternalCashflowPln: 0,
  netExternalCashflowUsd: 0,
  netExternalCashflowEur: 0,
  netImplicitTransferPln: 0,
  netImplicitTransferUsd: 0,
  netImplicitTransferEur: 0,
  isPartialPln: false,
  isPartialUsd: false,
  isPartialEur: false,
  ...overrides,
});

describe("buildPortfolioValueOverTimeViewModel", () => {
  it("keeps selected-period change empty when range has only one valued point", () => {
    const result = buildPortfolioValueOverTimeViewModel({
      rowsWithLiveAnchor: [row({ bucketDate: "2026-02-09", totalValuePln: 11500 })],
      range: "ALL",
      mode: "VALUE",
      currency: "PLN",
      todayBucketDate: "2026-02-09",
      liveTotals: {
        totalValue: 11500,
        isPartial: false,
        missingQuotes: 0,
        missingFx: 0,
        asOf: "2026-02-09T20:00:00.000Z",
      },
      canUseLiveEndpoint: false,
      polishCpiSeries: [],
      benchmarkSeriesState: emptyDashboardBenchmarkSeries(),
      selectedComparisons: [],
    });

    expect(result.selectedPeriodAbsoluteChange).toBeNull();
    expect(result.selectedPeriodChangePercent).toBeNull();
    expect(result.selectedPeriodPerformanceAbsoluteChange).toBeNull();
  });

  it("computes performance amount as latest value times period return", () => {
    const result = buildPortfolioValueOverTimeViewModel({
      rowsWithLiveAnchor: [
        row({
          bucketDate: "2026-02-09",
          totalValuePln: 1000,
          netExternalCashflowPln: 1000,
          netImplicitTransferPln: 0,
        }),
        row({
          bucketDate: "2026-02-10",
          totalValuePln: 2100,
          netExternalCashflowPln: 1000,
          netImplicitTransferPln: 0,
        }),
      ],
      range: "ALL",
      mode: "PERFORMANCE",
      currency: "PLN",
      todayBucketDate: "2026-02-10",
      liveTotals: {
        totalValue: 2100,
        isPartial: false,
        missingQuotes: 0,
        missingFx: 0,
        asOf: "2026-02-10T20:00:00.000Z",
      },
      canUseLiveEndpoint: false,
      polishCpiSeries: [],
      benchmarkSeriesState: emptyDashboardBenchmarkSeries(),
      selectedComparisons: [],
    });

    expect(result.nominalPeriodReturn).toBeCloseTo(0.1, 8);
    expect(result.selectedPeriodAbsoluteChange).toBe(1100);
    expect(result.selectedPeriodPerformanceAbsoluteChange).toBeCloseTo(210, 8);
  });

  it("drops non-finite performance points instead of surfacing NaN", () => {
    const result = buildPortfolioValueOverTimeViewModel({
      rowsWithLiveAnchor: [
        row({
          bucketDate: "2026-02-09",
          totalValuePln: 1000,
          netExternalCashflowPln: 1000,
          netImplicitTransferPln: 0,
        }),
        row({
          bucketDate: "2026-02-10",
          totalValuePln: 1200,
          netExternalCashflowPln: Number.NaN,
          netImplicitTransferPln: 0,
        }),
      ],
      range: "ALL",
      mode: "PERFORMANCE",
      currency: "PLN",
      todayBucketDate: "2026-02-10",
      liveTotals: {
        totalValue: 1200,
        isPartial: false,
        missingQuotes: 0,
        missingFx: 0,
        asOf: "2026-02-10T20:00:00.000Z",
      },
      canUseLiveEndpoint: false,
      polishCpiSeries: [],
      benchmarkSeriesState: emptyDashboardBenchmarkSeries(),
      selectedComparisons: [],
    });

    expect(result.nominalPeriodReturn).toBeNull();
    expect(result.hasPerformanceData).toBe(false);
    expect(result.cumulativeChartData).toHaveLength(0);
    expect(result.selectedPeriodPerformanceAbsoluteChange).toBeNull();
  });
});
