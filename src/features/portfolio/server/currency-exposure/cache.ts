import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import { CURRENCY_EXPOSURE_MODEL, CURRENCY_EXPOSURE_PROMPT_VERSION, REVENUE_GEO_PROVIDER, REVENUE_GEO_SOURCE } from "./constants";
import { toJsonRecordNumber } from "./normalization";
import type { CachedAssetBreakdown, CurrencyExposureCacheRow, CurrencyExposureScope } from "./types";

type SupabaseServerClient = SupabaseClient<Database>;

type CacheLookupInput = Readonly<{
  userId: string;
  scope: CurrencyExposureScope;
  portfolioId: string | null;
  holdingsFingerprint: string;
}>;

export async function loadRevenueGeoByProviderKey(
  supabase: SupabaseServerClient,
  providerKeys: readonly string[]
): Promise<ReadonlyMap<string, Record<string, number>>> {
  if (providerKeys.length === 0) {
    return new Map();
  }

  const uniqueKeys = Array.from(new Set(providerKeys));
  const { data, error } = await supabase
    .from("instrument_revenue_geo_breakdown_cache")
    .select("provider_key, latest_by_country")
    .eq("provider", REVENUE_GEO_PROVIDER)
    .eq("source", REVENUE_GEO_SOURCE)
    .in("provider_key", uniqueKeys);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row) => [
      row.provider_key,
      toJsonRecordNumber(row.latest_by_country),
    ])
  );
}

export async function readCurrencyExposureCache(
  supabase: SupabaseServerClient,
  input: CacheLookupInput
): Promise<CurrencyExposureCacheRow | null> {
  let query = supabase
    .from("portfolio_currency_exposure_cache")
    .select("id, result_json")
    .eq("user_id", input.userId)
    .eq("scope", input.scope)
    .eq("holdings_fingerprint", input.holdingsFingerprint)
    .eq("prompt_version", CURRENCY_EXPOSURE_PROMPT_VERSION)
    .eq("model", CURRENCY_EXPOSURE_MODEL)
    .order("fetched_at", { ascending: false })
    .limit(1);

  query = input.portfolioId
    ? query.eq("portfolio_id", input.portfolioId)
    : query.is("portfolio_id", null);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? [])[0] as CurrencyExposureCacheRow | undefined) ?? null;
}

export async function saveCurrencyExposureCache(
  supabase: SupabaseServerClient,
  input: Readonly<{
    existingId: string | null;
    userId: string;
    scope: CurrencyExposureScope;
    portfolioId: string | null;
    holdingsFingerprint: string;
    asOf: string | null;
    assetBreakdown: readonly CachedAssetBreakdown[];
  }>
): Promise<void> {
  const resultJson: Json = {
    assetBreakdown: input.assetBreakdown.map((asset) => ({
      instrumentId: asset.instrumentId,
      rationale: asset.rationale,
      currencyExposure: asset.currencyExposure.map((entry) => ({
        currencyCode: entry.currencyCode,
        sharePct: entry.sharePct,
      })),
    })),
  };

  const payload = {
    user_id: input.userId,
    scope: input.scope,
    portfolio_id: input.portfolioId,
    holdings_fingerprint: input.holdingsFingerprint,
    prompt_version: CURRENCY_EXPOSURE_PROMPT_VERSION,
    model: CURRENCY_EXPOSURE_MODEL,
    as_of: input.asOf,
    fetched_at: new Date().toISOString(),
    result_json: resultJson,
  } satisfies Database["public"]["Tables"]["portfolio_currency_exposure_cache"]["Insert"];

  if (input.existingId) {
    const { error } = await supabase
      .from("portfolio_currency_exposure_cache")
      .update(payload)
      .eq("id", input.existingId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("portfolio_currency_exposure_cache").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}
