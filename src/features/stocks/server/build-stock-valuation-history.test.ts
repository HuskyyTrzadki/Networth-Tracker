import { describe, expect, it } from "vitest";

import { buildStockValuationHistory } from "./build-stock-valuation-history";

describe("buildStockValuationHistory", () => {
  it("computes PE, P/S, and P/B with as-of step functions", () => {
    const points = buildStockValuationHistory(
      [
        {
          time: "2025-01-01T00:00:00.000Z",
          date: "2025-01-01",
          currency: "USD",
          timezone: "UTC",
          close: 100,
          adjClose: 100,
          price: 100,
        },
        {
          time: "2025-04-01T00:00:00.000Z",
          date: "2025-04-01",
          currency: "USD",
          timezone: "UTC",
          close: 120,
          adjClose: 120,
          price: 120,
        },
      ],
      {
        epsEvents: [
          {
            periodEndDate: "2024-12-31",
            value: 5,
            periodType: "TTM",
            source: "trailing",
          },
        ],
        revenueEvents: [
          {
            periodEndDate: "2024-12-31",
            value: 500,
            periodType: "TTM",
            source: "trailing",
          },
        ],
        sharesOutstandingEvents: [
          {
            periodEndDate: "2024-12-31",
            value: 10,
            periodType: "POINT_IN_TIME",
            source: "quarterly_balance_sheet",
          },
          {
            periodEndDate: "2025-03-31",
            value: 12,
            periodType: "POINT_IN_TIME",
            source: "quarterly_balance_sheet",
          },
        ],
        bookValueEvents: [
          {
            periodEndDate: "2024-12-31",
            value: 250,
            periodType: "POINT_IN_TIME",
            source: "quarterly_balance_sheet",
          },
          {
            periodEndDate: "2025-03-31",
            value: 360,
            periodType: "POINT_IN_TIME",
            source: "quarterly_balance_sheet",
          },
        ],
      }
    );

    expect(points).toEqual([
      {
        t: "2025-01-01T00:00:00.000Z",
        peTtm: 20,
        priceToSales: 2,
        priceToBook: 4,
      },
      {
        t: "2025-04-01T00:00:00.000Z",
        peTtm: 24,
        priceToSales: 2.88,
        priceToBook: 4,
      },
    ]);
  });

  it("drops ratios when denominators are missing or non-positive", () => {
    const points = buildStockValuationHistory(
      [
        {
          time: "2025-01-01T00:00:00.000Z",
          date: "2025-01-01",
          currency: "USD",
          timezone: "UTC",
          close: 100,
          adjClose: 100,
          price: 100,
        },
      ],
      {
        epsEvents: [
          {
            periodEndDate: "2024-12-31",
            value: -2,
            periodType: "TTM",
            source: "trailing",
          },
        ],
        revenueEvents: [
          {
            periodEndDate: "2024-12-31",
            value: 0,
            periodType: "TTM",
            source: "trailing",
          },
        ],
        sharesOutstandingEvents: [
          {
            periodEndDate: "2024-12-31",
            value: 10,
            periodType: "POINT_IN_TIME",
            source: "quarterly_balance_sheet",
          },
        ],
        bookValueEvents: [
          {
            periodEndDate: "2024-12-31",
            value: null,
            periodType: "POINT_IN_TIME",
            source: "quarterly_balance_sheet",
          },
        ],
      }
    );

    expect(points[0]).toEqual({
      t: "2025-01-01T00:00:00.000Z",
      peTtm: null,
      priceToSales: null,
      priceToBook: null,
    });
  });
});
