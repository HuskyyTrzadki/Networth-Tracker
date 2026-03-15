import { describe, expect, it } from "vitest";

import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import { buildOperatingMarginInsightWidget } from "./stock-report-operating-margin-insight";
import { resolveInsightWidgetCardStat } from "./stock-insights-widget-view";

const createEvent = (
  periodEndDate: string,
  value: number,
  periodType: FundamentalSeriesEvent["periodType"] = "FLOW_QUARTERLY"
): FundamentalSeriesEvent => ({
  periodEndDate,
  value,
  periodType,
  source:
    periodType === "FLOW_ANNUAL" ? "annual_financials" : "quarterly_financials",
});

describe("stock-report-operating-margin-insight", () => {
  it("builds quarterly and annual operating margin from Yahoo revenue and operating income", () => {
    const widget = buildOperatingMarginInsightWidget({
      quarterlyRevenueEvents: [
        createEvent("2024-03-31", 100),
        createEvent("2024-06-30", 120),
        createEvent("2024-09-30", 110),
        createEvent("2024-12-31", 130),
      ],
      quarterlyOperatingIncomeEvents: [
        createEvent("2024-03-31", 20),
        createEvent("2024-06-30", 24),
        createEvent("2024-09-30", 22),
        createEvent("2024-12-31", 26),
      ],
      annualRevenueEvents: [createEvent("2023-12-31", 400, "FLOW_ANNUAL")],
      annualOperatingIncomeEvents: [createEvent("2023-12-31", 80, "FLOW_ANNUAL")],
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points)
      .toEqual([
        {
          period: "Q1 24",
          primary: 0.2,
          date: "2024-03-31",
        },
        {
          period: "Q2 24",
          primary: 0.2,
          date: "2024-06-30",
        },
        {
          period: "Q3 24",
          primary: 0.2,
          date: "2024-09-30",
        },
        {
          period: "Q4 24",
          primary: 0.2,
          date: "2024-12-31",
        },
      ]);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 23",
        primary: 0.2,
        date: "2023-12-31",
      },
      {
        period: "FY 24",
        primary: 0.2,
        date: "2024-12-31",
      },
    ]);
  });

  it("formats the widget card stat as percent plus percentage-point delta", () => {
    const widget = buildOperatingMarginInsightWidget({
      quarterlyRevenueEvents: [
        createEvent("2024-03-31", 100),
        createEvent("2024-06-30", 100),
      ],
      quarterlyOperatingIncomeEvents: [
        createEvent("2024-03-31", 15),
        createEvent("2024-06-30", 20),
      ],
      annualRevenueEvents: [],
      annualOperatingIncomeEvents: [],
    });

    const points =
      widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points ?? [];

    expect(resolveInsightWidgetCardStat(widget!, points)).toBe("20% • +5 p.p.");
  });
});
