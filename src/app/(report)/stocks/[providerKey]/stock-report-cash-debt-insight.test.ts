import { describe, expect, it } from "vitest";

import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import { buildCashDebtInsightWidget } from "./stock-report-cash-debt-insight";

const createEvent = (
  periodEndDate: string,
  value: number,
  periodType: FundamentalSeriesEvent["periodType"]
): FundamentalSeriesEvent => ({
  periodEndDate,
  value,
  periodType,
  source: periodType === "POINT_IN_TIME" ? "quarterly_balance_sheet" : "annual_balance_sheet",
});

describe("stock-report-cash-debt-insight", () => {
  it("builds quarterly and annual cash-vs-debt history from Yahoo balance sheet data", () => {
    const widget = buildCashDebtInsightWidget({
      quarterlyCashEvents: [
        createEvent("2025-03-31", 62_000_000_000, "POINT_IN_TIME"),
        createEvent("2025-06-30", 64_000_000_000, "POINT_IN_TIME"),
      ],
      quarterlyDebtEvents: [
        createEvent("2025-03-31", 9_100_000_000, "POINT_IN_TIME"),
        createEvent("2025-06-30", 8_700_000_000, "POINT_IN_TIME"),
      ],
      annualCashEvents: [createEvent("2024-12-31", 60_000_000_000, "POINT_IN_TIME_ANNUAL")],
      annualDebtEvents: [createEvent("2024-12-31", 10_200_000_000, "POINT_IN_TIME_ANNUAL")],
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points)
      .toEqual([
        {
          period: "Q1 25",
          primary: 62,
          secondary: 9.1,
          date: "2025-03-31",
        },
        {
          period: "Q2 25",
          primary: 64,
          secondary: 8.7,
          date: "2025-06-30",
        },
      ]);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 24",
        primary: 60,
        secondary: 10.2,
        date: "2024-12-31",
      },
    ]);
  });

  it("fills missing annual history from year-end quarterly balance-sheet rows", () => {
    const widget = buildCashDebtInsightWidget({
      quarterlyCashEvents: [
        createEvent("2024-12-31", 61_000_000_000, "POINT_IN_TIME"),
        createEvent("2025-12-31", 63_000_000_000, "POINT_IN_TIME"),
      ],
      quarterlyDebtEvents: [
        createEvent("2024-12-31", 11_000_000_000, "POINT_IN_TIME"),
        createEvent("2025-12-31", 12_000_000_000, "POINT_IN_TIME"),
      ],
      annualCashEvents: [createEvent("2023-12-31", 58_000_000_000, "POINT_IN_TIME_ANNUAL")],
      annualDebtEvents: [createEvent("2023-12-31", 9_500_000_000, "POINT_IN_TIME_ANNUAL")],
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 23",
        primary: 58,
        secondary: 9.5,
        date: "2023-12-31",
      },
      {
        period: "FY 24",
        primary: 61,
        secondary: 11,
        date: "2024-12-31",
      },
      {
        period: "FY 25",
        primary: 63,
        secondary: 12,
        date: "2025-12-31",
      },
    ]);
  });
});
