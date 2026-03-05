import { describe, expect, it } from "vitest";

import {
  buildStockChartPlotViewState,
  resolveStockChartAreaFillColor,
  resolveStockChartPlotAnimationState,
} from "./stock-chart-plot-view-state";
import type { StockChartResponse } from "../server/types";

const chart: StockChartResponse = {
  providerKey: "AAPL",
  requestedRange: "1Y",
  resolvedRange: "1Y",
  timezone: "UTC",
  currency: "EUR",
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
};

describe("stock-chart-plot-view-state", () => {
  it("disables animations when loading or reduced motion is enabled", () => {
    expect(resolveStockChartPlotAnimationState(true, false)).toEqual({
      isDisabled: true,
      chartDuration: 0,
      overlayDuration: 0,
      areaDuration: 0,
    });

    expect(resolveStockChartPlotAnimationState(false, false)).toEqual({
      isDisabled: false,
      chartDuration: 180,
      overlayDuration: 160,
      areaDuration: 160,
    });
  });

  it("resolves area fill by trend and overlay visibility", () => {
    expect(
      resolveStockChartAreaFillColor({
        priceTrendDirection: "down",
        hasEnabledOverlays: true,
      })
    ).toBe("rgba(208, 116, 109, 0.26)");
  });

  it("builds derived plot state with overlay lines and chart config", () => {
    const viewState = buildStockChartPlotViewState({
      chart,
      chartData: [
        {
          t: "2026-01-01T00:00:00.000Z",
          price: 100,
          peRaw: 20,
          epsTtmRaw: null,
          revenueTtmRaw: null,
          peLabel: null,
          peIndex: 100,
          epsTtmIndex: null,
          revenueTtmIndex: null,
        },
      ],
      normalizedOverlays: ["pe", "epsTtm"],
      mode: "trend",
      priceTrendDirection: "up",
      priceLineColor: "var(--chart-1)",
      priceAxisDomainForChart: [80, 120],
      overlayAxisLabel: "Overlay",
      visibleTradeMarkers: [],
      eventMarkers: [],
      chartWidth: 640,
    });

    expect(viewState.chartCurrency).toBe("EUR");
    expect(viewState.areaBaseValue).toBe(80);
    expect(viewState.overlayLines).toEqual([
      {
        overlay: "pe",
        lineDataKey: "peIndex",
        yAxisId: "overlay",
        type: "linear",
        color: "var(--chart-5)",
      },
    ]);
    expect(viewState.chartConfig.price?.label).toBe("Cena");
    expect(viewState.chartConfig.pe?.color).toBe("var(--chart-5)");
  });
});
