import { describe, expect, it } from "vitest";

import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import { buildEarningsInsightWidget } from "./stock-report-earnings-insight";

const createEvent = (
  periodEndDate: string,
  value: number,
  periodType: FundamentalSeriesEvent["periodType"]
): FundamentalSeriesEvent => ({
  periodEndDate,
  value,
  periodType,
  source: "quarterly_financials",
});

describe("stock-report-earnings-insight", () => {
  it("builds quarterly and annual earnings history from Yahoo and CompaniesMarketCap", () => {
    const widget = buildEarningsInsightWidget({
      quarterlyEvents: [
        createEvent("2024-03-31", 10_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-06-30", 20_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-09-30", 30_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-12-31", 40_000_000, "FLOW_QUARTERLY"),
      ],
      fallbackAnnualHistory: [
        {
          year: 2025,
          value: 150_000_000,
          changePercent: 0.41,
          isTtm: true,
          periodLabel: null,
        },
      ],
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points)
      .toHaveLength(4);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 24",
        primary: 0.1,
        date: "2024-12-31",
      },
      {
        period: "TTM 25",
        primary: 0.15,
        date: "2025-12-31",
      },
    ]);
  });
});
