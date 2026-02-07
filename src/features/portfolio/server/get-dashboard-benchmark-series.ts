import type { SupabaseClient } from "@supabase/supabase-js";

import { subtractIsoDays } from "@/features/market-data/server/lib/date-utils";
import { fetchYahooDailySeries } from "@/features/market-data/server/providers/yahoo/yahoo-daily";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

import {
  BENCHMARK_IDS,
  type BenchmarkId,
  type DashboardBenchmarkSeries,
  type BenchmarkSeriesPoint as InstrumentSeriesPoint,
  emptyDashboardBenchmarkSeries,
} from "../dashboard/lib/benchmark-config";
import {
  SNAPSHOT_CURRENCIES,
  buildSnapshotCurrencyMap,
} from "../lib/supported-currencies";
import {
  buildPairKey,
  convertPrice,
  hasCoverage,
  normalizeNumber,
  toAsOfFxMap,
  toAsOfValueMap,
  type FxSeriesRow,
  type InstrumentSeriesRow,
} from "./benchmark-series-helpers";

type InstrumentCacheRow = Readonly<{
  provider_key: string;
  price_date: string;
  currency: string;
  close: string | number;
}>;

type FxCacheRow = Readonly<{
  base_currency: string;
  quote_currency: string;
  rate_date: string;
  rate: string | number;
}>;

const PROVIDER = "yahoo";
const LOOKBACK_DAYS = 10;
const FETCH_TIMEOUT_MS = 5000;

const BENCHMARK_PROVIDER_KEYS: Readonly<Record<BenchmarkId, string>> = {
  SP500: "VOO",
  WIG20: "ETFBW20TR.WA",
  MWIG40: "ETFBM40TR.WA",
};

const readInstrumentRows = async (
  supabase: SupabaseClient,
  providerKeys: readonly string[],
  fromDate: string,
  toDate: string
) => {
  const { data, error } = await supabase
    .from("instrument_daily_prices_cache")
    .select("provider_key,price_date,currency,close")
    .eq("provider", PROVIDER)
    .in("provider_key", providerKeys)
    .gte("price_date", fromDate)
    .lte("price_date", toDate);

  if (error) throw new Error(error.message);
  return (data ?? []) as InstrumentCacheRow[];
};

const readFxRows = async (
  supabase: SupabaseClient,
  currencies: readonly string[],
  fromDate: string,
  toDate: string
) => {
  const { data, error } = await supabase
    .from("fx_daily_rates_cache")
    .select("base_currency,quote_currency,rate_date,rate")
    .eq("provider", PROVIDER)
    .in("base_currency", currencies)
    .in("quote_currency", currencies)
    .gte("rate_date", fromDate)
    .lte("rate_date", toDate);

  if (error) throw new Error(error.message);
  return (data ?? []) as FxCacheRow[];
};

const sortByDate = <T extends { date: string }>(rows: readonly T[]) =>
  [...rows].sort((left, right) => left.date.localeCompare(right.date));

const groupRowsByKey = <TRow,>(
  rows: readonly TRow[],
  getKey: (row: TRow) => string
) =>
  rows.reduce((accumulator, row) => {
    const key = getKey(row);
    const bucket = accumulator.get(key) ?? [];
    bucket.push(row);
    accumulator.set(key, bucket);
    return accumulator;
  }, new Map<string, TRow[]>());

const toInstrumentSeriesRow = (row: InstrumentCacheRow): InstrumentSeriesRow => ({
  date: row.price_date,
  currency: row.currency.toUpperCase(),
  close: normalizeNumber(row.close),
});

const toFxSeriesRow = (row: FxCacheRow): FxSeriesRow => ({
  date: row.rate_date,
  rate: normalizeNumber(row.rate),
});

const toEmptyBenchmarkPoint = (date: string): InstrumentSeriesPoint => ({
  date,
  ...buildSnapshotCurrencyMap(() => null),
});

const toConvertedBenchmarkPoint = (
  date: string,
  close: string,
  sourceCurrency: string,
  fxAsOfByPair: ReadonlyMap<string, ReadonlyMap<string, FxSeriesRow | null>>
): InstrumentSeriesPoint => ({
  date,
  ...buildSnapshotCurrencyMap((targetCurrency) =>
    convertPrice(
      close,
      sourceCurrency,
      targetCurrency,
      date,
      fxAsOfByPair.get(buildPairKey(sourceCurrency, targetCurrency)) ?? new Map(),
      fxAsOfByPair.get(buildPairKey(targetCurrency, sourceCurrency)) ?? new Map()
    )
  ),
});

