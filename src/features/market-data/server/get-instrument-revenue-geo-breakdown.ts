import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

type SupabaseServerClient = SupabaseClient<Database>;

const REVENUE_GEO_PROVIDER = "yahoo";
const REVENUE_GEO_SOURCE = "tradingview_dom";

export type InstrumentRevenueGeoBreakdownEntry = Readonly<{
  label: string;
  latestValue: number;
}>;

export type InstrumentRevenueGeoBreakdown = Readonly<{
  fetchedAt: string;
  source: string;
  entries: readonly InstrumentRevenueGeoBreakdownEntry[];
}>;

const toJsonRecordNumber = (value: Json): Record<string, number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, nestedValue]) => {
      const parsed =
        typeof nestedValue === "number" ? nestedValue : Number(nestedValue);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        return [];
      }

      return [[key, parsed]];
    })
  );
};

export async function getInstrumentRevenueGeoBreakdown(
  supabase: SupabaseServerClient,
  providerKey: string
): Promise<InstrumentRevenueGeoBreakdown | null> {
  const { data, error } = await supabase
    .from("instrument_revenue_geo_breakdown_cache")
    .select("fetched_at, source, latest_by_country")
    .eq("provider", REVENUE_GEO_PROVIDER)
    .eq("source", REVENUE_GEO_SOURCE)
    .eq("provider_key", providerKey)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const entries = Object.entries(toJsonRecordNumber(data.latest_by_country))
    .map(([label, latestValue]) => ({ label, latestValue }))
    .sort((left, right) => right.latestValue - left.latestValue);

  return {
    fetchedAt: data.fetched_at,
    source: data.source,
    entries,
  };
}
