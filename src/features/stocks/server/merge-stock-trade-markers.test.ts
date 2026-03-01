import { describe, expect, it } from "vitest";

import { mergeStockTradeMarkers } from "./merge-stock-trade-markers";

const buildTrade = (overrides: Partial<{
  id: string;
  tradeDate: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  portfolioId: string;
  portfolioName: string;
}> = {}) => ({
  id: overrides.id ?? crypto.randomUUID(),
  tradeDate: overrides.tradeDate ?? "2026-02-11",
  side: overrides.side ?? "BUY",
  price: overrides.price ?? 100,
  quantity: overrides.quantity ?? 1,
  portfolioId: overrides.portfolioId ?? "p-1",
  portfolioName: overrides.portfolioName ?? "Main",
});

describe("mergeStockTradeMarkers", () => {
  it("merges same-day buys into one net-buy marker", () => {
    const markers = mergeStockTradeMarkers([
      buildTrade({ id: "t1", quantity: 10, price: 100 }),
      buildTrade({ id: "t2", quantity: 5, price: 110 }),
    ]);

    expect(markers).toEqual([
      expect.objectContaining({
        id: "trade:2026-02-11:BUY",
        side: "BUY",
        netQuantity: 15,
        weightedPrice: 103.33333333333333,
        grossNotional: 1550,
        buyQuantity: 15,
        sellQuantity: 0,
        tradeCount: 2,
      }),
    ]);
  });

  it("uses net quantity when buys and sells happen on the same day", () => {
    const markers = mergeStockTradeMarkers([
      buildTrade({ id: "buy", side: "BUY", quantity: 10, price: 100 }),
      buildTrade({ id: "sell", side: "SELL", quantity: 5, price: 120 }),
    ]);

    expect(markers).toEqual([
      expect.objectContaining({
        side: "BUY",
        netQuantity: 5,
        weightedPrice: 100,
        grossNotional: 1000,
        buyQuantity: 10,
        sellQuantity: 5,
        buyNotional: 1000,
        sellNotional: 600,
      }),
    ]);
  });

  it("drops flat same-day activity when the net quantity is zero", () => {
    const markers = mergeStockTradeMarkers([
      buildTrade({ id: "buy", side: "BUY", quantity: 10, price: 100 }),
      buildTrade({ id: "sell", side: "SELL", quantity: 10, price: 99 }),
    ]);

    expect(markers).toEqual([]);
  });

  it("aggregates per-portfolio summaries and sorts them by gross notional", () => {
    const markers = mergeStockTradeMarkers([
      buildTrade({
        id: "t1",
        side: "BUY",
        quantity: 4,
        price: 100,
        portfolioId: "p-1",
        portfolioName: "Core",
      }),
      buildTrade({
        id: "t2",
        side: "BUY",
        quantity: 8,
        price: 95,
        portfolioId: "p-2",
        portfolioName: "Growth",
      }),
      buildTrade({
        id: "t3",
        side: "SELL",
        quantity: 1,
        price: 110,
        portfolioId: "p-1",
        portfolioName: "Core",
      }),
    ]);

    expect(markers[0]?.portfolios).toEqual([
      expect.objectContaining({
        portfolioId: "p-2",
        portfolioName: "Growth",
        side: "BUY",
        netQuantity: 8,
        grossNotional: 760,
      }),
      expect.objectContaining({
        portfolioId: "p-1",
        portfolioName: "Core",
        side: "BUY",
        netQuantity: 3,
        grossNotional: 400,
      }),
    ]);
  });
});
