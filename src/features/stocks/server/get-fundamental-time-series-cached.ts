import type { createClient } from "@/lib/supabase/server";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { yahooFinance } from "@/lib/yahoo-finance-client";

import {
  buildTtmFromQuarterly,
  mergeSeriesWithPriority,
  parseFundamentalRows,
  unwrapYahooRows,
} from "./fundamental-time-series";
import type {
  FundamentalSeriesEvent,
  FundamentalSeriesMetric,
} from "./types";
import { toFiniteNumber, toIsoDate } from "./value-normalizers";

type SupabaseServerClient = ReturnType<typeof createClient>;

const PROVIDER = "yahoo";
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const INITIAL_LOOKBACK_DAYS = 420;
const ANNUAL_LOOKBACK_DAYS = 4 * 366;
const RECENT_BACKFILL_DAYS = 190;
const RECENT_ANNUAL_BACKFILL_DAYS = 2 * 366;

type CacheRow = Readonly<{
  provider: string;
  provider_key: string;
  metric: FundamentalSeriesMetric;
  period_end_date: string;
  period_type: string;
  value: number | string | null;
  source: string;
  fetched_at: string;
}>;

const subtractDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return toIsoDate(date);
};

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const latestFetchedAt = (rows: readonly CacheRow[]) =>
  rows.reduce<string | null>((latest, row) => {
    if (!latest) return row.fetched_at;
    return row.fetched_at > latest ? row.fetched_at : latest;
  }, null);

const normalizeCacheRows = (
  rows: readonly CacheRow[]
): FundamentalSeriesEvent[] =>
  rows.map((row) => ({
    periodEndDate: row.period_end_date,
    value: toFiniteNumber(row.value),
    periodType: row.period_type === "TTM_PROXY_ANNUAL" ? "TTM_PROXY_ANNUAL" : "TTM",
    source:
      row.source === "quarterly_rollup" ||
      row.source === "annual_proxy" ||
      row.source === "trailing"
        ? row.source
        : "trailing",
  }));

const hasCoverageForPeriodStart = (
  rows: readonly CacheRow[],
  periodStartDate: string
) => {
  if (rows.length === 0) return false;
  return rows[0].period_end_date <= periodStartDate;
};

const readCacheRows = async (
  supabase: SupabaseServerClient,
  providerKey: string,
  metric: FundamentalSeriesMetric
) => {
  const { data, error } = await supabase
    .from("instrument_fundamental_time_series_cache")
    .select(
      "provider,provider_key,metric,period_end_date,period_type,value,source,fetched_at"
    )
    .eq("provider", PROVIDER)
    .eq("provider_key", providerKey)
    .eq("metric", metric)
    .order("period_end_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CacheRow[];
};

const writeCacheRows = async (
  providerKey: string,
  metric: FundamentalSeriesMetric,
  rows: readonly FundamentalSeriesEvent[],
  fetchedAt: string
) => {
  const adminClient = tryCreateAdminClient();
  if (!adminClient || rows.length === 0) return;

  const payload = rows.map((row) => ({
    provider: PROVIDER,
    provider_key: providerKey,
    metric,
    period_end_date: row.periodEndDate,
    period_type: row.periodType,
    value: row.value,
    source: row.source,
    fetched_at: fetchedAt,
  }));

  const { error } = await adminClient
    .from("instrument_fundamental_time_series_cache")
    .upsert(payload, {
      onConflict: "provider,provider_key,metric,period_end_date",
    });

  if (error) {
    throw new Error(error.message);
  }
};

const mergeCachedAndFetched = (
  cached: readonly FundamentalSeriesEvent[],
  fetched: readonly FundamentalSeriesEvent[]
) => {
  const byDate = [...cached, ...fetched].reduce<Map<string, FundamentalSeriesEvent>>(
    (result, row) => {
      result.set(row.periodEndDate, row);
      return result;
    },
    new Map<string, FundamentalSeriesEvent>()
  );

  return Array.from(byDate.values()).sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );
};

