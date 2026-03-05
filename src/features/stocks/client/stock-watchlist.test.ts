import { afterEach, describe, expect, it, vi } from "vitest";

import { getStockWatchlistStatus } from "./stock-watchlist";

describe("getStockWatchlistStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when request is unauthorized", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    );

    const result = await getStockWatchlistStatus("AAPL");
    expect(result).toEqual({ isFavorite: false });
  });

  it("returns parsed favorite status for successful response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ isFavorite: true }), { status: 200 })
    );

    const result = await getStockWatchlistStatus("AAPL");
    expect(result).toEqual({ isFavorite: true });
  });
});
