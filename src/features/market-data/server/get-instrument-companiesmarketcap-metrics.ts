import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import {
  COMPANIES_MARKETCAP_METRICS,
  type CompaniesMarketCapAnnualHistoryPoint,
  type CompaniesMarketCapMetric,
  type CompaniesMarketCapMetricSnapshot,
} from "@/features/market-data/server/companiesmarketcap/types";

type SupabaseServerClient = SupabaseClient<Database>;

type MetricCacheRow = Database["public"]["Tables"]["instrument_companiesmarketcap_metric_cache"]["Row"];

const isMetric = (value: string): value is CompaniesMarketCapMetric =>
  COMPANIES_MARKETCAP_METRICS.includes(value as CompaniesMarketCapMetric);

const toFiniteNumber = (value: Json | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toBoolean = (value: Json | undefined) => value === true;

const toStringOrNull = (value: Json | undefined) =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const parseAnnualHistoryEntry = (
  value: Json
): CompaniesMarketCapAnnualHistoryPoint | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const year = toFiniteNumber(value.year);
  const numericYear = typeof year === "number" ? Math.trunc(year) : null;
  const amount = toFiniteNumber(value.value);

  if (numericYear === null || amount === null) {
    return null;
  }

  return {
    year: numericYear,
    value: amount,
    changePercent: toFiniteNumber(value.changePercent),
    isTtm: toBoolean(value.isTtm),
    periodLabel: toStringOrNull(value.periodLabel) ?? String(numericYear),
    dateRangeLabel: toStringOrNull(value.dateRangeLabel),
  };
};

const parseAnnualHistory = (value: Json): readonly CompaniesMarketCapAnnualHistoryPoint[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => parseAnnualHistoryEntry(entry))
    .filter((entry): entry is CompaniesMarketCapAnnualHistoryPoint => entry !== null)
    .sort((left, right) => left.year - right.year);
};

const fromRow = (
  row: MetricCacheRow
): CompaniesMarketCapMetricSnapshot | null => {
  if (!isMetric(row.metric)) {
    return null;
  }

  return {
    providerKey: row.provider_key,
    metric: row.metric,
    slug: row.slug,
    sourceUrl: row.source_url,
    ttmValue: typeof row.ttm_value === "number" ? row.ttm_value : null,
    ttmLabel: row.ttm_label,
    annualHistory: parseAnnualHistory(row.annual_history),
    metadata: row.metadata,
    fetchedAt: row.fetched_at,
  };
};

export async function getInstrumentCompaniesMarketCapMetrics(
  supabase: SupabaseServerClient,
  providerKey: string
): Promise<Readonly<Record<CompaniesMarketCapMetric, CompaniesMarketCapMetricSnapshot | null>>> {
  const { data, error } = await supabase
    .from("instrument_companiesmarketcap_metric_cache")
    .select(
      "metric,slug,source_url,ttm_value,ttm_label,annual_history,metadata,fetched_at"
    )
    .eq("provider", "yahoo")
    .eq("provider_key", providerKey)
    .eq("source", "companiesmarketcap_html")
    .in("metric", [...COMPANIES_MARKETCAP_METRICS]);

  if (error) {
    throw new Error(`Failed to read CompaniesMarketCap metrics: ${error.message}`);
  }

  const entries = (data ?? [])
    .map((row) => fromRow(row as MetricCacheRow))
    .filter((row): row is CompaniesMarketCapMetricSnapshot => row !== null);

  const byMetric = new Map(entries.map((entry) => [entry.metric, entry] as const));

  return {
    revenue: byMetric.get("revenue") ?? null,
    earnings: byMetric.get("earnings") ?? null,
    pe_ratio: byMetric.get("pe_ratio") ?? null,
    ps_ratio: byMetric.get("ps_ratio") ?? null,
  };
}
