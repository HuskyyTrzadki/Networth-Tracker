import { describe, expect, it, vi } from "vitest";

import {
  countTradingViewRevenueGeoBackfillCandidates,
  listTradingViewRevenueGeoBackfillCandidates,
} from "./list-backfill-candidates";

describe("TradingView revenue geo backfill candidate queries", () => {
  it("maps candidate rows from rpc output", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          provider: "yahoo",
          provider_key: "AAPL",
          symbol: "AAPL",
          name: "Apple",
          exchange: "NASDAQ",
          instrument_type: "EQUITY",
          updated_at: "2026-03-01T00:00:00.000Z",
          cache_fetched_at: null,
        },
      ],
      error: null,
    });

    const result = await listTradingViewRevenueGeoBackfillCandidates({
      supabase: { rpc } as never,
      staleBefore: "2025-12-01T00:00:00.000Z",
      limit: 25,
    });

    expect(rpc).toHaveBeenCalledWith(
      "list_tradingview_revenue_geo_backfill_candidates",
      expect.objectContaining({
        p_provider: "yahoo",
        p_limit: 25,
      })
    );
    expect(result).toEqual([
      {
        provider: "yahoo",
        providerKey: "AAPL",
        symbol: "AAPL",
        name: "Apple",
        exchange: "NASDAQ",
        instrumentType: "EQUITY",
        updatedAt: "2026-03-01T00:00:00.000Z",
        cacheFetchedAt: null,
      },
    ]);
  });

  it("returns numeric candidate count from rpc output", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: 17,
      error: null,
    });

    const result = await countTradingViewRevenueGeoBackfillCandidates(
      { rpc } as never,
      {
        staleBefore: "2025-12-01T00:00:00.000Z",
      }
    );

    expect(result).toBe(17);
    expect(rpc).toHaveBeenCalledWith(
      "count_tradingview_revenue_geo_backfill_candidates",
      expect.objectContaining({
        p_provider: "yahoo",
      })
    );
  });
});
