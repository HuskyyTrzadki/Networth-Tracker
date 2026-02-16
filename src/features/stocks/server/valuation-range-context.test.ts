import { describe, expect, it } from "vitest";

import { buildPeValuationRangeContext } from "./valuation-range-context";

describe("buildPeValuationRangeContext", () => {
  it("builds context from 5Y PE data and classifies low percentile", () => {
    const context = buildPeValuationRangeContext({
      summaryPeTtm: 11,
      chart: {
        providerKey: "META",
        requestedRange: "5Y",
        resolvedRange: "5Y",
        timezone: "UTC",
        currency: "USD",
        hasIntraday: false,
        hasPe: true,
        activeOverlays: ["pe"],
        hasOverlayData: {
          pe: true,
          epsTtm: false,
          revenueTtm: false,
        },
        overlayCoverage: {
          pe: {
            firstPointDate: "2021-01-01",
            lastPointDate: "2025-12-31",
            completeForRequestedRange: true,
          },
          epsTtm: {
            firstPointDate: null,
            lastPointDate: null,
            completeForRequestedRange: false,
          },
          revenueTtm: {
            firstPointDate: null,
            lastPointDate: null,
            completeForRequestedRange: false,
          },
        },
        points: [
          { t: "2021-01-01", price: 10, pe: 10, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2021-06-01", price: 12, pe: 12, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2022-01-01", price: 13, pe: 14, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2022-06-01", price: 14, pe: 16, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2023-01-01", price: 16, pe: 18, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2023-06-01", price: 18, pe: 20, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2024-01-01", price: 19, pe: 22, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2024-06-01", price: 20, pe: 24, epsTtm: null, revenueTtm: null, peLabel: null },
        ],
      },
    });

    expect(context.min).toBe(10);
    expect(context.max).toBe(24);
    expect(context.pointsCount).toBe(8);
    expect(context.interpretation).toBe("HISTORY_LOW");
    expect(context.percentile).toBeCloseTo(0.07, 2);
  });

  it("marks context as insufficient when less than 8 points are available", () => {
    const context = buildPeValuationRangeContext({
      summaryPeTtm: 20,
      chart: {
        providerKey: "META",
        requestedRange: "5Y",
        resolvedRange: "3Y",
        timezone: "UTC",
        currency: "USD",
        hasIntraday: false,
        hasPe: true,
        activeOverlays: ["pe"],
        hasOverlayData: {
          pe: true,
          epsTtm: false,
          revenueTtm: false,
        },
        overlayCoverage: {
          pe: {
            firstPointDate: "2023-01-01",
            lastPointDate: "2025-12-31",
            completeForRequestedRange: false,
          },
          epsTtm: {
            firstPointDate: null,
            lastPointDate: null,
            completeForRequestedRange: false,
          },
          revenueTtm: {
            firstPointDate: null,
            lastPointDate: null,
            completeForRequestedRange: false,
          },
        },
        points: [
          { t: "2023-01-01", price: 10, pe: 15, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2023-06-01", price: 11, pe: 16, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2024-01-01", price: 12, pe: 17, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2024-06-01", price: 13, pe: 18, epsTtm: null, revenueTtm: null, peLabel: null },
          { t: "2025-01-01", price: 14, pe: 19, epsTtm: null, revenueTtm: null, peLabel: null },
        ],
      },
    });

    expect(context.pointsCount).toBe(5);
    expect(context.isTruncated).toBe(true);
    expect(context.interpretation).toBe("INSUFFICIENT_HISTORY");
  });

  it("returns no-data context when PE values are missing", () => {
    const context = buildPeValuationRangeContext({
      summaryPeTtm: null,
      chart: {
        providerKey: "META",
        requestedRange: "5Y",
        resolvedRange: "5Y",
        timezone: "UTC",
        currency: "USD",
        hasIntraday: false,
        hasPe: false,
        activeOverlays: ["pe"],
        hasOverlayData: {
          pe: false,
          epsTtm: false,
          revenueTtm: false,
        },
        overlayCoverage: {
          pe: {
            firstPointDate: null,
            lastPointDate: null,
            completeForRequestedRange: false,
          },
          epsTtm: {
            firstPointDate: null,
            lastPointDate: null,
            completeForRequestedRange: false,
          },
          revenueTtm: {
            firstPointDate: null,
            lastPointDate: null,
            completeForRequestedRange: false,
          },
        },
        points: [
          { t: "2024-01-01", price: 12, pe: null, epsTtm: null, revenueTtm: null, peLabel: "N/M" },
        ],
      },
    });

    expect(context.pointsCount).toBe(0);
    expect(context.interpretation).toBe("NO_DATA");
    expect(context.min).toBeNull();
    expect(context.max).toBeNull();
  });
});

