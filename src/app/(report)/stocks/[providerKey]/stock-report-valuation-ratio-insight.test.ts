import { describe, expect, it } from "vitest";

import {
  resolveDefaultHistoricalInsightPeriod,
  resolveVisibleHistoricalInsightPoints,
} from "./stock-report-historical-insight";
import { buildValuationRatioInsightWidget } from "./stock-report-valuation-ratio-insight";

describe("stock-report-valuation-ratio-insight", () => {
  it("builds dense daily points for shorter ranges and annual fallback for older years", () => {
    const widget = buildValuationRatioInsightWidget({
      kind: "ps-ratio",
      historyPoints: [
        {
          t: "2024-01-15T00:00:00.000Z",
          peTtm: 20,
          priceToSales: 7,
          priceToBook: null,
        },
        {
          t: "2024-06-15T00:00:00.000Z",
          peTtm: 21,
          priceToSales: 8,
          priceToBook: null,
        },
        {
          t: "2024-12-30T00:00:00.000Z",
          peTtm: 24,
          priceToSales: 9,
          priceToBook: null,
        },
      ],
      fallbackAnnualHistory: [
        {
          year: 2023,
          value: 6,
          changePercent: null,
          isTtm: false,
          periodLabel: null,
        },
      ],
    });

    expect(widget?.frequencyMode).toBe("best-available");
    expect(widget?.datasets.find((dataset) => dataset.frequency === "daily")?.points).toEqual([
      {
        period: "FY 23",
        primary: 6,
        date: "2023-12-31",
      },
      {
        period: "Jan 24",
        primary: 7,
        date: "2024-01-15",
      },
      {
        period: "Jun 24",
        primary: 8,
        date: "2024-06-15",
      },
      {
        period: "Dec 24",
        primary: 9,
        date: "2024-12-30",
      },
    ]);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 23",
        primary: 6,
        date: "2023-12-31",
      },
      {
        period: "FY 24",
        primary: 9,
        date: "2024-12-31",
      },
    ]);
  });

  it("defaults ratio widgets to the longest detailed range instead of the longest annual one", () => {
    const widget = buildValuationRatioInsightWidget({
      kind: "pe-ratio",
      historyPoints: [
        {
          t: "2021-03-31T00:00:00.000Z",
          peTtm: 10,
          priceToSales: 2,
          priceToBook: null,
        },
        {
          t: "2022-03-31T00:00:00.000Z",
          peTtm: 11,
          priceToSales: 2.2,
          priceToBook: null,
        },
        {
          t: "2023-03-31T00:00:00.000Z",
          peTtm: 12,
          priceToSales: 2.4,
          priceToBook: null,
        },
        {
          t: "2024-03-31T00:00:00.000Z",
          peTtm: 13,
          priceToSales: 2.6,
          priceToBook: null,
        },
        {
          t: "2025-03-31T00:00:00.000Z",
          peTtm: 14,
          priceToSales: 2.8,
          priceToBook: null,
        },
        {
          t: "2026-03-31T00:00:00.000Z",
          peTtm: 15,
          priceToSales: 3,
          priceToBook: null,
        },
      ],
      fallbackAnnualHistory: [
        {
          year: 2020,
          value: 8,
          changePercent: null,
          isTtm: false,
          periodLabel: null,
        },
      ],
    });

    expect(resolveDefaultHistoricalInsightPeriod(widget!)).toBe("5Y");
    expect(resolveVisibleHistoricalInsightPoints(widget!, undefined, "1Y")).toEqual([
      {
        period: "Mar 25",
        primary: 14,
        date: "2025-03-31",
      },
      {
        period: "Mar 26",
        primary: 15,
        date: "2026-03-31",
      },
    ]);
    expect(
      resolveVisibleHistoricalInsightPoints(widget!, undefined, "ALL").map(
        (point) => point.period
      )
    ).toEqual([
      "FY 20",
      "Mar 21",
      "Mar 22",
      "Mar 23",
      "Mar 24",
      "Mar 25",
      "Mar 26",
    ]);
  });
});
