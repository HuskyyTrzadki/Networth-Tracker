import type { SupabaseClient } from "@supabase/supabase-js";

import { decimalOne, divideDecimals, parseDecimalString } from "@/lib/decimal";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

import { subtractIsoDays } from "./lib/date-utils";
import { fetchYahooDailySeries } from "./providers/yahoo/yahoo-daily";
import type { FxDailyRate, FxPair } from "./types";

type SupabaseServerClient = SupabaseClient;

const PROVIDER = "yahoo";
const DEFAULT_LOOKBACK_DAYS = 21;
const DEFAULT_TIMEOUT_MS = 5000;

type DailyFxCacheRow = Readonly<{
  provider: string;
  base_currency: string;
  quote_currency: string;
  rate_date: string;
  source_timezone: string;
  rate: string | number;
  as_of: string;
  fetched_at: string;
}>;

type FxCacheUpsertRow = Readonly<{
  provider: string;
  base_currency: string;
  quote_currency: string;
  rate_date: string;
  source_timezone: string;
  rate: string;
  as_of: string;
  fetched_at: string;
}>;

const buildFxSymbol = (from: string, to: string) => `${from}${to}=X`.toUpperCase();

const normalizeRate = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const toDirectRate = (
  row: DailyFxCacheRow,
  requestedDate: string,
  source: "direct" | "inverted"
): FxDailyRate => ({
  from: row.base_currency,
  to: row.quote_currency,
  rateDate: row.rate_date,
  rate: normalizeRate(row.rate),
  asOf: row.as_of,
  fetchedAt: row.fetched_at,
  source,
  isFilledFromPreviousSession: row.rate_date !== requestedDate,
});

const toInvertedRate = (
  row: DailyFxCacheRow,
  pair: FxPair,
  requestedDate: string
): FxDailyRate | null => {
  const rateDecimal = parseDecimalString(row.rate);
  if (!rateDecimal) {
    return null;
  }

  return {
    from: pair.from,
    to: pair.to,
    rateDate: row.rate_date,
    rate: divideDecimals(decimalOne(), rateDecimal).toString(),
    asOf: row.as_of,
    fetchedAt: row.fetched_at,
    source: "inverted",
    isFilledFromPreviousSession: row.rate_date !== requestedDate,
  };
};

const pickLatestRowsByPairForRequestedDate = (
  rows: readonly DailyFxCacheRow[],
  requestedDate: string
) => {
  const byPair = new Map<string, DailyFxCacheRow>();

  rows.forEach((row) => {
    // As-of semantics: only use rates available on/before requested valuation date.
    if (row.rate_date > requestedDate) {
      return;
    }

    const key = `${row.base_currency}:${row.quote_currency}`;
    if (!byPair.has(key)) {
      byPair.set(key, row);
    }
  });

  return byPair;
};

