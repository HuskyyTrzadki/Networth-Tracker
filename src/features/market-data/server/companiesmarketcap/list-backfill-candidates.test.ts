import { describe, expect, it, vi } from "vitest";

import {
  countCompaniesMarketCapBackfillCandidates,
  listCompaniesMarketCapBackfillCandidates,
} from "./list-backfill-candidates";

describe("CompaniesMarketCap backfill candidate queries", () => {
  it("maps candidate rows from rpc output", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          provider: "yahoo",
          provider_key: "CDR.WA",
          symbol: "CDR.WA",
          name: "CD Projekt",
          exchange: "WSE",
          instrument_type: "EQUITY",
          updated_at: "2026-03-10T00:00:00.000Z",
          cache_fetched_at: null,
        },
      ],
      error: null,
    });

    const result = await listCompaniesMarketCapBackfillCandidates({
      supabase: { rpc } as never,
      staleBefore: "2026-03-03T00:00:00.000Z",
      limit: 25,
    });

    expect(rpc).toHaveBeenCalledWith(
      "list_companiesmarketcap_backfill_candidates",
      expect.objectContaining({
        p_provider: "yahoo",
        p_limit: 25,
      })
    );

    expect(result).toEqual([
      {
        provider: "yahoo",
        providerKey: "CDR.WA",
        symbol: "CDR.WA",
        name: "CD Projekt",
        exchange: "WSE",
        instrumentType: "EQUITY",
        updatedAt: "2026-03-10T00:00:00.000Z",
        cacheFetchedAt: null,
      },
    ]);
  });

  it("returns numeric candidate count from rpc output", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: 17,
      error: null,
    });

    const result = await countCompaniesMarketCapBackfillCandidates(
      { rpc } as never,
      {
        staleBefore: "2026-03-03T00:00:00.000Z",
      }
    );

    expect(result).toBe(17);
    expect(rpc).toHaveBeenCalledWith(
      "count_companiesmarketcap_backfill_candidates",
      expect.objectContaining({
        p_provider: "yahoo",
      })
    );
  });
});
