import { describe, expect, it } from "vitest";

import {
  buildOverlayAxisMeta,
  buildLegendItems,
  buildChartData,
  buildPriceAxisDomain,
  getNextOverlaySelection,
  normalizeOverlaysForMode,
  toOverlayLineDataKey,
} from "./stock-chart-card-helpers";

describe("stock-chart-card-helpers", () => {
  it("keeps only one overlay in raw mode", () => {
    expect(normalizeOverlaysForMode("raw", ["epsTtm", "pe", "revenueTtm"])).toEqual([
      "pe",
    ]);
    expect(normalizeOverlaysForMode("raw", ["epsTtm", "revenueTtm"])).toEqual([
      "epsTtm",
    ]);
    expect(normalizeOverlaysForMode("raw", ["revenueTtm"])).toEqual([]);
  });

  it("keeps multi-overlay selection in trend mode", () => {
    expect(normalizeOverlaysForMode("trend", ["epsTtm", "pe"])).toEqual([
      "epsTtm",
      "pe",
    ]);
  });

  it("enforces single select on toggle in raw mode", () => {
    expect(getNextOverlaySelection("raw", ["pe"], "epsTtm", true)).toEqual([
      "epsTtm",
    ]);
    expect(getNextOverlaySelection("raw", ["epsTtm"], "epsTtm", false)).toEqual([]);
    expect(getNextOverlaySelection("raw", ["pe"], "revenueTtm", true)).toEqual([
      "pe",
    ]);
  });

  it("maps line keys by mode and overlay", () => {
    expect(toOverlayLineDataKey("pe", "trend")).toBe("peIndex");
    expect(toOverlayLineDataKey("epsTtm", "trend")).toBe("epsTtmIndex");
    expect(toOverlayLineDataKey("revenueTtm", "raw")).toBe("revenueTtmRaw");
  });

  it("builds legend items for active overlays and trend suffix", () => {
    const legend = buildLegendItems("trend", ["pe", "epsTtm"], {
      pe: true,
      epsTtm: false,
      revenueTtm: false,
    });

    expect(legend).toEqual([
      {
        key: "price",
        label: "Cena",
        color: "var(--chart-1)",
      },
      {
        key: "pe",
        label: "PE (100=start)",
        color: "var(--chart-4)",
      },
    ]);
  });

  it("builds raw-axis metadata with metric label and non-zero domain", () => {
    const chartData = buildChartData([
      {
        t: "2025-01-01T00:00:00.000Z",
        price: 100,
        pe: 20,
        peLabel: null,
        epsTtm: 5,
        revenueTtm: 500,
      },
      {
        t: "2025-02-01T00:00:00.000Z",
        price: 105,
        pe: 22,
        peLabel: null,
        epsTtm: 5.2,
        revenueTtm: 510,
      },
    ]);

    const axis = buildOverlayAxisMeta("raw", chartData, ["pe"], {
      pe: true,
      epsTtm: false,
      revenueTtm: false,
    });

    expect(axis.label).toBe("P/E");
    expect(axis.primaryOverlay).toBe("pe");
    expect(axis.domain).toEqual([19.84, 22.16]);
  });

  it("uses non-zero padded price domain for short ranges", () => {
    const chartData = buildChartData([
      {
        t: "2025-01-01T00:00:00.000Z",
        price: 320,
        pe: null,
        peLabel: null,
        epsTtm: null,
        revenueTtm: null,
      },
      {
        t: "2025-01-01T01:00:00.000Z",
        price: 330,
        pe: null,
        peLabel: null,
        epsTtm: null,
        revenueTtm: null,
      },
    ]);

    const domain = buildPriceAxisDomain("1D", chartData);
    expect(domain).toEqual([319.2, 330.8]);
  });

  it("uses zero-based domain for long ranges", () => {
    const chartData = buildChartData([
      {
        t: "2023-01-01T00:00:00.000Z",
        price: 100,
        pe: null,
        peLabel: null,
        epsTtm: null,
        revenueTtm: null,
      },
      {
        t: "2026-01-01T00:00:00.000Z",
        price: 150,
        pe: null,
        peLabel: null,
        epsTtm: null,
        revenueTtm: null,
      },
    ]);

    const domain = buildPriceAxisDomain("3Y", chartData);
    expect(domain).toEqual([0, 162]);
  });

  it("uses zero-based domain for 10Y range", () => {
    const chartData = buildChartData([
      {
        t: "2016-01-01T00:00:00.000Z",
        price: 200,
        pe: null,
        peLabel: null,
        epsTtm: null,
        revenueTtm: null,
      },
      {
        t: "2026-01-01T00:00:00.000Z",
        price: 260,
        pe: null,
        peLabel: null,
        epsTtm: null,
        revenueTtm: null,
      },
    ]);

    const domain = buildPriceAxisDomain("10Y", chartData);
    expect(domain).toEqual([0, 280.8]);
  });
});
