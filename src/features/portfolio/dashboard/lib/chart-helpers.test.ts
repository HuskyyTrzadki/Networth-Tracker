import { describe, expect, it } from "vitest";

import type { SnapshotChartRow } from "../../server/snapshots/types";
import {
  toComparisonChartData,
  toInvestedCapitalSeries,
} from "./chart-helpers";

const row = (overrides: Partial<SnapshotChartRow>): SnapshotChartRow => ({
  bucketDate: "2026-01-01",
  totalValuePln: 0,
  totalValueUsd: 0,
  totalValueEur: 0,
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

describe("toInvestedCapitalSeries", () => {
  it("builds cumulative series for known external cashflows + implicit transfers", () => {
    const rows = [
      row({
        bucketDate: "2026-01-01",
        netExternalCashflowPln: 1000,
        netImplicitTransferPln: 10,
      }),
      row({
        bucketDate: "2026-01-02",
        netExternalCashflowPln: 500,
        netImplicitTransferPln: -5,
      }),
      row({
        bucketDate: "2026-01-03",
        netExternalCashflowPln: -250,
        netImplicitTransferPln: 0,
      }),
    ];

    expect(toInvestedCapitalSeries(rows, "PLN")).toEqual([
      { label: "2026-01-01", value: 1010 },
      { label: "2026-01-02", value: 1505 },
      { label: "2026-01-03", value: 1255 },
    ]);
  });

  it("skips leading unknown values and starts once known values begin", () => {
    const rows = [
      row({ bucketDate: "2026-01-01", netExternalCashflowPln: null }),
      row({ bucketDate: "2026-01-02", netExternalCashflowPln: null }),
      row({
        bucketDate: "2026-01-03",
        netExternalCashflowPln: 700,
        netImplicitTransferPln: 15,
      }),
    ];

    expect(toInvestedCapitalSeries(rows, "PLN")).toEqual([
      { label: "2026-01-01", value: null },
      { label: "2026-01-02", value: null },
      { label: "2026-01-03", value: 715 },
    ]);
  });

  it("keeps gaps after unknown external/implicit flow appears within known segment", () => {
    const rows = [
      row({
        bucketDate: "2026-01-01",
        netExternalCashflowUsd: 100,
        netImplicitTransferUsd: 1,
      }),
      row({
        bucketDate: "2026-01-02",
        netExternalCashflowUsd: 0,
        netImplicitTransferUsd: null,
      }),
      row({
        bucketDate: "2026-01-03",
        netExternalCashflowUsd: 50,
        netImplicitTransferUsd: 2,
      }),
    ];

    expect(toInvestedCapitalSeries(rows, "USD")).toEqual([
      { label: "2026-01-01", value: 101 },
      { label: "2026-01-02", value: null },
      { label: "2026-01-03", value: null },
    ]);
  });
});

describe("toComparisonChartData", () => {
  it("keeps net contributions flat for today's live point when snapshot is missing", () => {
    const valuePoints = [
      { label: "2026-02-05", value: 1000 },
      { label: "2026-02-06", value: 1200 },
    ] as const;
    const investedCapitalSeries = [
      { label: "2026-02-05", value: 900 },
    ] as const;

    expect(
      toComparisonChartData(valuePoints, investedCapitalSeries, "2026-02-06")
    ).toEqual([
      { label: "2026-02-05", portfolioValue: 1000, investedCapital: 900 },
      { label: "2026-02-06", portfolioValue: 1200, investedCapital: 900 },
    ]);
  });

  it("overrides explicit null only for today's point to keep endpoint visible", () => {
    const valuePoints = [
      { label: "2026-02-05", value: 1000 },
      { label: "2026-02-06", value: 1200 },
    ] as const;
    const investedCapitalSeries = [
      { label: "2026-02-05", value: 900 },
      { label: "2026-02-06", value: null },
    ] as const;

    expect(
      toComparisonChartData(valuePoints, investedCapitalSeries, "2026-02-06")
    ).toEqual([
      { label: "2026-02-05", portfolioValue: 1000, investedCapital: 900 },
      { label: "2026-02-06", portfolioValue: 1200, investedCapital: 900 },
    ]);
  });

  it("keeps explicit null for historical points (not today)", () => {
    const valuePoints = [
      { label: "2026-02-04", value: 950 },
      { label: "2026-02-05", value: 1000 },
      { label: "2026-02-06", value: 1200 },
    ] as const;
    const investedCapitalSeries = [
      { label: "2026-02-04", value: 850 },
      { label: "2026-02-05", value: null },
      { label: "2026-02-06", value: 900 },
    ] as const;

    expect(
      toComparisonChartData(valuePoints, investedCapitalSeries, "2026-02-06")
    ).toEqual([
      { label: "2026-02-04", portfolioValue: 950, investedCapital: 850 },
      { label: "2026-02-05", portfolioValue: 1000, investedCapital: null },
      { label: "2026-02-06", portfolioValue: 1200, investedCapital: 900 },
    ]);
  });
});
