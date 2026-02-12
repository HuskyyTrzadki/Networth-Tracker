import { describe, expect, it } from "vitest";

import { __test__ } from "./fundamental-time-series";

describe("fundamental-time-series helpers", () => {
  it("parses EPS trailing rows with unix timestamps", () => {
    const rows = __test__.parseFundamentalRows(
      [
        {
          date: 1_696_032_000,
          periodType: "TTM",
          trailingDilutedEPS: 1.91,
        },
      ],
      {
        metric: "eps_ttm",
        source: "trailing",
        outputPeriodType: "TTM",
      }
    );

    expect(rows).toEqual([
      {
        periodEndDate: "2023-09-30",
        value: 1.91,
        periodType: "TTM",
        source: "trailing",
      },
    ]);
  });

  it("parses Revenue rows and filters expected period type", () => {
    const rows = __test__.parseFundamentalRows(
      [
        { date: "2025-03-31", periodType: "3M", totalRevenue: 100 },
        { date: "2025-04-01", periodType: "TTM", totalRevenue: 999 },
      ],
      {
        metric: "revenue_ttm",
        source: "quarterly_rollup",
        outputPeriodType: "TTM",
        expectedPeriodType: "3M",
      }
    );

    expect(rows).toEqual([
      {
        periodEndDate: "2025-03-31",
        value: 100,
        periodType: "TTM",
        source: "quarterly_rollup",
      },
    ]);
  });

  it("builds TTM from 4 quarterly points", () => {
    const ttm = __test__.buildTtmFromQuarterly([
      {
        periodEndDate: "2024-03-31",
        value: 10,
        periodType: "TTM",
        source: "quarterly_rollup",
      },
      {
        periodEndDate: "2024-06-30",
        value: 11,
        periodType: "TTM",
        source: "quarterly_rollup",
      },
      {
        periodEndDate: "2024-09-30",
        value: 12,
        periodType: "TTM",
        source: "quarterly_rollup",
      },
      {
        periodEndDate: "2024-12-31",
        value: 13,
        periodType: "TTM",
        source: "quarterly_rollup",
      },
    ]);

    expect(ttm).toEqual([
      {
        periodEndDate: "2024-12-31",
        value: 46,
        periodType: "TTM",
        source: "quarterly_rollup",
      },
    ]);
  });

  it("merges sources by priority", () => {
    const merged = __test__.mergeSeriesWithPriority([
      [
        {
          periodEndDate: "2024-12-31",
          value: 10,
          periodType: "TTM",
          source: "trailing",
        },
      ],
      [
        {
          periodEndDate: "2024-12-31",
          value: 9,
          periodType: "TTM",
          source: "quarterly_rollup",
        },
        {
          periodEndDate: "2024-09-30",
          value: 8,
          periodType: "TTM",
          source: "quarterly_rollup",
        },
      ],
    ]);

    expect(merged).toEqual([
      {
        periodEndDate: "2024-09-30",
        value: 8,
        periodType: "TTM",
        source: "quarterly_rollup",
      },
      {
        periodEndDate: "2024-12-31",
        value: 10,
        periodType: "TTM",
        source: "trailing",
      },
    ]);
  });
});
