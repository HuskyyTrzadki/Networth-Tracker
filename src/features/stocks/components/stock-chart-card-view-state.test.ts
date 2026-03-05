import { describe, expect, it } from "vitest";

import {
  buildStockChartNotice,
  buildVisibleLegendItems,
  isStockChartEventRangeEligible,
  isStockChartTenYearUnavailable,
  resolveInitialFundamentalSelection,
  resolveStockChartResourceState,
  resolveStockTradeMarkers,
} from "./stock-chart-card-view-state";
import type { StockChartResponse, StockTradeMarker } from "../server/types";

const createChart = (
  overrides: Partial<StockChartResponse> = {}
): StockChartResponse => ({
  providerKey: "AAPL",
  requestedRange: "1M",
  resolvedRange: "1M",
  timezone: "UTC",
  currency: "USD",
  hasIntraday: true,
  hasPe: true,
  activeOverlays: ["pe"],
  hasOverlayData: {
    pe: true,
    epsTtm: false,
    revenueTtm: false,
  },
  overlayCoverage: {
    pe: {
      firstPointDate: null,
      lastPointDate: null,
      completeForRequestedRange: true,
    },
    epsTtm: {
      firstPointDate: null,
      lastPointDate: null,
      completeForRequestedRange: true,
    },
    revenueTtm: {
      firstPointDate: null,
      lastPointDate: null,
      completeForRequestedRange: true,
    },
  },
  points: [],
  ...overrides,
});

const tradeMarker: StockTradeMarker = {
  id: "trade:1",
  tradeDate: "2026-02-10",
  side: "BUY",
  netQuantity: 3,
  weightedPrice: 101,
  grossNotional: 303,
  buyQuantity: 3,
  sellQuantity: 0,
  buyNotional: 303,
  sellNotional: 0,
  tradeCount: 1,
  portfolios: [],
  trades: [],
};

describe("stock-chart-card-view-state", () => {
  it("hides stale initial chart while new range is loading", () => {
    const initialChart = createChart({ requestedRange: "1M", resolvedRange: "1M" });

    const result = resolveStockChartResourceState({
      fetchedChart: null,
      initialChart,
      isLoading: true,
      isInitialState: false,
    });

    expect(result.chart).toBeNull();
    expect(result.lastKnownChart).toBe(initialChart);
  });

  it("keeps fetched chart as source of truth", () => {
    const initialChart = createChart({ requestedRange: "1M", resolvedRange: "1M" });
    const fetchedChart = createChart({ requestedRange: "3M", resolvedRange: "3M" });

    const result = resolveStockChartResourceState({
      fetchedChart,
      initialChart,
      isLoading: false,
      isInitialState: false,
    });

    expect(result.chart).toBe(fetchedChart);
    expect(result.lastKnownChart).toBe(fetchedChart);
  });

  it("falls back to initial trade markers when fetched list is empty", () => {
    const result = resolveStockTradeMarkers([], [tradeMarker]);

    expect(result).toEqual([tradeMarker]);
  });

  it("builds warning notice before informational notices", () => {
    const notice = buildStockChartNotice({
      coverageWarnings: ["PE: brak danych"],
      mode: "trend",
      requestedRange: "1M",
      resolvedRange: "1M",
    });

    expect(notice).toEqual({
      tone: "warning",
      text: "Niepelne dane: PE: brak danych",
    });
  });

  it("adds event and trade items to legend when toggles are enabled", () => {
    const legend = buildVisibleLegendItems({
      baseLegendItems: [{ key: "price", label: "Cena", color: "var(--chart-1)" }],
      showTradeMarkers: true,
      hasTradeMarkers: true,
      showCompanyEvents: true,
      showGlobalEvents: true,
      hasVisibleEvents: true,
    });

    expect(legend.map((item) => item.key)).toEqual([
      "price",
      "trade-markers",
      "company-events",
      "global-events",
    ]);
  });

  it("keeps default fundamental overlay selection when nothing is active", () => {
    expect(resolveInitialFundamentalSelection([])).toEqual(["pe"]);
  });

  it("resolves range gating helpers", () => {
    expect(isStockChartTenYearUnavailable(createChart({ requestedRange: "10Y" }))).toBe(
      true
    );
    expect(isStockChartEventRangeEligible("5Y")).toBe(true);
    expect(isStockChartEventRangeEligible("1M")).toBe(false);
  });
});
