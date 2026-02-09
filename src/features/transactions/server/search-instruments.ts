import type { InstrumentSearchResponse, InstrumentSearchResult } from "../lib/instrument-search";

import { mergeInstrumentResults } from "./search/merge-results";
import { searchLocalInstruments } from "./search/local-search";
import { searchYahooInstruments } from "./search/yahoo-search";
import {
  DEFAULT_LIMIT,
  DEFAULT_TIMEOUT_MS,
  MIN_QUERY_LENGTH,
  type SearchParams,
  type SupabaseServerClient,
} from "./search/search-types";
import { buildInstrumentId, clampLimit, getDisplayTicker } from "./search/search-utils";

type SearchInput = Readonly<Partial<SearchParams> & { query: string }>;

export { getDisplayTicker, MIN_QUERY_LENGTH };

export async function searchInstruments(
  supabase: SupabaseServerClient,
  params: SearchInput
): Promise<InstrumentSearchResponse> {
  // Query validation happens in the route; this keeps the service focused on I/O.
  const query = params.query.trim();
  const limit = clampLimit(params.limit ?? DEFAULT_LIMIT);
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const mode = params.mode ?? "auto";
  const types = params.types ?? null;

  const localResults = await searchLocalInstruments(
    supabase,
    query,
    limit,
    types
  );

  if (mode === "local") {
    return { query, results: localResults.slice(0, limit) };
  }

  if (mode === "auto" && localResults.length > 0) {
    return { query, results: localResults.slice(0, limit) };
  }

  const effectiveTimeoutMs =
    mode === "auto" && localResults.length === 0
      ? Math.max(timeoutMs, 4000)
      : timeoutMs;

  if (localResults.length >= limit) {
    return { query, results: localResults.slice(0, limit) };
  }

  let yahooResults: InstrumentSearchResult[] = [];
  try {
    yahooResults = await searchYahooInstruments(
      query,
      limit,
      effectiveTimeoutMs,
      types
    );
  } catch {
    // Yahoo errors should not block returning local matches.
    yahooResults = [];
  }

  return {
    query,
    results: mergeInstrumentResults(localResults, yahooResults, limit),
  };
}

export const __test__ = {
  buildInstrumentId,
  mergeInstrumentResults,
};
