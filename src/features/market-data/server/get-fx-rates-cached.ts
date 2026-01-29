import type { createClient } from "@/lib/supabase/server";

import { fetchYahooFxQuotes } from "./providers/yahoo/yahoo-fx";
import type { FxPair, FxRate } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;
const PROVIDER = "yahoo";

type FxCacheRow = Readonly<{
  user_id?: string;
  base_currency: string;
  quote_currency: string;
  provider: string;
  rate: string | number;
  as_of: string;
  fetched_at: string;
}>;

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const normalizeRate = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const buildRate = (
  row: FxCacheRow,
  overrides?: Readonly<Partial<FxRate>>
): FxRate => ({
  from: row.base_currency,
  to: row.quote_currency,
  rate: normalizeRate(row.rate),
  asOf: row.as_of,
  fetchedAt: row.fetched_at,
  ...overrides,
});

export async function getFxRatesCached(
  supabase: SupabaseServerClient,
  userId: string,
  pairs: readonly FxPair[],
  options?: Readonly<{ ttlMs?: number }>
): Promise<ReadonlyMap<string, FxRate | null>> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const results = new Map<string, FxRate | null>();

  if (pairs.length === 0) {
    return results;
  }

  // Step 1: read any cached FX rates for requested pairs.
  const bases = Array.from(new Set(pairs.map((pair) => pair.from)));
  const quotes = Array.from(new Set(pairs.map((pair) => pair.to)));

  const { data, error } = await supabase
    .from("fx_rates_cache")
    .select("base_currency, quote_currency, provider, rate, as_of, fetched_at")
    .eq("provider", PROVIDER)
    .in("base_currency", bases)
    .in("quote_currency", quotes);

  if (error) {
    throw new Error(error.message);
  }

  const cachedRows = (data ?? []) as FxCacheRow[];
  const cachedByKey = new Map(
    cachedRows.map((row) => [`${row.base_currency}:${row.quote_currency}`, row])
  );

  const missingPairs: FxPair[] = [];

  // Step 2: identify which pairs need a provider fetch.
  pairs.forEach((pair) => {
    const key = `${pair.from}:${pair.to}`;
    const cached = cachedByKey.get(key);
    if (cached && isFresh(cached.fetched_at, ttlMs)) {
      results.set(key, buildRate(cached));
    } else {
      missingPairs.push(pair);
    }
  });

  if (missingPairs.length === 0) {
    return results;
  }

  // Step 3: fetch missing FX quotes from Yahoo.
  const normalizedQuotes = await fetchYahooFxQuotes(missingPairs, 4000);
  const now = new Date().toISOString();
  const upserts: FxCacheRow[] = [];

  missingPairs.forEach((pair) => {
    const key = `${pair.from}:${pair.to}`;
    const normalized = normalizedQuotes.get(key);

    if (!normalized) {
      results.set(key, null);
      return;
    }

    const row: FxCacheRow = {
      user_id: userId,
      base_currency: pair.from,
      quote_currency: pair.to,
      provider: PROVIDER,
      rate: normalized.price,
      as_of: normalized.asOf,
      fetched_at: now,
    };

    upserts.push(row);
    results.set(key, buildRate(row, { fetchedAt: now }));
  });

  // Step 4: upsert new FX rates for future requests (per-user cache under RLS).
  if (upserts.length > 0) {
    const { error: upsertError } = await supabase
      .from("fx_rates_cache")
      .upsert(upserts, {
        onConflict: "user_id,base_currency,quote_currency,provider",
      });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  return results;
}
