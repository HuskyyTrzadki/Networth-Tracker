import type { SupabaseClient } from "@supabase/supabase-js";

import { tryCreateAdminClient } from "@/lib/supabase/admin";

import { subtractIsoDays } from "./lib/date-utils";
import { fetchYahooDailySeries } from "./providers/yahoo/yahoo-daily";
import type { InstrumentDailyPrice, InstrumentQuoteRequest } from "./types";

type SupabaseServerClient = SupabaseClient;

const PROVIDER = "yahoo";
const DEFAULT_LOOKBACK_DAYS = 21;
const DEFAULT_TIMEOUT_MS = 5000;

type DailyPriceCacheRow = Readonly<{
  provider: string;
  provider_key: string;
  price_date: string;
  exchange_timezone: string;
  currency: string;
  open: string | number | null;
  high: string | number | null;
  low: string | number | null;
  close: string | number;
  adj_close?: string | number | null;
  as_of: string;
  fetched_at: string;
}>;

type CacheUpsertRow = Readonly<{
  provider: string;
  provider_key: string;
  price_date: string;
  exchange_timezone: string;
  currency: string;
  open: string | null;
  high: string | null;
  low: string | null;
  close: string;
  adj_close: string | null;
  volume: string | null;
  as_of: string;
  fetched_at: string;
}>;

const normalizeNullableNumeric = (value: string | number | null) => {
  if (value === null) return null;
  return typeof value === "number" ? value.toString() : value;
};

const normalizeRequiredNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const buildResult = (
  instrumentId: string,
  row: DailyPriceCacheRow,
  requestedDate: string
): InstrumentDailyPrice => ({
  instrumentId,
  currency: row.currency,
  marketDate: row.price_date,
  exchangeTimezone: row.exchange_timezone,
  open: normalizeNullableNumeric(row.open),
  high: normalizeNullableNumeric(row.high),
  low: normalizeNullableNumeric(row.low),
  close: normalizeRequiredNumeric(row.close),
  asOf: row.as_of,
  fetchedAt: row.fetched_at,
  isFilledFromPreviousSession: row.price_date !== requestedDate,
});

const readCachedRows = async (
  supabase: SupabaseServerClient,
  providerKeys: readonly string[],
  fromDate: string,
  toDate: string
) => {
  const { data, error } = await supabase
    .from("instrument_daily_prices_cache")
    .select(
      "provider,provider_key,price_date,exchange_timezone,currency,open,high,low,close,adj_close,as_of,fetched_at"
    )
    .eq("provider", PROVIDER)
    .in("provider_key", providerKeys)
    .gte("price_date", fromDate)
    .lte("price_date", toDate)
    .order("price_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DailyPriceCacheRow[];
};

const pickLatestRowsForRequestedDate = (
  rows: readonly DailyPriceCacheRow[],
  requestedDate: string
) => {
  const latestByKey = new Map<string, DailyPriceCacheRow>();

  rows.forEach((row) => {
    // As-of semantics: only use sessions that are on/before requested valuation date.
    if (row.price_date > requestedDate) {
      return;
    }

    if (!latestByKey.has(row.provider_key)) {
      latestByKey.set(row.provider_key, row);
    }
  });

  return latestByKey;
};

const fetchAndCacheMissingRows = async (
  providerKeys: readonly string[],
  fromDate: string,
  toDate: string,
  timeoutMs: number
) => {
  const fetchedAt = new Date().toISOString();
  const fetchedRows: DailyPriceCacheRow[] = [];
  const upserts: CacheUpsertRow[] = [];

  // Backend batch: fetch full daily series once per symbol, then persist globally.
  for (const providerKey of providerKeys) {
    const series = await fetchYahooDailySeries(
      providerKey,
      fromDate,
      toDate,
      timeoutMs
    );

    if (!series) continue;

    series.candles.forEach((candle) => {
      upserts.push({
        provider: PROVIDER,
        provider_key: providerKey,
        price_date: candle.date,
        exchange_timezone: series.exchangeTimezone,
        currency: series.currency,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        adj_close: candle.adjClose,
        volume: candle.volume,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });

      fetchedRows.push({
        provider: PROVIDER,
        provider_key: providerKey,
        price_date: candle.date,
        exchange_timezone: series.exchangeTimezone,
        currency: series.currency,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        adj_close: candle.adjClose,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });
  }

  if (upserts.length > 0) {
    const adminClient = tryCreateAdminClient();
    if (adminClient) {
      const { error } = await adminClient
        .from("instrument_daily_prices_cache")
        .upsert(upserts, {
          onConflict: "provider,provider_key,price_date",
        });

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  return fetchedRows;
};

export async function getInstrumentDailyPricesCached(
  supabase: SupabaseServerClient,
  requests: readonly InstrumentQuoteRequest[],
  priceDate: string,
  options?: Readonly<{
    lookbackDays?: number;
    fetchRangeStart?: string;
    fetchRangeEnd?: string;
    timeoutMs?: number;
  }>
): Promise<ReadonlyMap<string, InstrumentDailyPrice | null>> {
  const results = new Map<string, InstrumentDailyPrice | null>();
  if (requests.length === 0) return results;

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fromDate =
    options?.fetchRangeStart ??
    subtractIsoDays(priceDate, options?.lookbackDays ?? DEFAULT_LOOKBACK_DAYS);
  const toDate = options?.fetchRangeEnd ?? priceDate;

  const uniqueProviderKeys = Array.from(
    new Set(
      requests
        .filter((request) => request.provider === PROVIDER)
        .map((request) => request.providerKey)
    )
  );

  if (uniqueProviderKeys.length === 0) {
    requests.forEach((request) => {
      results.set(request.instrumentId, null);
    });
    return results;
  }

  const cachedRows = await readCachedRows(
    supabase,
    uniqueProviderKeys,
    fromDate,
    toDate
  );
  const latestByKey = pickLatestRowsForRequestedDate(cachedRows, priceDate);

  const missingProviderKeys = uniqueProviderKeys.filter(
    (providerKey) => !latestByKey.has(providerKey)
  );

  if (missingProviderKeys.length > 0) {
    const fetchedRows = await fetchAndCacheMissingRows(
      missingProviderKeys,
      fromDate,
      toDate,
      timeoutMs
    );

    const fetchedLatestByKey = pickLatestRowsForRequestedDate(
      fetchedRows.sort((a, b) => b.price_date.localeCompare(a.price_date)),
      priceDate
    );

    fetchedLatestByKey.forEach((row, providerKey) => {
      latestByKey.set(providerKey, row);
    });
  }

  requests.forEach((request) => {
    const row = latestByKey.get(request.providerKey);
    if (!row) {
      results.set(request.instrumentId, null);
      return;
    }

    results.set(request.instrumentId, buildResult(request.instrumentId, row, priceDate));
  });

  return results;
}

export const __test__ = {
  pickLatestRowsForRequestedDate,
};
