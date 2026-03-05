import type { SupabaseClient } from "@supabase/supabase-js";

import { subtractIsoDays } from "@/features/market-data/server/lib/date-utils";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

import {
  BENCHMARK_IDS,
  type BenchmarkId,
  type DashboardBenchmarkSeries,
  emptyDashboardBenchmarkSeries,
} from "../dashboard/lib/benchmark-config";
import { createBenchmarkCacheRepository } from "./benchmark-cache-repository";
import {
  loadBenchmarkInstrumentSeriesByProviderKey,
  loadFxSeriesByPair,
  yahooBenchmarkPriceProvider,
} from "./benchmark-fetch-warmup";
import {
  buildDashboardBenchmarkSeries,
  getFxTargetCurrencies,
  getSourceCurrencies,
} from "./benchmark-series-builder";

const PROVIDER = "yahoo";
const LOOKBACK_DAYS = 10;

const BENCHMARK_PROVIDER_KEYS: Readonly<Record<BenchmarkId, string>> = {
  SP500: "VOO",
  WIG20: "ETFBW20TR.WA",
  MWIG40: "ETFBM40TR.WA",
};

export async function getDashboardBenchmarkSeries(
  supabase: SupabaseClient<Database>,
  bucketDates: readonly string[],
  options?: Readonly<{ benchmarkIds?: readonly BenchmarkId[] }>
): Promise<DashboardBenchmarkSeries> {
  if (bucketDates.length === 0) return emptyDashboardBenchmarkSeries();

  const requestedBenchmarkIds = options?.benchmarkIds ?? BENCHMARK_IDS;
  if (requestedBenchmarkIds.length === 0) {
    return emptyDashboardBenchmarkSeries(bucketDates);
  }

  const sortedBucketDates = [...bucketDates].sort((left, right) => left.localeCompare(right));
  const fromDate = sortedBucketDates[0];
  const toDate = sortedBucketDates.at(-1) ?? fromDate;
  const warmupFromDate = subtractIsoDays(fromDate, LOOKBACK_DAYS);

  const adminClient = tryCreateAdminClient();
  const repository = createBenchmarkCacheRepository({
    reader: adminClient ?? supabase,
    writer: adminClient,
    provider: PROVIDER,
  });

  const providerKeys = requestedBenchmarkIds.map((id) => BENCHMARK_PROVIDER_KEYS[id]);
  const instrumentSeriesByProviderKey = await loadBenchmarkInstrumentSeriesByProviderKey({
    repository,
    providerName: PROVIDER,
    provider: yahooBenchmarkPriceProvider,
    providerKeys,
    fromDate,
    toDate,
    warmupFromDate,
  });

  const sourceCurrencies = getSourceCurrencies(instrumentSeriesByProviderKey);
  const fxSeriesByPair = await loadFxSeriesByPair({
    repository,
    providerName: PROVIDER,
    provider: yahooBenchmarkPriceProvider,
    sourceCurrencies,
    targetCurrencies: getFxTargetCurrencies(),
    fromDate,
    toDate,
    warmupFromDate,
  });

  return buildDashboardBenchmarkSeries({
    bucketDates: sortedBucketDates,
    requestedBenchmarkIds,
    benchmarkProviderKeys: BENCHMARK_PROVIDER_KEYS,
    instrumentSeriesByProviderKey,
    fxSeriesByPair,
  });
}
