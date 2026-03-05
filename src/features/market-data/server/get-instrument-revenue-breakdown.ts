import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

type SupabaseServerClient = SupabaseClient<Database>;

const REVENUE_BREAKDOWN_PROVIDER = "yahoo";
const REVENUE_BREAKDOWN_SOURCE = "tradingview_dom";

export type InstrumentRevenueBreakdownEntry = Readonly<{
  label: string;
  latestValue: number;
}>;

export type InstrumentRevenueBreakdown = Readonly<{
  fetchedAt: string;
  source: string;
  entries: readonly InstrumentRevenueBreakdownEntry[];
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

export async function getInstrumentRevenueBreakdown(
  supabase: SupabaseServerClient,
  providerKey: string,
  kind: "geo" | "source"
): Promise<InstrumentRevenueBreakdown | null> {
  if (kind === "geo") {
    const { data, error } = await supabase
      .from("instrument_revenue_geo_breakdown_cache")
      .select("fetched_at, source, latest_by_country")
      .eq("provider", REVENUE_BREAKDOWN_PROVIDER)
      .eq("source", REVENUE_BREAKDOWN_SOURCE)
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

  const { data, error } = await supabase
    .from("instrument_revenue_source_breakdown_cache")
    .select("fetched_at, source, latest_by_source")
    .eq("provider", REVENUE_BREAKDOWN_PROVIDER)
    .eq("source", REVENUE_BREAKDOWN_SOURCE)
    .eq("provider_key", providerKey)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const entries = Object.entries(toJsonRecordNumber(data.latest_by_source))
    .map(([label, latestValue]) => ({ label, latestValue }))
    .sort((left, right) => right.latestValue - left.latestValue);

  return {
    fetchedAt: data.fetched_at,
    source: data.source,
    entries,
  };
}
