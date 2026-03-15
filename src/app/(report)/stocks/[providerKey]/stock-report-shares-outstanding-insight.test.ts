import { describe, expect, it } from "vitest";

import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import { buildSharesOutstandingInsightWidget } from "./stock-report-shares-outstanding-insight";

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

describe("stock-report-shares-outstanding-insight", () => {
  it("builds quarterly and annual shares-outstanding history from Yahoo balance sheet data", () => {
    const widget = buildSharesOutstandingInsightWidget({
      quarterlyEvents: [
        createEvent("2025-03-31", 3_440_000_000, "POINT_IN_TIME"),
        createEvent("2025-06-30", 3_430_000_000, "POINT_IN_TIME"),
      ],
      annualEvents: [createEvent("2024-12-31", 3_450_000_000, "POINT_IN_TIME_ANNUAL")],
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points)
      .toEqual([
        {
          period: "Q1 25",
          primary: 3.44,
          date: "2025-03-31",
        },
        {
          period: "Q2 25",
          primary: 3.43,
          date: "2025-06-30",
        },
      ]);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 24",
        primary: 3.45,
        date: "2024-12-31",
      },
    ]);
  });

  it("fills missing annual history from year-end quarterly rows", () => {
    const widget = buildSharesOutstandingInsightWidget({
      quarterlyEvents: [
        createEvent("2024-12-31", 3_500_000_000, "POINT_IN_TIME"),
        createEvent("2025-12-31", 3_480_000_000, "POINT_IN_TIME"),
      ],
      annualEvents: [createEvent("2023-12-31", 3_520_000_000, "POINT_IN_TIME_ANNUAL")],
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 23",
        primary: 3.52,
        date: "2023-12-31",
      },
      {
        period: "FY 24",
        primary: 3.5,
        date: "2024-12-31",
      },
      {
        period: "FY 25",
        primary: 3.48,
        date: "2025-12-31",
      },
    ]);
  });
});
