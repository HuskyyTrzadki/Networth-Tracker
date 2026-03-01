import { describe, expect, it } from "vitest";

import { resolveVisibleTradeMarkers } from "./stock-chart-card-view-model";

describe("resolveVisibleTradeMarkers", () => {
  it("maps merged markers onto chart timestamps", () => {
    const markers = resolveVisibleTradeMarkers(
      [
        {
          id: "trade:2026-02-10:BUY",
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
        },
        {
          id: "trade:2026-02-11:SELL",
          tradeDate: "2026-02-11",
          side: "SELL",
          netQuantity: 12,
          weightedPrice: 118,
          grossNotional: 1416,
          buyQuantity: 0,
          sellQuantity: 12,
          buyNotional: 0,
          sellNotional: 1416,
          tradeCount: 2,
          portfolios: [],
          trades: [],
        },
      ],
      [
        {
          t: "2026-02-10T00:00:00.000Z",
          price: 100,
          pe: null,
          peLabel: null,
          epsTtm: null,
          revenueTtm: null,
        },
        {
          t: "2026-02-11T00:00:00.000Z",
          price: 119,
          pe: null,
          peLabel: null,
          epsTtm: null,
          revenueTtm: null,
        },
      ]
    );

    expect(markers).toEqual([
      expect.objectContaining({
        kind: "tradeMarker",
        id: "trade:2026-02-10:BUY",
        t: "2026-02-10T00:00:00.000Z",
      }),
      expect.objectContaining({
        kind: "tradeMarker",
        id: "trade:2026-02-11:SELL",
        t: "2026-02-11T00:00:00.000Z",
      }),
    ]);
  });

  it("skips markers that are outside of the resolved chart dates", () => {
    const markers = resolveVisibleTradeMarkers(
      [
        {
          id: "trade:2026-02-15:BUY",
          tradeDate: "2026-02-15",
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
        },
      ],
      [
        {
          t: "2026-02-10T00:00:00.000Z",
          price: 100,
          pe: null,
          peLabel: null,
          epsTtm: null,
          revenueTtm: null,
        },
      ]
    );

    expect(markers).toEqual([]);
  });

  it("snaps weekend trade dates to the nearest visible trading session", () => {
    const markers = resolveVisibleTradeMarkers(
      [
        {
          id: "trade:2026-02-22:BUY",
          tradeDate: "2026-02-22",
          side: "BUY",
          netQuantity: 100,
          weightedPrice: 451,
          grossNotional: 45100,
          buyQuantity: 100,
          sellQuantity: 0,
          buyNotional: 45100,
          sellNotional: 0,
          tradeCount: 1,
          portfolios: [],
          trades: [],
        },
      ],
      [
        {
          t: "2026-02-20T00:00:00.000Z",
          price: 447,
          pe: null,
          peLabel: null,
          epsTtm: null,
          revenueTtm: null,
        },
        {
          t: "2026-02-23T00:00:00.000Z",
          price: 454,
          pe: null,
          peLabel: null,
          epsTtm: null,
          revenueTtm: null,
        },
      ]
    );

    expect(markers).toEqual([
      expect.objectContaining({
        id: "trade:2026-02-22:BUY",
        t: "2026-02-23T00:00:00.000Z",
      }),
    ]);
  });
});
