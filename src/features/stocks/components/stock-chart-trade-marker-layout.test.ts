import { describe, expect, it } from "vitest";

import { buildPositionedTradeMarkers } from "./stock-chart-trade-marker-layout";

describe("buildPositionedTradeMarkers", () => {
  const chartData = [
    { t: "2026-02-10T00:00:00.000Z" },
    { t: "2026-02-11T00:00:00.000Z" },
    { t: "2026-02-12T00:00:00.000Z" },
    { t: "2026-02-13T00:00:00.000Z" },
  ] as const;

  const markers = [
    {
      kind: "tradeMarker" as const,
      id: "trade:2026-02-10:BUY",
      t: "2026-02-10T00:00:00.000Z",
      tradeDate: "2026-02-10",
      side: "BUY" as const,
      netQuantity: 5,
      weightedPrice: 100,
      grossNotional: 500,
      buyQuantity: 5,
      sellQuantity: 0,
      buyNotional: 500,
      sellNotional: 0,
      tradeCount: 1,
    },
    {
      kind: "tradeMarker" as const,
      id: "trade:2026-02-11:SELL",
      t: "2026-02-11T00:00:00.000Z",
      tradeDate: "2026-02-11",
      side: "SELL" as const,
      netQuantity: 2,
      weightedPrice: 104,
      grossNotional: 208,
      buyQuantity: 0,
      sellQuantity: 2,
      buyNotional: 0,
      sellNotional: 208,
      tradeCount: 1,
    },
  ];

  it("clusters nearby markers on narrow plots", () => {
    const result = buildPositionedTradeMarkers({
      markers,
      chartData,
      priceAxisDomain: [90, 120],
      plotWidth: 40,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        clusteredMarkerCount: 2,
        side: "BUY",
        tradeDate: "2026-02-10",
        tradeDateEnd: "2026-02-11",
        netQuantity: 3,
        tradeCount: 2,
      })
    );
  });

  it("keeps markers separate when there is enough horizontal space", () => {
    const result = buildPositionedTradeMarkers({
      markers,
      chartData,
      priceAxisDomain: [90, 120],
      plotWidth: 600,
    });

    expect(result).toHaveLength(2);
    expect(result.map((marker) => marker.clusteredMarkerCount)).toEqual([1, 1]);
  });

  it("keeps nearly equal notionals visually similar in size", () => {
    const result = buildPositionedTradeMarkers({
      markers: [
        {
          ...markers[0],
          grossNotional: 55_405.9,
          buyNotional: 55_405.9,
        },
        {
          ...markers[1],
          side: "BUY",
          netQuantity: 121,
          grossNotional: 54_825.1,
          buyQuantity: 121,
          sellQuantity: 0,
          buyNotional: 54_825.1,
          sellNotional: 0,
        },
      ],
      chartData,
      priceAxisDomain: [90, 120],
      plotWidth: 600,
    });

    expect(result).toHaveLength(2);
    expect(Math.abs(result[0]!.markerSizeScale - result[1]!.markerSizeScale)).toBeLessThan(
      0.02
    );
  });
});
