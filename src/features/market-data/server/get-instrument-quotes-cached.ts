import type { SupabaseClient } from "@supabase/supabase-js";

import { tryCreateAdminClient } from "@/lib/supabase/admin";

import { fetchYahooQuotes, normalizeYahooQuote } from "./providers/yahoo/yahoo-quote";
import type { InstrumentQuote, InstrumentQuoteRequest } from "./types";

type SupabaseServerClient = SupabaseClient;

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const PROVIDER = "yahoo";

type QuoteCacheRow = Readonly<{
  instrument_id: string;
  provider: string;
  provider_key: string;
  currency: string;
  price: string | number;
  as_of: string;
  fetched_at: string;
}>;

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const normalizePrice = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const buildQuote = (
  row: QuoteCacheRow,
  overrides?: Readonly<Partial<InstrumentQuote>>
): InstrumentQuote => ({
  instrumentId: row.instrument_id,
  currency: row.currency,
  price: normalizePrice(row.price),
  asOf: row.as_of,
  fetchedAt: row.fetched_at,
  ...overrides,
});

export async function getInstrumentQuotesCached(
  supabase: SupabaseServerClient,
  requests: readonly InstrumentQuoteRequest[],
  options?: Readonly<{ ttlMs?: number }>
): Promise<ReadonlyMap<string, InstrumentQuote | null>> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const results = new Map<string, InstrumentQuote | null>();

  if (requests.length === 0) {
    return results;
  }

  // Step 1: read cache rows for the requested instruments.
  const instrumentIds = requests.map((request) => request.instrumentId);

  const { data, error } = await supabase
    .from("instrument_quotes_cache")
    .select(
      "instrument_id, provider, provider_key, currency, price, as_of, fetched_at"
    )
    .in("instrument_id", instrumentIds)
    .eq("provider", PROVIDER);

  if (error) {
    throw new Error(error.message);
  }

  const cachedRows = (data ?? []) as QuoteCacheRow[];
  const cachedByInstrument = new Map(
    cachedRows.map((row) => [row.instrument_id, row])
  );

  const missingRequests: InstrumentQuoteRequest[] = [];

  // Step 2: decide which quotes are still fresh vs. need a provider fetch.
  requests.forEach((request) => {
    const cached = cachedByInstrument.get(request.instrumentId);
    if (cached && isFresh(cached.fetched_at, ttlMs)) {
      results.set(request.instrumentId, buildQuote(cached));
    } else {
      missingRequests.push(request);
    }
  });

  if (missingRequests.length === 0) {
    return results;
  }

  // Step 3: fetch missing quotes from Yahoo (cache-first strategy).
  const bySymbol = await fetchYahooQuotes(
    missingRequests.map((request) => request.providerKey),
    4000
  );

  const now = new Date().toISOString();
  const upserts: QuoteCacheRow[] = [];

  missingRequests.forEach((request) => {
    const normalized = normalizeYahooQuote(
      request.providerKey,
      bySymbol[request.providerKey]
    );

    if (!normalized) {
      results.set(request.instrumentId, null);
      return;
    }

    const row: QuoteCacheRow = {
      instrument_id: request.instrumentId,
      provider: PROVIDER,
      provider_key: request.providerKey,
      currency: normalized.currency,
      price: normalized.price,
      as_of: normalized.asOf,
      fetched_at: now,
    };

    upserts.push(row);
    results.set(
      request.instrumentId,
      buildQuote(row, { fetchedAt: now })
    );
  });

  // Step 4: upsert new quotes for future requests (per-user cache under RLS).
  if (upserts.length > 0) {
    const adminClient = tryCreateAdminClient();
    if (adminClient) {
      const { error: upsertError } = await adminClient
        .from("instrument_quotes_cache")
        .upsert(upserts, {
          onConflict: "instrument_id,provider",
        });

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }
  }

  return results;
}
