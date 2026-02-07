import type { SupabaseClient } from "@supabase/supabase-js";

import { tryCreateAdminClient } from "@/lib/supabase/admin";

import {
  __test__ as parserTest,
  isEurostatEmptySelection,
  parsePolishCpiPayload,
} from "./lib/polish-cpi-parser";
import type { PolishCpiPoint } from "./types";

type SupabaseServerClient = SupabaseClient;

const PROVIDER = "eurostat";
const METRIC = "CPI_PL_INDEX";
const POLISH_CPI_URL =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_midx?lang=EN&geo=PL&unit=I15&coicop=CP00";
const DEFAULT_TIMEOUT_MS = 5000;
const CACHE_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

type CpiCacheRow = Readonly<{
  provider: string;
  metric: string;
  period_date: string;
  value: string | number;
  as_of: string;
  fetched_at: string;
}>;

type CpiUpsertRow = Readonly<{
  provider: string;
  metric: string;
  period_date: string;
  value: number;
  as_of: string;
  fetched_at: string;
}>;

type ParsedCpiRow = Readonly<{
  periodDate: string;
  value: number;
}>;

const LOG_PREFIX = "[market-data][cpi-pl]";

const toMonthStart = (value: string) => `${value.slice(0, 7)}-01`;

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const isMissingCpiCacheTableError = (error: unknown) => {
  const message = toErrorMessage(error);
  return (
    message.includes("macro_cpi_pl_cache") &&
    (message.includes("PGRST205") || message.includes("Could not find the table"))
  );
};

const logCpiError = (
  stage: string,
  error: unknown,
  context: Readonly<Record<string, string>>
) => {
  console.error(`${LOG_PREFIX} ${stage}`, {
    error: toErrorMessage(error),
    ...context,
  });
};

const readCachedRows = async (
  supabase: SupabaseServerClient,
  fromMonthDate: string,
  toMonthDate: string
) => {
  const { data, error } = await supabase
    .from("macro_cpi_pl_cache")
    .select("provider,metric,period_date,value,as_of,fetched_at")
    .eq("provider", PROVIDER)
    .eq("metric", METRIC)
    .gte("period_date", fromMonthDate)
    .lte("period_date", toMonthDate)
    .order("period_date", { ascending: true });

  if (error) {
    const code = "code" in error && typeof error.code === "string" ? error.code : "unknown";
    throw new Error(`${code}: ${error.message}`);
  }

  return (data ?? []) as CpiCacheRow[];
};

const isStale = (fetchedAt: string) => {
  const fetchedAtMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedAtMs)) {
    return true;
  }

  return Date.now() - fetchedAtMs > CACHE_STALE_AFTER_MS;
};

const fetchPolishCpiRows = async (timeoutMs: number): Promise<ParsedCpiRow[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(POLISH_CPI_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`CPI request failed: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const parsed = parsePolishCpiPayload(payload);
    if (parsed.length === 0 && isEurostatEmptySelection(payload)) {
      throw new Error(
        "Eurostat returned empty dataset for selected filters (likely invalid unit/geo/coicop combination)."
      );
    }

    return parsed;
  } finally {
    clearTimeout(timeoutId);
  }
};

const cacheFetchedRows = async (rows: readonly ParsedCpiRow[]) => {
  if (rows.length === 0) {
    return;
  }

  const adminClient = tryCreateAdminClient();
  if (!adminClient) {
    return;
  }

  const fetchedAt = new Date().toISOString();
  const asOf = fetchedAt;
  const upserts: CpiUpsertRow[] = rows.map((row) => ({
    provider: PROVIDER,
    metric: METRIC,
    period_date: row.periodDate,
    value: row.value,
    as_of: asOf,
    fetched_at: fetchedAt,
  }));

  const { error } = await adminClient.from("macro_cpi_pl_cache").upsert(upserts, {
    onConflict: "provider,metric,period_date",
  });

  if (error) {
    throw new Error(error.message);
  }
};

const toPolishCpiPoints = (rows: readonly CpiCacheRow[]): PolishCpiPoint[] =>
  rows.map((row) => ({
    periodDate: row.period_date,
    value: typeof row.value === "number" ? row.value : Number(row.value),
    asOf: row.as_of,
    fetchedAt: row.fetched_at,
  }));

export async function getPolishCpiSeriesCached(
  supabase: SupabaseServerClient,
  fromDate: string,
  toDate: string,
  options?: Readonly<{ timeoutMs?: number }>
): Promise<readonly PolishCpiPoint[]> {
  const fromMonthDate = toMonthStart(fromDate);
  const toMonthDate = toMonthStart(toDate);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let cachedRows: CpiCacheRow[] = [];
  let hasCacheTable = true;

  try {
    cachedRows = await readCachedRows(supabase, fromMonthDate, toMonthDate);
  } catch (error) {
    if (isMissingCpiCacheTableError(error)) {
      hasCacheTable = false;
      logCpiError("cache-table-missing", error, {
        fromMonthDate,
        toMonthDate,
      });
    } else {
      logCpiError("cache-read-failed", error, {
        fromMonthDate,
        toMonthDate,
      });
      throw error;
    }
  }

  const latestFetchedAt = cachedRows.at(-1)?.fetched_at;
  const hasStartCoverage =
    cachedRows.length > 0 && cachedRows[0].period_date <= fromMonthDate;
  const shouldRefresh = !hasStartCoverage || !latestFetchedAt || isStale(latestFetchedAt);

  if (!shouldRefresh) {
    return toPolishCpiPoints(cachedRows);
  }

  try {
    // Backend fetch: CPI endpoint is public and low-frequency; we cache monthly values globally.
    const fetchedRows = await fetchPolishCpiRows(timeoutMs);
    if (hasCacheTable) {
      await cacheFetchedRows(fetchedRows);

      const refreshedRows = await readCachedRows(supabase, fromMonthDate, toMonthDate);
      if (refreshedRows.length > 0) {
        return toPolishCpiPoints(refreshedRows);
      }
    }

    const fetchedAt = new Date().toISOString();
    return fetchedRows
      .filter((row) => row.periodDate >= fromMonthDate && row.periodDate <= toMonthDate)
      .map((row) => ({
        periodDate: row.periodDate,
        value: row.value,
        asOf: fetchedAt,
        fetchedAt,
      }));
  } catch (error) {
    logCpiError("fetch-or-parse-failed", error, {
      fromMonthDate,
      toMonthDate,
    });
    // Fallback: keep dashboard usable even if macro API is temporarily unavailable.
    return toPolishCpiPoints(cachedRows);
  }
}

export const __test__ = {
  isMissingCpiCacheTableError,
  ...parserTest,
};
