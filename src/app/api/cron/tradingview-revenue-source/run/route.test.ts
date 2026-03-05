import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminClient } from "@/lib/supabase/admin";
import { runTradingViewRevenueSourceBackfillCron } from "@/features/market-data/server/tradingview-revenue-source/run-backfill-cron";

import { GET, POST } from "./route";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/features/market-data/server/tradingview-revenue-source/run-backfill-cron", () => ({
  runTradingViewRevenueSourceBackfillCron: vi.fn(),
}));

describe("/api/cron/tradingview-revenue-source/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "secret";
  });

  it("returns 405 for GET", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/tradingview-revenue-source/run")
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(vi.mocked(createAdminClient)).not.toHaveBeenCalled();
  });

  it("rejects unauthorized POST requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/tradingview-revenue-source/run", {
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(vi.mocked(createAdminClient)).not.toHaveBeenCalled();
  });

  it("accepts vercel cron header for POST", async () => {
    vi.mocked(createAdminClient).mockReturnValue({} as never);
    vi.mocked(runTradingViewRevenueSourceBackfillCron).mockResolvedValueOnce({
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

    const response = await POST(
      new Request("http://localhost/api/cron/tradingview-revenue-source/run?limit=10", {
        method: "POST",
        headers: {
          "x-vercel-cron": "1",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(runTradingViewRevenueSourceBackfillCron)).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
      })
    );
  });

  it("accepts bearer auth for manual POST runs", async () => {
    vi.mocked(createAdminClient).mockReturnValue({} as never);
    vi.mocked(runTradingViewRevenueSourceBackfillCron).mockResolvedValueOnce({
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

    const response = await POST(
      new Request(
        "http://localhost/api/cron/tradingview-revenue-source/run?staleDays=30&delayMs=500&timeBudgetMs=1000",
        {
          method: "POST",
          headers: {
            authorization: "Bearer secret",
          },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(runTradingViewRevenueSourceBackfillCron)).toHaveBeenCalledWith(
      expect.objectContaining({
        staleDays: 30,
        delayMs: 500,
        timeBudgetMs: 1000,
      })
    );
  });
});