const safeFetchYahooDailySeries = async (
  providerKey: string,
  fromDate: string,
  toDate: string
) => {
  try {
    return await fetchYahooDailySeries(
      providerKey,
      fromDate,
      toDate,
      FETCH_TIMEOUT_MS
    );
  } catch (error) {
    // Backend resilience: benchmark overlays are optional, so provider failures
    // must not fail dashboard rendering.
    console.error("[portfolio][benchmarks] Yahoo daily fetch failed", {
      providerKey,
      fromDate,
      toDate,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export async function getDashboardBenchmarkSeries(
  supabase: SupabaseClient,
  bucketDates: readonly string[],
  options?: Readonly<{ benchmarkIds?: readonly BenchmarkId[] }>
): Promise<DashboardBenchmarkSeries> {
  if (bucketDates.length === 0) return emptyDashboardBenchmarkSeries();
  const requestedBenchmarkIds = options?.benchmarkIds ?? BENCHMARK_IDS;
  if (requestedBenchmarkIds.length === 0) {
    return emptyDashboardBenchmarkSeries(bucketDates);
  }

  const sortedBucketDates = [...bucketDates].sort((left, right) =>
    left.localeCompare(right)
  );
  const fromDate = sortedBucketDates[0];
  const toDate = sortedBucketDates.at(-1) ?? fromDate;
  const warmupFromDate = subtractIsoDays(fromDate, LOOKBACK_DAYS);

  const adminClient = tryCreateAdminClient();
  const reader = adminClient ?? supabase;

  const providerKeys = requestedBenchmarkIds.map((id) => BENCHMARK_PROVIDER_KEYS[id]);
  const cachedInstrumentRows = await readInstrumentRows(
    reader,
    providerKeys,
    warmupFromDate,
    toDate
  );

  const instrumentRowsGrouped = groupRowsByKey(
    cachedInstrumentRows.map((row) => ({
      providerKey: row.provider_key,
      row: toInstrumentSeriesRow(row),
    })),
    (entry) => entry.providerKey
  );
  const benchmarkRowsByProviderKey = new Map<string, InstrumentSeriesRow[]>();
  instrumentRowsGrouped.forEach((entries, providerKey) => {
    benchmarkRowsByProviderKey.set(
      providerKey,
      entries.map((entry) => entry.row)
    );
  });

  const instrumentUpserts: Array<Record<string, string | null>> = [];

  for (const benchmarkId of requestedBenchmarkIds) {
    const providerKey = BENCHMARK_PROVIDER_KEYS[benchmarkId];
    const rows = sortByDate(benchmarkRowsByProviderKey.get(providerKey) ?? []);
    benchmarkRowsByProviderKey.set(providerKey, rows);

    if (hasCoverage(rows.map((row) => row.date), fromDate, toDate)) continue;

    // Backend fetch: refill weak cache coverage with full daily history once.
    const fetched = await safeFetchYahooDailySeries(
      providerKey,
      warmupFromDate,
      toDate
    );
    if (!fetched) continue;

    const fetchedAt = new Date().toISOString();
    const fetchedSeriesRows = fetched.candles.map((candle) => ({
      date: candle.date,
      currency: fetched.currency.toUpperCase(),
      close: candle.close,
    }));
    const fetchedUpserts = fetched.candles.map((candle) => ({
      provider: PROVIDER,
      provider_key: providerKey,
      price_date: candle.date,
      exchange_timezone: fetched.exchangeTimezone,
      currency: fetched.currency.toUpperCase(),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      as_of: candle.asOf,
      fetched_at: fetchedAt,
    }));

    instrumentUpserts.push(...fetchedUpserts);
    benchmarkRowsByProviderKey.set(providerKey, sortByDate([...rows, ...fetchedSeriesRows]));
  }

  if (instrumentUpserts.length > 0 && adminClient) {
    const { error } = await adminClient.from("instrument_daily_prices_cache").upsert(
      instrumentUpserts,
      { onConflict: "provider,provider_key,price_date" }
    );
    if (error) throw new Error(error.message);
  }

  const sourceCurrencies = Array.from(
    new Set(
      Array.from(benchmarkRowsByProviderKey.values()).flatMap((rows) =>
        rows.map((row) => row.currency)
      )
    )
  );

  const fxCurrencies = Array.from(new Set([...sourceCurrencies, ...SNAPSHOT_CURRENCIES]));
  const cachedFxRows = await readFxRows(reader, fxCurrencies, warmupFromDate, toDate);

  const fxRowsByPair = groupRowsByKey(
    cachedFxRows.map((row) => ({
      pairKey: buildPairKey(
        row.base_currency.toUpperCase(),
        row.quote_currency.toUpperCase()
      ),
      row: toFxSeriesRow(row),
    })),
    (entry) => entry.pairKey
  );
  const normalizedFxRowsByPair = new Map<string, FxSeriesRow[]>();
  fxRowsByPair.forEach((entries, pairKey) => {
    normalizedFxRowsByPair.set(
      pairKey,
      entries.map((entry) => entry.row)
    );
  });

  const fxPairs = sourceCurrencies.flatMap((from) =>
    SNAPSHOT_CURRENCIES.filter((to) => to !== from).map((to) => ({ from, to }))
  );
  const pairsToFetch = new Set<string>();

  fxPairs.forEach(({ from, to }) => {
    const directKey = buildPairKey(from, to);
    const inverseKey = buildPairKey(to, from);
    const directRows = sortByDate(normalizedFxRowsByPair.get(directKey) ?? []);
    const inverseRows = sortByDate(normalizedFxRowsByPair.get(inverseKey) ?? []);

    normalizedFxRowsByPair.set(directKey, directRows);
    normalizedFxRowsByPair.set(inverseKey, inverseRows);

    const hasDirect = hasCoverage(directRows.map((row) => row.date), fromDate, toDate);
    const hasInverse = hasCoverage(inverseRows.map((row) => row.date), fromDate, toDate);

    if (!hasDirect && !hasInverse) {
      pairsToFetch.add(directKey);
      pairsToFetch.add(inverseKey);
    }
  });

  const fxUpserts: Array<Record<string, string>> = [];

  for (const pairKey of pairsToFetch) {
    const [from, to] = pairKey.split(":");

    // Backend fetch: request both directions so conversion can fallback to inverse.
    const fetched = await safeFetchYahooDailySeries(
      `${from}${to}=X`,
      warmupFromDate,
      toDate
    );
    if (!fetched) continue;

    const rows = normalizedFxRowsByPair.get(pairKey) ?? [];
    const fetchedAt = new Date().toISOString();

    const fetchedFxRows = fetched.candles.map((candle) => ({
      date: candle.date,
      rate: candle.close,
    }));
    const fetchedFxUpserts = fetched.candles.map((candle) => ({
      provider: PROVIDER,
      base_currency: from,
      quote_currency: to,
      rate_date: candle.date,
      source_timezone: fetched.exchangeTimezone,
      rate: candle.close,
      as_of: candle.asOf,
      fetched_at: fetchedAt,
    }));

    fxUpserts.push(...fetchedFxUpserts);
    normalizedFxRowsByPair.set(pairKey, sortByDate([...rows, ...fetchedFxRows]));
  }

  if (fxUpserts.length > 0 && adminClient) {
    const { error } = await adminClient.from("fx_daily_rates_cache").upsert(fxUpserts, {
      onConflict: "provider,base_currency,quote_currency,rate_date",
    });
    if (error) throw new Error(error.message);
  }

  const fxAsOfByPair = new Map<string, ReadonlyMap<string, FxSeriesRow | null>>();
  normalizedFxRowsByPair.forEach((rows, pairKey) => {
    fxAsOfByPair.set(pairKey, toAsOfFxMap(rows, sortedBucketDates));
  });

  const result: Record<BenchmarkId, InstrumentSeriesPoint[]> = {
    SP500: sortedBucketDates.map((date) => toEmptyBenchmarkPoint(date)),
    WIG20: sortedBucketDates.map((date) => toEmptyBenchmarkPoint(date)),
    MWIG40: sortedBucketDates.map((date) => toEmptyBenchmarkPoint(date)),
  };

  requestedBenchmarkIds.forEach((benchmarkId) => {
    const providerKey = BENCHMARK_PROVIDER_KEYS[benchmarkId];
    const rows = sortByDate(benchmarkRowsByProviderKey.get(providerKey) ?? []);
    const asOfByDate = toAsOfValueMap(rows, sortedBucketDates);

    result[benchmarkId] = sortedBucketDates.map((date) => {
      const point = asOfByDate.get(date) ?? null;
      if (!point) return toEmptyBenchmarkPoint(date);

      return toConvertedBenchmarkPoint(
        date,
        point.close,
        point.currency,
        fxAsOfByPair
      );
    });
  });

  return {
    SP500: result.SP500,
    WIG20: result.WIG20,
    MWIG40: result.MWIG40,
  };
}
