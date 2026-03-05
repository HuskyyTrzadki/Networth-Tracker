import { afterEach, describe, expect, it, vi } from "vitest";

import { getStockTradeMarkers } from "./get-stock-trade-markers";

describe("getStockTradeMarkers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty list for unauthorized response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    );

    const markers = await getStockTradeMarkers("AAPL");
    expect(markers).toEqual([]);
  });

  it("returns markers payload when available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          markers: [
            {
              id: "m1",
              tradeDate: "2026-01-01",
              side: "BUY",
              netQuantity: 1,
              weightedPrice: 10,
              grossNotional: 10,
              buyQuantity: 1,
              sellQuantity: 0,
              buyNotional: 10,
              sellNotional: 0,
              tradeCount: 1,
              portfolios: [],
              trades: [],
            },
          ],
        }),
        { status: 200 }
      )
    );

    const markers = await getStockTradeMarkers("AAPL");
    expect(markers).toHaveLength(1);
    expect(markers[0]?.id).toBe("m1");
  });
});
