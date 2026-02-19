import type { SupabaseClient } from "@supabase/supabase-js";

import type { FxPair, InstrumentQuoteRequest } from "@/features/market-data";
import { fetchYahooDailySeries } from "@/features/market-data/server/providers/yahoo/yahoo-daily";
import { subtractIsoDays } from "@/features/market-data/server/lib/date-utils";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { Database, Tables, TablesInsert } from "@/lib/supabase/database.types";
import { hasSufficientDailyCoverage } from "./range-market-data-coverage";

const DEFAULT_LOOKBACK_DAYS = 45;
const DEFAULT_TIMEOUT_MS = 5000;

type InstrumentDailyRow = Pick<
  Tables<"instrument_daily_prices_cache">,
  | "provider_key"
  | "price_date"
  | "exchange_timezone"
  | "currency"
  | "open"
  | "high"
  | "low"
  | "close"
  | "adj_close"
  | "as_of"
  | "fetched_at"
>;

type FxDailyRow = Pick<
  Tables<"fx_daily_rates_cache">,
  "base_currency" | "quote_currency" | "rate_date" | "rate" | "as_of" | "fetched_at"
>;

type InstrumentDailyUpsertRow = TablesInsert<"instrument_daily_prices_cache">;
type FxDailyUpsertRow = TablesInsert<"fx_daily_rates_cache">;

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

const toFiniteNumber = (value: string | number | null) => {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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
  supabase: SupabaseClient<Database>,
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
      "provider_key,price_date,exchange_timezone,currency,open,high,low,close,adj_close,as_of,fetched_at"
    )
    .eq("provider", "yahoo")
    .in("provider_key", providerKeys)
    .gte("price_date", fromDate)
    .lte("price_date", toDate);

  if (error) {
    throw new Error(error.message);
  }

  const rows: InstrumentDailyRow[] = data ?? [];
  return rows;
}

async function readFxRows(
  supabase: SupabaseClient<Database>,
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

  const rows: FxDailyRow[] = data ?? [];
  return rows;
}

export async function preloadInstrumentDailySeries(
  supabase: SupabaseClient<Database>,
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
  const upsertRows: InstrumentDailyUpsertRow[] = [];
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
      const close = toFiniteNumber(candle.close);
      if (close === null) return;

      fetchedRows.push({
        provider_key: providerKey,
        price_date: candle.date,
        exchange_timezone: series.exchangeTimezone,
        currency: series.currency,
        open: toFiniteNumber(candle.open),
        high: toFiniteNumber(candle.high),
        low: toFiniteNumber(candle.low),
        close,
        adj_close: toFiniteNumber(candle.adjClose),
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });

      upsertRows.push({
        provider: "yahoo",
        provider_key: providerKey,
        price_date: candle.date,
        exchange_timezone: series.exchangeTimezone,
        currency: series.currency,
        open: toFiniteNumber(candle.open),
        high: toFiniteNumber(candle.high),
        low: toFiniteNumber(candle.low),
        close,
        adj_close: toFiniteNumber(candle.adjClose),
        volume: toFiniteNumber(candle.volume),
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });
  }

  if (upsertRows.length > 0) {
    const adminClient = tryCreateAdminClient();
    const writer = adminClient ?? supabase;
    const { error } = await writer
      .from("instrument_daily_prices_cache")
      .upsert(upsertRows, {
        onConflict: "provider,provider_key,price_date",
      });

    // User-scoped clients can read cache rows via RLS but cannot write.
    // If service-role client is unavailable, keep the request successful
    // and continue with in-memory fetched rows.
    if (error && adminClient) {
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
  supabase: SupabaseClient<Database>,
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
  const upsertRows: FxDailyUpsertRow[] = [];
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
      const rate = toFiniteNumber(candle.close);
      if (rate === null) return;

      fetchedRows.push({
        base_currency: from,
        quote_currency: to,
        rate_date: candle.date,
        rate,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });

      upsertRows.push({
        provider: "yahoo",
        base_currency: from,
        quote_currency: to,
        rate_date: candle.date,
        source_timezone: series.exchangeTimezone,
        rate,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });
  }

  if (upsertRows.length > 0) {
    const adminClient = tryCreateAdminClient();
    const writer = adminClient ?? supabase;
    const { error } = await writer.from("fx_daily_rates_cache").upsert(upsertRows, {
      onConflict: "provider,base_currency,quote_currency,rate_date",
    });

    // User-scoped clients can read cache rows via RLS but cannot write.
    // If service-role client is unavailable, keep the request successful
    // and continue with in-memory fetched rows.
    if (error && adminClient) {
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
