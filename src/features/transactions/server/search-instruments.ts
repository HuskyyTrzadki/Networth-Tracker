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

const AUTO_REMOTE_CANDIDATE_LIMIT = 10;

const normalizeExactMatchValue = (value: string | null | undefined) =>
  value?.trim().toUpperCase() ?? "";

const buildCompactLocalResults = (
  query: string,
  localResults: readonly InstrumentSearchResult[],
  limit: number
) => {
  const normalizedQuery = normalizeExactMatchValue(query);
  const exactMatch = localResults.find((item) =>
    [item.providerKey, item.symbol, item.ticker].some(
      (candidate) => normalizeExactMatchValue(candidate) === normalizedQuery
    )
  );

  if (exactMatch) {
    return [exactMatch];
  }

  return localResults.slice(0, limit);
};

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
  const compactLocalResults = buildCompactLocalResults(query, localResults, limit);

  if (mode === "local") {
    return { query, results: compactLocalResults };
  }

  if (mode === "auto" && localResults.length > 0) {
    return { query, results: compactLocalResults };
  }

  const effectiveTimeoutMs =
    mode === "auto" && localResults.length === 0
      ? Math.max(timeoutMs, 4000)
      : timeoutMs;
  const yahooLimit =
    mode === "all" ? limit : Math.max(limit, AUTO_REMOTE_CANDIDATE_LIMIT);

  let yahooResults: InstrumentSearchResult[] = [];
  try {
    yahooResults = await searchYahooInstruments(
      query,
      yahooLimit,
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
  buildCompactLocalResults,
  buildInstrumentId,
  mergeInstrumentResults,
};
