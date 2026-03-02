import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminClient } from "@/lib/supabase/admin";
import { runTradingViewRevenueGeoBackfillCron } from "@/features/market-data/server/tradingview-revenue-geo/run-backfill-cron";

import { GET } from "./route";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/features/market-data/server/tradingview-revenue-geo/run-backfill-cron", () => ({
  runTradingViewRevenueGeoBackfillCron: vi.fn(),
}));

describe("GET /api/cron/tradingview-revenue-geo/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "secret";
  });

  it("rejects unauthorized requests", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/tradingview-revenue-geo/run")
    );

    expect(response.status).toBe(401);
    expect(vi.mocked(createAdminClient)).not.toHaveBeenCalled();
  });

  it("accepts vercel cron header", async () => {
    vi.mocked(createAdminClient).mockReturnValue({} as never);
    vi.mocked(runTradingViewRevenueGeoBackfillCron).mockResolvedValueOnce({
      processed: 0,
      successes: 0,
      failures: 0,
      skipped: 0,
      remainingEstimate: 0,
      done: true,
      startedAt: "2026-03-02T00:00:00.000Z",
      finishedAt: "2026-03-02T00:00:01.000Z",
      totalCandidatesBeforeRun: 0,
    });

    const response = await GET(
      new Request("http://localhost/api/cron/tradingview-revenue-geo/run?limit=10", {
        headers: {
          "x-vercel-cron": "1",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(runTradingViewRevenueGeoBackfillCron)).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
      })
    );
  });

  it("accepts bearer auth for manual runs", async () => {
    vi.mocked(createAdminClient).mockReturnValue({} as never);
    vi.mocked(runTradingViewRevenueGeoBackfillCron).mockResolvedValueOnce({
      processed: 1,
      successes: 1,
      failures: 0,
      skipped: 0,
      remainingEstimate: 4,
      done: false,
      startedAt: "2026-03-02T00:00:00.000Z",
      finishedAt: "2026-03-02T00:00:01.000Z",
      totalCandidatesBeforeRun: 5,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/cron/tradingview-revenue-geo/run?staleDays=30&delayMs=500&timeBudgetMs=1000",
        {
          headers: {
            authorization: "Bearer secret",
          },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(runTradingViewRevenueGeoBackfillCron)).toHaveBeenCalledWith(
      expect.objectContaining({
        staleDays: 30,
        delayMs: 500,
        timeBudgetMs: 1000,
      })
    );
  });
});
