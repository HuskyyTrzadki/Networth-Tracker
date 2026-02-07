import { describe, expect, it } from "vitest";

import type { SnapshotChartRow } from "../../server/snapshots/types";
import {
  getRangeRows,
  projectSeriesToRows,
  toCumulativeInflationSeries,
  toComparisonChartData,
  toInvestedCapitalSeries,
  toRealReturnSeries,
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

  it("keeps absolute invested-capital baseline when chart is sliced to a shorter range", () => {
    const rows = [
      row({
        bucketDate: "2026-01-01",
        netExternalCashflowPln: 1000,
        netImplicitTransferPln: 0,
      }),
      row({
        bucketDate: "2026-01-02",
        netExternalCashflowPln: 0,
        netImplicitTransferPln: 0,
      }),
      row({
        bucketDate: "2026-01-03",
        netExternalCashflowPln: 0,
        netImplicitTransferPln: 0,
      }),
    ];

    const fullSeries = toInvestedCapitalSeries(rows, "PLN");
    const rangeRows = getRangeRows(rows, "1D").rows;

    expect(projectSeriesToRows(rangeRows, fullSeries)).toEqual([
      { label: "2026-01-03", value: 1000 },
    ]);
  });
});

describe("getRangeRows", () => {
  it("skips previous row for returns when the gap is too large", () => {
    const rows = [
      row({ bucketDate: "2024-12-31", totalValuePln: 1000 }),
      row({ bucketDate: "2026-01-10", totalValuePln: 1200 }),
    ];

    const result = getRangeRows(rows, "YTD");

    expect(result.rows.map((entry) => entry.bucketDate)).toEqual(["2026-01-10"]);
    expect(result.rowsForReturns.map((entry) => entry.bucketDate)).toEqual([
      "2026-01-10",
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

describe("toCumulativeInflationSeries", () => {
  it("maps monthly index levels to cumulative inflation using as-of month lookup", () => {
    const bucketDates = [
      "2026-01-15",
      "2026-02-10",
      "2026-03-20",
    ];
    const inflationPoints = [
      { periodDate: "2026-01-01", value: 100 },
      { periodDate: "2026-02-01", value: 101.5 },
      { periodDate: "2026-03-01", value: 103 },
    ];

    const result = toCumulativeInflationSeries(bucketDates, inflationPoints);

    expect(result).toHaveLength(3);
    expect(result[0]?.label).toBe("2026-01-15");
    expect(result[0]?.value).toBeCloseTo(0);
    expect(result[1]?.label).toBe("2026-02-10");
    expect(result[1]?.value).toBeCloseTo(0.015);
    expect(result[2]?.label).toBe("2026-03-20");
    expect(result[2]?.value).toBeCloseTo(0.03);
  });
});

describe("toRealReturnSeries", () => {
  it("computes real cumulative return from nominal and cumulative inflation", () => {
    const nominal = [
      { label: "2026-01-15", value: 0.1 },
      { label: "2026-02-10", value: 0.2 },
    ] as const;
    const inflation = [
      { label: "2026-01-15", value: 0.02 },
      { label: "2026-02-10", value: 0.05 },
    ] as const;

    const result = toRealReturnSeries(nominal, inflation);

    expect(result[0]?.value).toBeCloseTo((1.1 / 1.02) - 1);
    expect(result[1]?.value).toBeCloseTo((1.2 / 1.05) - 1);
  });
});
