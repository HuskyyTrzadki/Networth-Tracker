import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/market-data/server/providers/yahoo/yahoo-daily", () => ({
  fetchYahooDailySeries: vi.fn(),
}));

import {
  loadBenchmarkInstrumentSeriesByProviderKey,
  type BenchmarkPriceProvider,
} from "./benchmark-fetch-warmup";
import type { BenchmarkCacheRepository } from "./benchmark-cache-repository";

const PROVIDER_NAME = "yahoo";

const makeRepository = (
  instrumentRows: Awaited<ReturnType<BenchmarkCacheRepository["readInstrumentRows"]>>,
  onUpsert?: (rows: unknown[]) => void
): BenchmarkCacheRepository => ({
  readInstrumentRows: vi.fn().mockResolvedValue(instrumentRows),
  readFxRows: vi.fn().mockResolvedValue([]),
  upsertInstrumentRows: vi.fn().mockImplementation(async (rows) => {
    onUpsert?.(rows as unknown[]);
  }),
  upsertFxRows: vi.fn().mockResolvedValue(undefined),
});

describe("loadBenchmarkInstrumentSeriesByProviderKey", () => {
  it("skips provider fetch when cache coverage is complete", async () => {
    const provider: BenchmarkPriceProvider = {
      fetchDailySeries: vi.fn(),
    };
    const repository = makeRepository([
      {
        provider_key: "VOO",
        price_date: "2026-01-01",
        currency: "USD",
        close: 100,
      },
      {
        provider_key: "VOO",
        price_date: "2026-01-10",
        currency: "USD",
        close: 101,
      },
    ]);

    const result = await loadBenchmarkInstrumentSeriesByProviderKey({
      repository,
      providerName: PROVIDER_NAME,
      provider,
      providerKeys: ["VOO"],
      fromDate: "2026-01-01",
      toDate: "2026-01-10",
      warmupFromDate: "2025-12-22",
    });

    expect(provider.fetchDailySeries).not.toHaveBeenCalled();
    expect(result.get("VOO")).toEqual([
      { date: "2026-01-01", currency: "USD", close: "100" },
      { date: "2026-01-10", currency: "USD", close: "101" },
    ]);
  });

  it("fetches and upserts when cache coverage is incomplete", async () => {
    const upsertSpy = vi.fn();
    const repository = makeRepository([], upsertSpy);
    const provider: BenchmarkPriceProvider = {
      fetchDailySeries: vi.fn().mockResolvedValue({
        currency: "USD",
        exchangeTimezone: "America/New_York",
        candles: [
          {
            date: "2026-01-05",
            asOf: "2026-01-05T22:00:00.000Z",
            open: 100,
            high: 101,
            low: 99,
            close: 100.5,
            volume: 123,
          },
        ],
      }),
    };

    const result = await loadBenchmarkInstrumentSeriesByProviderKey({
      repository,
      providerName: PROVIDER_NAME,
      provider,
      providerKeys: ["VOO"],
      fromDate: "2026-01-01",
      toDate: "2026-01-10",
      warmupFromDate: "2025-12-22",
    });

    expect(provider.fetchDailySeries).toHaveBeenCalledWith(
      "VOO",
      "2025-12-22",
      "2026-01-10"
    );
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(result.get("VOO")).toEqual([
      { date: "2026-01-05", currency: "USD", close: "100.5" },
    ]);
  });

  it("keeps graceful output when provider fetch fails", async () => {
    const upsertSpy = vi.fn();
    const repository = makeRepository([], upsertSpy);
    const provider: BenchmarkPriceProvider = {
      fetchDailySeries: vi.fn().mockResolvedValue(null),
    };

    const result = await loadBenchmarkInstrumentSeriesByProviderKey({
      repository,
      providerName: PROVIDER_NAME,
      provider,
      providerKeys: ["VOO"],
      fromDate: "2026-01-01",
      toDate: "2026-01-10",
      warmupFromDate: "2025-12-22",
    });

    expect(provider.fetchDailySeries).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledWith([]);
    expect(result.get("VOO")).toEqual([]);
  });
});
