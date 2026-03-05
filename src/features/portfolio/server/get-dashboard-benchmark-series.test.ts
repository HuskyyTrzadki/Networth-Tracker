import { describe, expect, it, vi, beforeEach } from "vitest";

import { getDashboardBenchmarkSeries } from "./get-dashboard-benchmark-series";
import { createBenchmarkCacheRepository } from "./benchmark-cache-repository";
import {
  loadBenchmarkInstrumentSeriesByProviderKey,
  loadFxSeriesByPair,
} from "./benchmark-fetch-warmup";
import { buildDashboardBenchmarkSeries } from "./benchmark-series-builder";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  tryCreateAdminClient: vi.fn(),
}));

vi.mock("./benchmark-cache-repository", () => ({
  createBenchmarkCacheRepository: vi.fn(),
}));

vi.mock("./benchmark-fetch-warmup", () => ({
  loadBenchmarkInstrumentSeriesByProviderKey: vi.fn(),
  loadFxSeriesByPair: vi.fn(),
  yahooBenchmarkPriceProvider: {},
}));

vi.mock("./benchmark-series-builder", () => ({
  buildDashboardBenchmarkSeries: vi.fn(),
  getSourceCurrencies: vi.fn(() => ["USD"]),
  getFxTargetCurrencies: vi.fn(() => ["PLN", "USD", "EUR"]),
}));

describe("getDashboardBenchmarkSeries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty series when bucket dates are empty", async () => {
    const output = await getDashboardBenchmarkSeries({} as never, []);

    expect(output).toEqual({ SP500: [], WIG20: [], MWIG40: [] });
    expect(createBenchmarkCacheRepository).not.toHaveBeenCalled();
  });

  it("returns empty dated series when no benchmark ids are requested", async () => {
    const output = await getDashboardBenchmarkSeries(
      {} as never,
      ["2026-01-10"],
      { benchmarkIds: [] }
    );

    expect(output.SP500).toEqual([{ date: "2026-01-10", PLN: null, USD: null, EUR: null }]);
    expect(output.WIG20).toEqual([{ date: "2026-01-10", PLN: null, USD: null, EUR: null }]);
    expect(output.MWIG40).toEqual([{ date: "2026-01-10", PLN: null, USD: null, EUR: null }]);
    expect(createBenchmarkCacheRepository).not.toHaveBeenCalled();
  });

  it("orchestrates cache repository, warmup loaders, and series builder", async () => {
    vi.mocked(tryCreateAdminClient).mockReturnValue(null);

    const repository = {
      readInstrumentRows: vi.fn(),
      readFxRows: vi.fn(),
      upsertInstrumentRows: vi.fn(),
      upsertFxRows: vi.fn(),
    };

    vi.mocked(createBenchmarkCacheRepository).mockReturnValue(repository as never);
    vi.mocked(loadBenchmarkInstrumentSeriesByProviderKey).mockResolvedValue(
      new Map([["VOO", [{ date: "2026-01-10", currency: "USD", close: "10" }]]])
    );
    vi.mocked(loadFxSeriesByPair).mockResolvedValue(new Map());
    vi.mocked(buildDashboardBenchmarkSeries).mockReturnValue({
      SP500: [{ date: "2026-01-10", PLN: 40, USD: 10, EUR: null }],
      WIG20: [{ date: "2026-01-10", PLN: null, USD: null, EUR: null }],
      MWIG40: [{ date: "2026-01-10", PLN: null, USD: null, EUR: null }],
    });

    const output = await getDashboardBenchmarkSeries(
      {} as never,
      ["2026-01-10"],
      { benchmarkIds: ["SP500"] }
    );

    expect(createBenchmarkCacheRepository).toHaveBeenCalledTimes(1);
    expect(loadBenchmarkInstrumentSeriesByProviderKey).toHaveBeenCalledWith(
      expect.objectContaining({
        repository,
        providerKeys: ["VOO"],
      })
    );
    expect(loadFxSeriesByPair).toHaveBeenCalledWith(
      expect.objectContaining({
        repository,
        sourceCurrencies: ["USD"],
      })
    );
    expect(buildDashboardBenchmarkSeries).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedBenchmarkIds: ["SP500"],
      })
    );
    expect(output.SP500[0]?.PLN).toBe(40);
  });
});
