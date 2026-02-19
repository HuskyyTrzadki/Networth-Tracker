import type { SupabaseClient } from "@supabase/supabase-js";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { Database, TablesInsert } from "@/lib/supabase/database.types";

import { fetchYahooQuotes, normalizeYahooQuote } from "./providers/yahoo/yahoo-quote";
import type { InstrumentQuote, InstrumentQuoteRequest } from "./types";

type SupabaseServerClient = SupabaseClient<Database>;

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const PROVIDER = "yahoo";

type QuoteCacheRow = Readonly<{
  instrument_id: string;
  provider: string;
  provider_key: string;
  currency: string;
  price: number;
  day_change?: number | null;
  day_change_percent?: number | null;
  as_of: string;
  fetched_at: string;
}>;

type QuoteCacheUpsertRow = Required<
  Pick<
    TablesInsert<"instrument_quotes_cache">,
    | "instrument_id"
    | "provider"
    | "provider_key"
    | "currency"
    | "price"
    | "as_of"
    | "fetched_at"
  >
> &
  Pick<
    TablesInsert<"instrument_quotes_cache">,
    "day_change" | "day_change_percent"
  >;

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const normalizePrice = (value: number) => value.toString();

const normalizeNullableString = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  return value.toString();
};

const normalizeNullableNumber = (
  value: number | null | undefined
): number | null => {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
};

const toFiniteNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const QUOTES_SELECT_WITH_DAY_CHANGE =
  "instrument_id, provider, provider_key, currency, price, day_change, day_change_percent, as_of, fetched_at";
const QUOTES_SELECT_BASE =
  "instrument_id, provider, provider_key, currency, price, as_of, fetched_at";

function isMissingDayChangeColumnError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("instrument_quotes_cache.day_change") ||
    normalized.includes("instrument_quotes_cache.day_change_percent")
  );
}

const buildQuote = (
  row: QuoteCacheRow,
  overrides?: Readonly<Partial<InstrumentQuote>>
): InstrumentQuote => ({
  instrumentId: row.instrument_id,
  currency: row.currency,
  price: normalizePrice(row.price),
  dayChange: normalizeNullableString(row.day_change),
  dayChangePercent: normalizeNullableNumber(row.day_change_percent),
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

  let supportsDayChangeColumns = true;

  const withDayChangeResult = await supabase
    .from("instrument_quotes_cache")
    .select(QUOTES_SELECT_WITH_DAY_CHANGE)
    .in("instrument_id", instrumentIds)
    .eq("provider", PROVIDER);

  let data = withDayChangeResult.data as QuoteCacheRow[] | null;
  let error = withDayChangeResult.error as { message: string } | null;

  if (error && isMissingDayChangeColumnError(error.message)) {
    // Backward compatibility: allow app to run before DB migration adds
    // day-change columns. Top movers will stay empty until migration is applied.
    supportsDayChangeColumns = false;
    const fallbackResult = await supabase
      .from("instrument_quotes_cache")
      .select(QUOTES_SELECT_BASE)
      .in("instrument_id", instrumentIds)
      .eq("provider", PROVIDER);
    data = fallbackResult.data as QuoteCacheRow[] | null;
    error = fallbackResult.error as { message: string } | null;
  }

  if (error) {
    throw new Error(error.message);
  }

  const cachedRows: QuoteCacheRow[] = data ?? [];
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
  const upserts: QuoteCacheUpsertRow[] = [];

  missingRequests.forEach((request) => {
    const normalized = normalizeYahooQuote(
      request.providerKey,
      bySymbol[request.providerKey]
    );

    if (!normalized) {
      results.set(request.instrumentId, null);
      return;
    }

    const price = toFiniteNumber(normalized.price);
    if (price === null) {
      results.set(request.instrumentId, null);
      return;
    }

    const row: QuoteCacheUpsertRow = {
      instrument_id: request.instrumentId,
      provider: PROVIDER,
      provider_key: request.providerKey,
      currency: normalized.currency,
      price,
      as_of: normalized.asOf,
      fetched_at: now,
      ...(supportsDayChangeColumns
        ? {
            day_change: toFiniteNumber(normalized.dayChange),
            day_change_percent: normalized.dayChangePercent,
          }
        : {}),
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

export const __test__ = {
  buildQuote,
  normalizeNullableString,
  normalizeNullableNumber,
  isMissingDayChangeColumnError,
};