type FetchWindow = Readonly<{
  fundamentalsFromDate: string;
  annualFromDate: string;
}>;

const resolveFetchWindow = (
  cachedRows: readonly CacheRow[],
  periodStartDate: string,
  hasRequestedCoverage: boolean
): FetchWindow => {
  if (!hasRequestedCoverage || cachedRows.length === 0) {
    return {
      fundamentalsFromDate: subtractDays(periodStartDate, INITIAL_LOOKBACK_DAYS),
      annualFromDate: subtractDays(periodStartDate, ANNUAL_LOOKBACK_DAYS),
    };
  }

  const latestPeriodEndDate = cachedRows[cachedRows.length - 1].period_end_date;
  return {
    fundamentalsFromDate: subtractDays(latestPeriodEndDate, RECENT_BACKFILL_DAYS),
    annualFromDate: subtractDays(latestPeriodEndDate, RECENT_ANNUAL_BACKFILL_DAYS),
  };
};

export async function getFundamentalTimeSeriesCached(
  supabase: SupabaseServerClient,
  providerKey: string,
  metric: FundamentalSeriesMetric,
  periodStartDate: string,
  options?: Readonly<{ ttlMs?: number }>
): Promise<readonly FundamentalSeriesEvent[]> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const cachedRows = await readCacheRows(supabase, providerKey, metric);
  const hasRequestedCoverage = hasCoverageForPeriodStart(
    cachedRows,
    periodStartDate
  );
  const newestFetchedAt = latestFetchedAt(cachedRows);

  if (newestFetchedAt && isFresh(newestFetchedAt, ttlMs) && hasRequestedCoverage) {
    return normalizeCacheRows(cachedRows);
  }

  const fetchWindow = resolveFetchWindow(
    cachedRows,
    periodStartDate,
    hasRequestedCoverage
  );

  try {
    // Fetch trailing TTM snapshots first because this is the highest-fidelity source.
    const trailingRaw = await yahooFinance.fundamentalsTimeSeries(
      providerKey,
      {
        period1: fetchWindow.fundamentalsFromDate,
        type: "trailing",
        module: "financials",
      },
      { validateResult: false }
    );
    const trailingEvents = parseFundamentalRows(unwrapYahooRows(trailingRaw), {
      metric,
      source: "trailing",
      outputPeriodType: "TTM",
    });

    // Quarterly points let us rebuild TTM when trailing snapshots are sparse.
    const quarterlyRaw = await yahooFinance.fundamentalsTimeSeries(
      providerKey,
      {
        period1: fetchWindow.fundamentalsFromDate,
        type: "quarterly",
        module: "financials",
      },
      { validateResult: false }
    );
    const quarterlyEvents = parseFundamentalRows(unwrapYahooRows(quarterlyRaw), {
      metric,
      source: "quarterly_rollup",
      outputPeriodType: "TTM",
      expectedPeriodType: "3M",
    });
    const quarterlyTtmEvents = buildTtmFromQuarterly(quarterlyEvents);

    // Annual proxy gives older context when TTM sources are unavailable.
    const annualRaw = await yahooFinance.fundamentalsTimeSeries(
      providerKey,
      {
        period1: fetchWindow.annualFromDate,
        type: "annual",
        module: "financials",
      },
      { validateResult: false }
    );
    const annualProxyEvents = parseFundamentalRows(unwrapYahooRows(annualRaw), {
      metric,
      source: "annual_proxy",
      outputPeriodType: "TTM_PROXY_ANNUAL",
      expectedPeriodType: "12M",
      skipFutureDates: true,
    });

    const fetchedMerged = mergeSeriesWithPriority([
      trailingEvents,
      quarterlyTtmEvents,
      annualProxyEvents,
    ]);
    const merged = mergeCachedAndFetched(normalizeCacheRows(cachedRows), fetchedMerged);
    const fetchedAt = new Date().toISOString();

    await writeCacheRows(providerKey, metric, merged, fetchedAt);
    return merged;
  } catch (error) {
    if (cachedRows.length > 0) {
      return normalizeCacheRows(cachedRows);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
}
