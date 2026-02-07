import type { SupabaseClient } from "@supabase/supabase-js";

import type { FxPair, InstrumentQuoteRequest } from "@/features/market-data";
import { fetchYahooDailySeries } from "@/features/market-data/server/providers/yahoo/yahoo-daily";
import { subtractIsoDays } from "@/features/market-data/server/lib/date-utils";
import { hasSufficientDailyCoverage } from "./range-market-data-coverage";

const DEFAULT_LOOKBACK_DAYS = 45;
const DEFAULT_TIMEOUT_MS = 5000;

type InstrumentDailyRow = Readonly<{
  provider_key: string;
  price_date: string;
  exchange_timezone: string;
  currency: string;
  open: string | number | null;
  high: string | number | null;
  low: string | number | null;
  close: string | number;
  as_of: string;
  fetched_at: string;
}>;

type FxDailyRow = Readonly<{
  base_currency: string;
  quote_currency: string;
  rate_date: string;
  rate: string | number;
  as_of: string;
  fetched_at: string;
}>;

const buildPairKey = (from: string, to: string) => `${from}:${to}`;

const buildFxSymbol = (from: string, to: string) => `${from}${to}=X`.toUpperCase();

const buildRowsByKey = <T,>(rows: readonly T[], getKey: (row: T) => string) => {
  const byKey = new Map<string, T[]>();

  rows.forEach((row) => {
    const key = getKey(row);
    const existing = byKey.get(key);
    if (existing) {
      existing.push(row);
      return;
    }

    byKey.set(key, [row]);
  });

  return byKey;
};

const sortByDateAsc = <T,>(rows: readonly T[], pickDate: (row: T) => string) =>
  [...rows].sort((left, right) => pickDate(left).localeCompare(pickDate(right)));

const mergeRowMaps = <T,>(
  left: ReadonlyMap<string, readonly T[]>,
  right: ReadonlyMap<string, readonly T[]>,
  pickDate: (row: T) => string
) => {
  const merged = new Map<string, readonly T[]>();
  const keys = new Set([...left.keys(), ...right.keys()]);

  keys.forEach((key) => {
    const combined = [...(left.get(key) ?? []), ...(right.get(key) ?? [])];
    if (combined.length === 0) {
      return;
    }

    merged.set(key, sortByDateAsc(combined, pickDate));
  });

  return merged;
};

async function readInstrumentRows(
  supabase: SupabaseClient,
  providerKeys: readonly string[],
  fromDate: string,
  toDate: string
) {
  if (providerKeys.length === 0) {
    return [] as InstrumentDailyRow[];
  }

  const { data, error } = await supabase
    .from("instrument_daily_prices_cache")
    .select(
      "provider_key,price_date,exchange_timezone,currency,open,high,low,close,as_of,fetched_at"
    )
    .eq("provider", "yahoo")
    .in("provider_key", providerKeys)
    .gte("price_date", fromDate)
    .lte("price_date", toDate);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InstrumentDailyRow[];
}

async function readFxRows(
  supabase: SupabaseClient,
  currencies: readonly string[],
  fromDate: string,
  toDate: string
) {
  if (currencies.length === 0) {
    return [] as FxDailyRow[];
  }

  const { data, error } = await supabase
    .from("fx_daily_rates_cache")
    .select("base_currency,quote_currency,rate_date,rate,as_of,fetched_at")
    .eq("provider", "yahoo")
    .in("base_currency", currencies)
    .in("quote_currency", currencies)
    .gte("rate_date", fromDate)
    .lte("rate_date", toDate);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FxDailyRow[];
}

