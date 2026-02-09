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
  });
});
