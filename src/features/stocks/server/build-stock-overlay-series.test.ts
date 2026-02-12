import { describe, expect, it } from "vitest";

import {
  buildOverlayCoverage,
  buildStockOverlaySeries,
} from "./build-stock-overlay-series";

describe("buildStockOverlaySeries", () => {
  it("computes PE with EPS as-of step function and carries EPS/Revenue values", () => {
    const points = buildStockOverlaySeries(
      [
        {
          time: "2025-01-01T00:00:00.000Z",
          date: "2025-01-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 100,
          adjClose: 100,
          price: 100,
        },
        {
          time: "2025-04-01T00:00:00.000Z",
          date: "2025-04-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 120,
          adjClose: 120,
          price: 120,
        },
      ],
      {
        includePe: true,
        epsEvents: [
          {
            periodEndDate: "2024-12-31",
            value: 5,
            periodType: "TTM",
            source: "trailing",
          },
          {
            periodEndDate: "2025-03-31",
            value: 6,
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
      }
    );

    expect(points[0]).toEqual({
      t: "2025-01-01T00:00:00.000Z",
      price: 100,
      epsTtm: 5,
      revenueTtm: 500,
      pe: 20,
      peLabel: null,
    });
    expect(points[1]).toEqual({
      t: "2025-04-01T00:00:00.000Z",
      price: 120,
      epsTtm: 6,
      revenueTtm: 500,
      pe: 20,
      peLabel: null,
    });
  });

  it("marks PE as N/M for non-positive EPS and '-' when EPS is missing", () => {
    const points = buildStockOverlaySeries(
      [
        {
          time: "2025-01-01T00:00:00.000Z",
          date: "2025-01-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 100,
          adjClose: 100,
          price: 100,
        },
        {
          time: "2025-02-01T00:00:00.000Z",
          date: "2025-02-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 90,
          adjClose: 90,
          price: 90,
        },
      ],
      {
        includePe: true,
        epsEvents: [
          {
            periodEndDate: "2025-01-15",
            value: -2,
            periodType: "TTM",
            source: "trailing",
          },
        ],
        revenueEvents: [],
      }
    );

    expect(points[0].peLabel).toBe("-");
    expect(points[1].peLabel).toBe("N/M");
  });

  it("builds overlay coverage and marks partial history", () => {
    const coverage = buildOverlayCoverage(
      [
        {
          t: "2025-01-01T00:00:00.000Z",
          price: 100,
          epsTtm: null,
          revenueTtm: null,
          pe: null,
          peLabel: "-",
        },
        {
          t: "2025-02-01T00:00:00.000Z",
          price: 105,
          epsTtm: 4.2,
          revenueTtm: 250,
          pe: 25,
          peLabel: null,
        },
      ],
      "2025-01-01"
    );

    expect(coverage.hasOverlayData).toEqual({
      pe: true,
      epsTtm: true,
      revenueTtm: true,
    });
    expect(coverage.overlayCoverage.epsTtm).toEqual({
      firstPointDate: "2025-02-01",
      lastPointDate: "2025-02-01",
      completeForRequestedRange: false,
    });
  });
});