export async function preloadInstrumentDailySeries(
  supabase: SupabaseClient,
  requests: readonly InstrumentQuoteRequest[],
  fromDate: string,
  toDate: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const uniqueKeys = Array.from(
    new Set(requests.map((request) => request.providerKey))
  );

  const warmupFromDate = subtractIsoDays(fromDate, DEFAULT_LOOKBACK_DAYS);
  const cachedRows = await readInstrumentRows(
    supabase,
    uniqueKeys,
    warmupFromDate,
    toDate
  );

  const cachedByKey = buildRowsByKey(cachedRows, (row) => row.provider_key);
  const keysToFetch = uniqueKeys.filter((key) => {
    const rows = sortByDateAsc(cachedByKey.get(key) ?? [], (row) => row.price_date);
    return !hasSufficientDailyCoverage(
      rows.map((row) => ({ date: row.price_date })),
      fromDate,
      toDate
    );
  });

  const fetchedRows: InstrumentDailyRow[] = [];
  const upsertRows: Array<Record<string, string | null>> = [];
  const fetchedAt = new Date().toISOString();

  for (const providerKey of keysToFetch) {
    const series = await fetchYahooDailySeries(
      providerKey,
      warmupFromDate,
      toDate,
      timeoutMs
    );

    if (!series) {
      continue;
    }

    series.candles.forEach((candle) => {
      fetchedRows.push({
        provider_key: providerKey,
        price_date: candle.date,
        exchange_timezone: series.exchangeTimezone,
        currency: series.currency,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });

      upsertRows.push({
        provider: "yahoo",
        provider_key: providerKey,
        price_date: candle.date,
        exchange_timezone: series.exchangeTimezone,
        currency: series.currency,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });
  }

  if (upsertRows.length > 0) {
    const { error } = await supabase
      .from("instrument_daily_prices_cache")
      .upsert(upsertRows, {
        onConflict: "provider,provider_key,price_date",
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  const fetchedByKey = buildRowsByKey(fetchedRows, (row) => row.provider_key);
  return mergeRowMaps(
    new Map(
      Array.from(cachedByKey.entries()).map(([key, rows]) => [
        key,
        sortByDateAsc(rows, (row) => row.price_date),
      ])
    ),
    new Map(
      Array.from(fetchedByKey.entries()).map(([key, rows]) => [
        key,
        sortByDateAsc(rows, (row) => row.price_date),
      ])
    ),
    (row) => row.price_date
  );
}

export async function preloadFxDailySeries(
  supabase: SupabaseClient,
  pairs: readonly FxPair[],
  fromDate: string,
  toDate: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const currencies = Array.from(
    new Set(pairs.flatMap((pair) => [pair.from.toUpperCase(), pair.to.toUpperCase()]))
  );
  const warmupFromDate = subtractIsoDays(fromDate, DEFAULT_LOOKBACK_DAYS);
  const cachedRows = await readFxRows(supabase, currencies, warmupFromDate, toDate);
  const cachedByPair = buildRowsByKey(
    cachedRows,
    (row) => `${row.base_currency}:${row.quote_currency}`
  );

  const hasCoverageForPair = (pair: FxPair) => {
    const direct = sortByDateAsc(
      cachedByPair.get(buildPairKey(pair.from, pair.to)) ?? [],
      (row) => row.rate_date
    );
    const inverse = sortByDateAsc(
      cachedByPair.get(buildPairKey(pair.to, pair.from)) ?? [],
      (row) => row.rate_date
    );

    return (
      hasSufficientDailyCoverage(
        direct.map((row) => ({ date: row.rate_date })),
        fromDate,
        toDate
      ) ||
      hasSufficientDailyCoverage(
        inverse.map((row) => ({ date: row.rate_date })),
        fromDate,
        toDate
      )
    );
  };

  const pairsToFetch = pairs.filter((pair) => !hasCoverageForPair(pair));
  const uniquePairKeys = new Set<string>();
  pairsToFetch.forEach((pair) => {
    uniquePairKeys.add(buildPairKey(pair.from, pair.to));
    uniquePairKeys.add(buildPairKey(pair.to, pair.from));
  });

  const fetchedRows: FxDailyRow[] = [];
  const upsertRows: Array<Record<string, string>> = [];
  const fetchedAt = new Date().toISOString();

  for (const pairKey of uniquePairKeys) {
    const [from, to] = pairKey.split(":");
    const series = await fetchYahooDailySeries(
      buildFxSymbol(from, to),
      warmupFromDate,
      toDate,
      timeoutMs
    );

    if (!series) {
      continue;
    }

    series.candles.forEach((candle) => {
      fetchedRows.push({
        base_currency: from,
        quote_currency: to,
        rate_date: candle.date,
        rate: candle.close,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });

      upsertRows.push({
        provider: "yahoo",
        base_currency: from,
        quote_currency: to,
        rate_date: candle.date,
        source_timezone: series.exchangeTimezone,
        rate: candle.close,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });
  }

  if (upsertRows.length > 0) {
    const { error } = await supabase.from("fx_daily_rates_cache").upsert(upsertRows, {
      onConflict: "provider,base_currency,quote_currency,rate_date",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const fetchedByPair = buildRowsByKey(
    fetchedRows,
    (row) => `${row.base_currency}:${row.quote_currency}`
  );

  return mergeRowMaps(
    new Map(
      Array.from(cachedByPair.entries()).map(([key, rows]) => [
        key,
        sortByDateAsc(rows, (row) => row.rate_date),
      ])
    ),
    new Map(
      Array.from(fetchedByPair.entries()).map(([key, rows]) => [
        key,
        sortByDateAsc(rows, (row) => row.rate_date),
      ])
    ),
    (row) => row.rate_date
  );
}

export type {
  InstrumentDailyRow,
  FxDailyRow,
};