const readCachedRows = async (
  supabase: SupabaseServerClient,
  pairs: readonly FxPair[],
  fromDate: string,
  toDate: string
) => {
  const currencies = Array.from(
    new Set(
      pairs.flatMap((pair) => [pair.from.toUpperCase(), pair.to.toUpperCase()])
    )
  );

  const { data, error } = await supabase
    .from("fx_daily_rates_cache")
    .select(
      "provider,base_currency,quote_currency,rate_date,source_timezone,rate,as_of,fetched_at"
    )
    .eq("provider", PROVIDER)
    .in("base_currency", currencies)
    .in("quote_currency", currencies)
    .gte("rate_date", fromDate)
    .lte("rate_date", toDate)
    .order("rate_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DailyFxCacheRow[];
};

const fetchAndCacheRows = async (
  pairs: readonly FxPair[],
  fromDate: string,
  toDate: string,
  timeoutMs: number
) => {
  const fetchedAt = new Date().toISOString();
  const upserts: FxCacheUpsertRow[] = [];
  const fetchedRows: DailyFxCacheRow[] = [];

  // Backend fetch: fetch direct and inverse symbols so inversion has historical depth.
  const pairsToFetch = new Map<string, FxPair>();
  pairs.forEach((pair) => {
    const direct = {
      from: pair.from.toUpperCase(),
      to: pair.to.toUpperCase(),
    };
    const inverse = {
      from: pair.to.toUpperCase(),
      to: pair.from.toUpperCase(),
    };

    pairsToFetch.set(`${direct.from}:${direct.to}`, direct);
    pairsToFetch.set(`${inverse.from}:${inverse.to}`, inverse);
  });

  for (const pair of pairsToFetch.values()) {
    const symbol = buildFxSymbol(pair.from, pair.to);
    const series = await fetchYahooDailySeries(symbol, fromDate, toDate, timeoutMs);

    if (!series) {
      continue;
    }

    series.candles.forEach((candle) => {
      upserts.push({
        provider: PROVIDER,
        base_currency: pair.from,
        quote_currency: pair.to,
        rate_date: candle.date,
        source_timezone: series.exchangeTimezone,
        rate: candle.close,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });

      fetchedRows.push({
        provider: PROVIDER,
        base_currency: pair.from,
        quote_currency: pair.to,
        rate_date: candle.date,
        source_timezone: series.exchangeTimezone,
        rate: candle.close,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });
  }

  if (upserts.length > 0) {
    const adminClient = tryCreateAdminClient();
    if (adminClient) {
      const { error } = await adminClient
        .from("fx_daily_rates_cache")
        .upsert(upserts, {
          onConflict: "provider,base_currency,quote_currency,rate_date",
        });

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  return fetchedRows;
};

export async function getFxDailyRatesCached(
  supabase: SupabaseServerClient,
  pairs: readonly FxPair[],
  priceDate: string,
  options?: Readonly<{
    lookbackDays?: number;
    fetchRangeStart?: string;
    fetchRangeEnd?: string;
    timeoutMs?: number;
  }>
): Promise<ReadonlyMap<string, FxDailyRate | null>> {
  const results = new Map<string, FxDailyRate | null>();
  if (pairs.length === 0) {
    return results;
  }

  const normalizedPairs = pairs
    .map((pair) => ({
      from: pair.from.toUpperCase(),
      to: pair.to.toUpperCase(),
    }))
    .filter((pair) => pair.from !== pair.to);

  if (normalizedPairs.length === 0) {
    return results;
  }

  const fromDate =
    options?.fetchRangeStart ??
    subtractIsoDays(priceDate, options?.lookbackDays ?? DEFAULT_LOOKBACK_DAYS);
  const toDate = options?.fetchRangeEnd ?? priceDate;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const cachedRows = await readCachedRows(supabase, normalizedPairs, fromDate, toDate);
  const latestByPair = pickLatestRowsByPairForRequestedDate(cachedRows, priceDate);

  const unresolvedPairs: FxPair[] = [];

  normalizedPairs.forEach((pair) => {
    const directKey = `${pair.from}:${pair.to}`;
    const directRow = latestByPair.get(directKey);
    if (directRow) {
      results.set(directKey, toDirectRate(directRow, priceDate, "direct"));
      return;
    }

    const inverseKey = `${pair.to}:${pair.from}`;
    const inverseRow = latestByPair.get(inverseKey);
    if (inverseRow) {
      results.set(directKey, toInvertedRate(inverseRow, pair, priceDate));
      return;
    }

    unresolvedPairs.push(pair);
  });

  if (unresolvedPairs.length > 0) {
    const fetchedRows = await fetchAndCacheRows(
      unresolvedPairs,
      fromDate,
      toDate,
      timeoutMs
    );

    const fetchedLatest = pickLatestRowsByPairForRequestedDate(
      fetchedRows.sort((a, b) => b.rate_date.localeCompare(a.rate_date)),
      priceDate
    );

    unresolvedPairs.forEach((pair) => {
      const key = `${pair.from}:${pair.to}`;
      const directRow = fetchedLatest.get(key);
      if (directRow) {
        results.set(key, toDirectRate(directRow, priceDate, "direct"));
        return;
      }

      const inverseRow = fetchedLatest.get(`${pair.to}:${pair.from}`);
      if (inverseRow) {
        results.set(key, toInvertedRate(inverseRow, pair, priceDate));
        return;
      }

      results.set(key, null);
    });
  }

  return results;
}

export const __test__ = {
  pickLatestRowsByPairForRequestedDate,
};
