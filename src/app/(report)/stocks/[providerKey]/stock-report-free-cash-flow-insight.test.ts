import { describe, expect, it } from "vitest";

import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import { buildFreeCashFlowInsightWidget } from "./stock-report-free-cash-flow-insight";

const createEvent = (
  periodEndDate: string,
  value: number
): FundamentalSeriesEvent => ({
  periodEndDate,
  value,
  periodType: "FLOW_QUARTERLY",
  source: "quarterly_financials",
});

describe("stock-report-free-cash-flow-insight", () => {
  it("builds quarterly and annual free cash flow history from Yahoo cash-flow rows", () => {
    const widget = buildFreeCashFlowInsightWidget({
      quarterlyEvents: [
        createEvent("2024-03-31", 4_000_000_000),
        createEvent("2024-06-30", 5_000_000_000),
        createEvent("2024-09-30", 6_000_000_000),
        createEvent("2024-12-31", 7_000_000_000),
        createEvent("2025-03-31", 6_500_000_000),
      ],
      annualEvents: [createEvent("2023-12-31", 18_000_000_000)],
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points)
      .toEqual([
        {
          period: "Q1 24",
          primary: 4,
          date: "2024-03-31",
        },
        {
          period: "Q2 24",
          primary: 5,
          date: "2024-06-30",
        },
        {
          period: "Q3 24",
          primary: 6,
          date: "2024-09-30",
        },
        {
          period: "Q4 24",
          primary: 7,
          date: "2024-12-31",
        },
        {
          period: "Q1 25",
          primary: 6.5,
          date: "2025-03-31",
        },
      ]);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 23",
        primary: 18,
        date: "2023-12-31",
      },
      {
        period: "FY 24",
        primary: 22,
        date: "2024-12-31",
      },
    ]);
  });
});
