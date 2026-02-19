import type { SupabaseClient } from "@supabase/supabase-js";

import { decimalOne, divideDecimals, parseDecimalString } from "@/lib/decimal";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { Database, Tables, TablesInsert } from "@/lib/supabase/database.types";

import { fetchYahooFxQuotes } from "./providers/yahoo/yahoo-fx";
import type { FxPair, FxRate } from "./types";

type SupabaseServerClient = SupabaseClient<Database>;

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;
const PROVIDER = "yahoo";

type FxCacheRow = Pick<
  Tables<"fx_rates_cache">,
  "base_currency" | "quote_currency" | "provider" | "rate" | "as_of" | "fetched_at"
>;

type FxCacheUpsertRow = Required<
  Pick<
    TablesInsert<"fx_rates_cache">,
    "base_currency" | "quote_currency" | "provider" | "rate" | "as_of" | "fetched_at"
  >
>;

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const normalizeRate = (value: number) => value.toString();

const toFiniteNumber = (value: string | number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const invertRate = (
  row: FxCacheRow,
  from: string,
  to: string,
  fetchedAtOverride?: string
): FxRate | null => {
  const rateDecimal = parseDecimalString(row.rate);
  if (!rateDecimal) return null;
  const inverted = divideDecimals(decimalOne(), rateDecimal);
  return {
    from,
    to,
    rate: inverted.toString(),
    asOf: row.as_of,
    fetchedAt: fetchedAtOverride ?? row.fetched_at,
    source: "inverted",
  };
};

const buildCacheRow = (
  pair: FxPair,
  rate: number,
  asOf: string,
  fetchedAt: string
): FxCacheUpsertRow => ({
  base_currency: pair.from,
  quote_currency: pair.to,
  provider: PROVIDER,
  rate,
  as_of: asOf,
  fetched_at: fetchedAt,
});

export async function getFxRatesCached(
  supabase: SupabaseServerClient,
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
  const currencies = Array.from(new Set([...bases, ...quotes]));

  const { data, error } = await supabase
    .from("fx_rates_cache")
    .select("base_currency, quote_currency, provider, rate, as_of, fetched_at")
    .eq("provider", PROVIDER)
    .in("base_currency", currencies)
    .in("quote_currency", currencies);

  if (error) {
    throw new Error(error.message);
  }

  const cachedRows: FxCacheRow[] = data ?? [];
  const cachedByKey = new Map(
    cachedRows.map((row) => [`${row.base_currency}:${row.quote_currency}`, row])
  );

  const missingPairs: FxPair[] = [];

  // Step 2: identify which pairs need a provider fetch.
  pairs.forEach((pair) => {
    const key = `${pair.from}:${pair.to}`;
    const cached = cachedByKey.get(key);
    if (cached && isFresh(cached.fetched_at, ttlMs)) {
      results.set(key, buildRate(cached, { source: "direct" }));
      return;
    }

    const inverseKey = `${pair.to}:${pair.from}`;
    const inverse = cachedByKey.get(inverseKey);
    if (inverse && isFresh(inverse.fetched_at, ttlMs)) {
      const inverted = invertRate(inverse, pair.from, pair.to);
      if (inverted) {
        results.set(key, inverted);
        return;
      }
    }

    missingPairs.push(pair);
  });

  if (missingPairs.length === 0) {
    return results;
  }

  // Step 3: fetch missing FX quotes from Yahoo (direct + inverse for inversion support).
  const fetchPairsMap = new Map<string, FxPair>();
  missingPairs.forEach((pair) => {
    fetchPairsMap.set(`${pair.from}:${pair.to}`, pair);
    fetchPairsMap.set(`${pair.to}:${pair.from}`, { from: pair.to, to: pair.from });
  });

  const normalizedQuotes = await fetchYahooFxQuotes(
    Array.from(fetchPairsMap.values()),
    4000
  );
  const now = new Date().toISOString();
  const upserts: FxCacheUpsertRow[] = [];

  missingPairs.forEach((pair) => {
    const key = `${pair.from}:${pair.to}`;
    const normalizedDirect = normalizedQuotes.get(key);
    if (normalizedDirect) {
      const directRate = toFiniteNumber(normalizedDirect.price);
      if (directRate === null) {
        results.set(key, null);
        return;
      }
      const row = buildCacheRow(
        pair,
        directRate,
        normalizedDirect.asOf,
        now
      );

      upserts.push(row);
      results.set(key, buildRate(row, { fetchedAt: now, source: "direct" }));
      return;
    }

    const inverseKey = `${pair.to}:${pair.from}`;
    const normalizedInverse = normalizedQuotes.get(inverseKey);
    if (normalizedInverse) {
      const rateDecimal = parseDecimalString(normalizedInverse.price);
      if (!rateDecimal) {
        results.set(key, null);
        return;
      }
      const inverted = toFiniteNumber(
        divideDecimals(decimalOne(), rateDecimal).toString()
      );
      if (inverted === null) {
        results.set(key, null);
        return;
      }
      const row = buildCacheRow(
        pair,
        inverted,
        normalizedInverse.asOf,
        now
      );

      upserts.push(row);
      results.set(key, buildRate(row, { fetchedAt: now, source: "inverted" }));
      return;
    }

    results.set(key, null);
  });

  // Step 4: upsert new FX rates for future requests (per-user cache under RLS).
  if (upserts.length > 0) {
    const adminClient = tryCreateAdminClient();
    if (adminClient) {
      const { error: upsertError } = await adminClient
        .from("fx_rates_cache")
        .upsert(upserts, {
          onConflict: "base_currency,quote_currency,provider",
        });

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }
  }

  return results;
}

export const __test__ = { invertRate };
