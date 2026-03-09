import { describe, expect, it } from "vitest";

import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import {
  buildRevenueInsightWidget,
  getRevenueInsightAvailablePeriods,
  resolveDefaultRevenueInsightFrequency,
  resolveDefaultRevenueInsightPeriod,
  resolveVisibleRevenueInsightPoints,
} from "./stock-report-revenue-insight";

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

describe("stock-report-revenue-insight", () => {
  it("builds a quarterly revenue widget from Yahoo fundamentals", () => {
    const widget = buildRevenueInsightWidget({
      quarterlyEvents: [
        createEvent("2025-03-31", 80_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-06-30", 85_000_000_000, "FLOW_QUARTERLY"),
      ],
      annualEvents: [],
    });

    expect(widget).not.toBeNull();
    expect(widget?.kind).toBe("revenue");
    expect(widget?.datasets[0]?.points).toEqual([
      {
        period: "Q1 25",
        primary: 80,
        date: "2025-03-31",
      },
      {
        period: "Q2 25",
        primary: 85,
        date: "2025-06-30",
      },
    ]);
  });

  it("prefers quarterly frequency by default and picks the longest bounded point range", () => {
    const widget = buildRevenueInsightWidget({
      quarterlyEvents: [
        createEvent("2020-03-31", 40_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2020-06-30", 42_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2021-03-31", 48_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2021-06-30", 50_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2022-03-31", 58_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2022-06-30", 60_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2023-03-31", 68_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2023-06-30", 70_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-03-31", 78_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-06-30", 82_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-03-31", 88_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-06-30", 92_000_000_000, "FLOW_QUARTERLY"),
      ],
      annualEvents: [
        createEvent("2020-12-31", 180_000_000_000, "TTM_PROXY_ANNUAL"),
        createEvent("2021-12-31", 210_000_000_000, "TTM_PROXY_ANNUAL"),
      ],
    });

    expect(widget).not.toBeNull();
    expect(resolveDefaultRevenueInsightFrequency(widget!)).toBe("quarterly");
    expect(resolveDefaultRevenueInsightPeriod(widget!, "quarterly")).toBe("3Y");
  });

  it("builds annual bars from full quarterly years when annual proxy data lags", () => {
    const widget = buildRevenueInsightWidget({
      quarterlyEvents: [
        createEvent("2024-03-31", 78_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-06-30", 82_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-09-30", 86_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-12-31", 90_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-03-31", 92_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-06-30", 96_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-09-30", 101_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-12-31", 113_000_000_000, "FLOW_QUARTERLY"),
      ],
      annualEvents: [createEvent("2024-12-31", 350_000_000_000, "TTM_PROXY_ANNUAL")],
    });

    const annualPoints = widget?.datasets.find(
      (dataset) => dataset.frequency === "annual"
    )?.points;

    expect(annualPoints).toEqual([
      {
        period: "FY 24",
        primary: 336,
        date: "2024-12-31",
      },
      {
        period: "FY 25",
        primary: 402,
        date: "2025-12-31",
      },
    ]);
  });

  it("derives quarterly ranges by point count and slices the last four quarters for 1Y", () => {
    const widget = buildRevenueInsightWidget({
      quarterlyEvents: [
        createEvent("2022-03-31", 58_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2022-06-30", 60_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2023-03-31", 68_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2023-06-30", 70_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-03-31", 78_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2024-06-30", 82_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-03-31", 88_000_000_000, "FLOW_QUARTERLY"),
        createEvent("2025-06-30", 92_000_000_000, "FLOW_QUARTERLY"),
      ],
      annualEvents: [],
    });

    const available = getRevenueInsightAvailablePeriods(widget!, "quarterly");
    const visiblePoints = resolveVisibleRevenueInsightPoints(
      widget!,
      "quarterly",
      "1Y"
    );

    expect(available).toEqual(["1Y", "2Y", "ALL"]);
    expect(visiblePoints.map((point) => point.period)).toEqual([
      "Q1 24",
      "Q2 24",
      "Q1 25",
      "Q2 25",
    ]);
  });
});
