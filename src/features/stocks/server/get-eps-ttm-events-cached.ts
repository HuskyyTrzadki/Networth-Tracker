import type { createClient } from "@/lib/supabase/server";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { yahooFinance } from "@/lib/yahoo-finance-client";

import {
  buildApproxTtmEventsFromAnnual,
  buildTtmEventsFromQuarterly,
  extractEpsFromRow,
  mergeEpsEventsWithPriority,
  parseAnnualRows,
  parseQuarterlyRows,
  parseYahooRows,
  toIsoDate,
  toNumberOrNull,
  unwrapYahooRows,
} from "./eps-events";
import type { EpsTtmEvent } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

const PROVIDER = "yahoo";
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EPS_LOOKBACK_DAYS = 400;
const ANNUAL_LOOKBACK_DAYS = 2 * 366;
const isStocksPeDebugEnabled =
  process.env.DEBUG_STOCKS_PE === "1" && process.env.NODE_ENV !== "production";

type CacheRow = Readonly<{
  provider: string;
  provider_key: string;
  period_end_date: string;
  eps_ttm: number | string | null;
  fetched_at: string;
}>;

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const subtractDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return toIsoDate(date);
};

const readCacheRows = async (
  supabase: SupabaseServerClient,
  providerKey: string
) => {
  const { data, error } = await supabase
    .from("instrument_eps_ttm_events_cache")
    .select("provider,provider_key,period_end_date,eps_ttm,fetched_at")
    .eq("provider", PROVIDER)
    .eq("provider_key", providerKey)
    .order("period_end_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CacheRow[];
};

const normalizeCacheRows = (rows: readonly CacheRow[]): EpsTtmEvent[] =>
  rows.map((row) => ({
    periodEndDate: row.period_end_date,
    epsTtm: toNumberOrNull(row.eps_ttm),
  }));

const hasSuspiciousEpochDates = (rows: readonly CacheRow[]) =>
  rows.some((row) => row.period_end_date < "1990-01-01");

const hasCoverageForPeriodStart = (
  rows: readonly CacheRow[],
  periodStartDate: string
) => {
  if (rows.length === 0) return false;
  const earliestDate = rows[0].period_end_date;
  return earliestDate <= periodStartDate;
};


const logEpsDebug = (
  providerKey: string,
  event: string,
  payload: Readonly<Record<string, unknown>>
) => {
  if (!isStocksPeDebugEnabled) return;
  console.info(`[stocks][eps][${providerKey}][${event}]`, payload);
};

const writeCacheRows = async (
  providerKey: string,
  rows: readonly EpsTtmEvent[],
  fetchedAt: string
) => {
  const adminClient = tryCreateAdminClient();
  if (!adminClient || rows.length === 0) return;

  const payload = rows.map((row) => ({
    provider: PROVIDER,
    provider_key: providerKey,
    period_end_date: row.periodEndDate,
    eps_ttm: row.epsTtm,
    source: "fundamentalsTimeSeries",
    fetched_at: fetchedAt,
  }));

  const { error } = await adminClient
    .from("instrument_eps_ttm_events_cache")
    .upsert(payload, {
      onConflict: "provider,provider_key,period_end_date",
    });

  if (error) {
    throw new Error(error.message);
  }
};

export async function getEpsTtmEventsCached(
  supabase: SupabaseServerClient,
  providerKey: string,
  periodStartDate: string,
  options?: Readonly<{ ttlMs?: number }>
): Promise<readonly EpsTtmEvent[]> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const cachedRows = await readCacheRows(supabase, providerKey);
  const latestFetchedAt = cachedRows[cachedRows.length - 1]?.fetched_at ?? null;
  const needsCacheRepair = hasSuspiciousEpochDates(cachedRows);
  const hasRequestedCoverage = hasCoverageForPeriodStart(
    cachedRows,
    periodStartDate
  );

  if (
    latestFetchedAt &&
    isFresh(latestFetchedAt, ttlMs) &&
    !needsCacheRepair &&
    hasRequestedCoverage
  ) {
    return normalizeCacheRows(cachedRows);
  }

  const fetchFromDate = subtractDays(periodStartDate, EPS_LOOKBACK_DAYS);
  const annualFetchFromDate = subtractDays(periodStartDate, ANNUAL_LOOKBACK_DAYS);

  try {
    // Backend fetch: trailing financials gives direct TTM EPS snapshots.
    const trailingRaw = await yahooFinance.fundamentalsTimeSeries(
      providerKey,
      {
        period1: fetchFromDate,
        type: "trailing",
        module: "financials",
      },
      { validateResult: false }
    );
    const trailingEvents = parseYahooRows(unwrapYahooRows(trailingRaw));

    // Fallback for sparse trailing coverage: build TTM from quarterly EPS.
    const quarterlyRaw = await yahooFinance.fundamentalsTimeSeries(
      providerKey,
      {
        period1: fetchFromDate,
        type: "quarterly",
        module: "financials",
      },
      { validateResult: false }
    );
    const quarterlyEvents = parseQuarterlyRows(unwrapYahooRows(quarterlyRaw));
    const quarterlyTtmEvents = buildTtmEventsFromQuarterly(quarterlyEvents);

    // Last-priority fallback for periods where Yahoo has no trailing/quarterly TTM.
    // We use annual EPS as a proxy so old PE can still be approximated.
    const annualRaw = await yahooFinance.fundamentalsTimeSeries(
      providerKey,
      {
        period1: annualFetchFromDate,
        type: "annual",
        module: "financials",
      },
      { validateResult: false }
    );
    const annualEvents = parseAnnualRows(unwrapYahooRows(annualRaw));
    const annualApproxEvents = buildApproxTtmEventsFromAnnual(annualEvents);

    const normalized = mergeEpsEventsWithPriority([
      trailingEvents,
      quarterlyTtmEvents,
      annualApproxEvents,
    ]);
    logEpsDebug(providerKey, "yahoo-response", {
      fetchFromDate,
      annualFetchFromDate,
      requestedPeriodStartDate: periodStartDate,
      trailingCount: trailingEvents.length,
      trailingFirstDate: trailingEvents[0]?.periodEndDate ?? null,
      trailingLastDate:
        trailingEvents[trailingEvents.length - 1]?.periodEndDate ?? null,
      quarterlyCount: quarterlyEvents.length,
      quarterlyFirstDate: quarterlyEvents[0]?.periodEndDate ?? null,
      quarterlyLastDate:
        quarterlyEvents[quarterlyEvents.length - 1]?.periodEndDate ?? null,
      quarterlyTtmCount: quarterlyTtmEvents.length,
      quarterlyTtmFirstDate: quarterlyTtmEvents[0]?.periodEndDate ?? null,
      quarterlyTtmLastDate:
        quarterlyTtmEvents[quarterlyTtmEvents.length - 1]?.periodEndDate ?? null,
      annualCount: annualEvents.length,
      annualFirstDate: annualEvents[0]?.periodEndDate ?? null,
      annualLastDate: annualEvents[annualEvents.length - 1]?.periodEndDate ?? null,
      annualApproxCount: annualApproxEvents.length,
      annualApproxFirstDate: annualApproxEvents[0]?.periodEndDate ?? null,
      annualApproxLastDate:
        annualApproxEvents[annualApproxEvents.length - 1]?.periodEndDate ?? null,
      mergedCount: normalized.length,
      mergedFirstDate: normalized[0]?.periodEndDate ?? null,
      mergedLastDate: normalized[normalized.length - 1]?.periodEndDate ?? null,
    });
    const fetchedAt = new Date().toISOString();
    if (needsCacheRepair) {
      const adminClient = tryCreateAdminClient();
      if (adminClient) {
        await adminClient
          .from("instrument_eps_ttm_events_cache")
          .delete()
          .eq("provider", PROVIDER)
          .eq("provider_key", providerKey)
          .lt("period_end_date", "1990-01-01");
      }
    }
    await writeCacheRows(providerKey, normalized, fetchedAt);
    logEpsDebug(providerKey, "cache-write", {
      rowsWritten: normalized.length,
      fetchedAt,
    });
    return normalized;
  } catch (error) {
    if (cachedRows.length > 0) {
      return normalizeCacheRows(cachedRows);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
}

export const __test__ = {
  parseYahooRows,
  unwrapYahooRows,
  extractEpsFromRow,
  parseQuarterlyRows,
  buildTtmEventsFromQuarterly,
  parseAnnualRows,
  buildApproxTtmEventsFromAnnual,
  mergeEpsEventsWithPriority,
};
