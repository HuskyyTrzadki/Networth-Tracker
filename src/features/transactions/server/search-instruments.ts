import YahooFinance from "yahoo-finance2";

import type { createClient } from "@/lib/supabase/server";

import type {
  InstrumentProvider,
  InstrumentType,
  InstrumentSearchMode,
  InstrumentSearchResult,
  InstrumentSearchResponse,
} from "../lib/instrument-search";

type SupabaseServerClient = ReturnType<typeof createClient>;

type SearchParams = Readonly<{
  query: string;
  limit: number;
  timeoutMs: number;
  mode: InstrumentSearchMode;
}>;

type YahooSearchQuote = Readonly<{
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
  quoteType?: string;
  isYahooFinance?: boolean;
  score?: number;
}>;

type YahooQuote = Readonly<{
  symbol: string;
  currency?: string;
  region?: string;
  shortName?: string;
  longName?: string;
  displayName?: string;
  exchange?: string;
  fullExchangeName?: string;
  logoUrl?: string;
  companyLogoUrl?: string;
  coinImageUrl?: string;
}>;

const yahooFinance = new YahooFinance();
const provider: InstrumentProvider = "yahoo";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const DEFAULT_TIMEOUT_MS = 5000;
export const MIN_QUERY_LENGTH = 2;
const ALLOWED_QUOTE_TYPES = new Set<InstrumentType>([
  "EQUITY",
  "ETF",
  "CRYPTOCURRENCY",
  "MUTUALFUND",
  "CURRENCY",
  "INDEX",
  "OPTION",
  "FUTURE",
  "MONEYMARKET",
  "ECNQUOTE",
  "ALTSYMBOL",
]);

const isAllowedInstrumentType = (value?: string | null): value is InstrumentType =>
  Boolean(value && ALLOWED_QUOTE_TYPES.has(value as InstrumentType));

// Timeout guard: if Yahoo is slow, we return whatever we already have.
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T | null> =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => resolve(null), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });

const buildInstrumentId = (input: Readonly<{ providerKey: string }>) =>
  `${provider}:${input.providerKey}`;

export const getDisplayTicker = (
  symbol: string,
  quoteType?: string | null
) => {
  if (symbol.endsWith(".WA")) {
    return symbol.slice(0, -3);
  }

  if (symbol.includes(".")) {
    return symbol.split(".")[0] ?? symbol;
  }

  if (quoteType === "CRYPTOCURRENCY" && symbol.includes("-")) {
    return symbol.split("-")[0] ?? symbol;
  }

  return symbol;
};

const rankQuote = (quote: YahooSearchQuote, normalizedQuery: string) => {
  const symbol = quote.symbol?.toUpperCase() ?? "";
  const ticker = getDisplayTicker(quote.symbol ?? "", quote.quoteType).toUpperCase();
  const name = `${quote.shortname ?? ""} ${quote.longname ?? ""}`.toLowerCase();
  const queryLower = normalizedQuery.toLowerCase();

  const matches = [
    symbol === normalizedQuery || ticker === normalizedQuery,
    symbol.startsWith(normalizedQuery) || ticker.startsWith(normalizedQuery),
    name.includes(queryLower),
  ];

  const index = matches.findIndex(Boolean);
  return index === -1 ? matches.length : index;
};

const clampLimit = (value: number) =>
  Math.max(1, Math.min(value, MAX_LIMIT));

const normalizeName = (input: Readonly<{
  shortname?: string;
  longname?: string;
  fallback: string;
}>) => input.shortname ?? input.longname ?? input.fallback;

const normalizeExchange = (input: Readonly<{
  exchange?: string;
  exchDisp?: string;
  fullExchangeName?: string;
}>) => input.exchDisp ?? input.fullExchangeName ?? input.exchange;

const normalizeLocalInstrument = (
  row: Readonly<{
    provider: string;
    provider_key: string | null;
    symbol: string;
    name: string;
    currency: string;
    exchange: string | null;
    region: string | null;
    logo_url: string | null;
    instrument_type: InstrumentType | null;
  }>
): InstrumentSearchResult => {
  const providerKey = row.provider_key ?? row.symbol;

  return {
    id: buildInstrumentId({ providerKey }),
    provider,
    providerKey,
    symbol: row.symbol,
    ticker: getDisplayTicker(row.symbol, null),
    name: row.name,
    currency: row.currency.toUpperCase(),
    instrumentType: row.instrument_type ?? undefined,
    exchange: row.exchange ?? undefined,
    region: row.region ?? undefined,
    logoUrl: row.logo_url ?? null,
  };
};

const normalizeYahooInstrument = (
  quote: YahooSearchQuote,
  quoteBySymbol: Record<string, YahooQuote | undefined>
): InstrumentSearchResult | null => {
  const symbol = quote.symbol?.trim();
  if (!symbol) return null;

  const quoteDetails = quoteBySymbol[symbol];
  const currency = quoteDetails?.currency?.trim().toUpperCase() ?? "";
  if (!currency) return null;
  if (!isAllowedInstrumentType(quote.quoteType)) {
    return null;
  }

  const name = normalizeName({
    shortname: quote.shortname ?? quoteDetails?.shortName,
    longname: quote.longname ?? quoteDetails?.longName ?? quoteDetails?.displayName,
    fallback: symbol,
  });

  return {
    id: buildInstrumentId({ providerKey: symbol }),
    provider,
    providerKey: symbol,
    symbol,
    ticker: getDisplayTicker(symbol, quote.quoteType),
    name,
    currency,
    instrumentType: quote.quoteType,
    exchange: normalizeExchange({
      exchDisp: quote.exchDisp,
      exchange: quote.exchange ?? quoteDetails?.exchange,
      fullExchangeName: quoteDetails?.fullExchangeName,
    }),
    region: quoteDetails?.region?.toUpperCase(),
    logoUrl:
      quoteDetails?.logoUrl ??
      quoteDetails?.companyLogoUrl ??
      quoteDetails?.coinImageUrl ??
      null,
  };
};

// Merge local + Yahoo results, keeping local entries as the source of truth.
const mergeInstrumentResults = (
  localResults: InstrumentSearchResult[],
  yahooResults: InstrumentSearchResult[],
  limit: number
) => {
  const byKey = new Map<string, InstrumentSearchResult>();

  const buildKey = (item: InstrumentSearchResult) =>
    `${item.provider}:${item.providerKey}`.toLowerCase();

  localResults.forEach((item) => {
    byKey.set(buildKey(item), item);
  });

  yahooResults.forEach((item) => {
    const key = buildKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      return;
    }

    if (!existing.instrumentType && item.instrumentType) {
      byKey.set(key, { ...existing, instrumentType: item.instrumentType });
    }
  });

  return Array.from(byKey.values()).slice(0, limit);
};

const searchLocalInstruments = async (
  supabase: SupabaseServerClient,
  userId: string,
  query: string,
  limit: number
): Promise<InstrumentSearchResult[]> => {
  // Local search keeps UX fast and uses the user's existing instrument cache.
  const pattern = `%${query}%`;
  const { data, error } = await supabase
    .from("instruments")
    .select(
      "provider, provider_key, symbol, name, currency, exchange, region, logo_url, instrument_type, updated_at"
    )
    .eq("user_id", userId)
    .or(`provider_key.ilike.${pattern},name.ilike.${pattern},symbol.ilike.${pattern}`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(normalizeLocalInstrument);
};

const fetchYahooQuotes = async (
  symbols: string[],
  timeoutMs: number
): Promise<Record<string, YahooQuote | undefined>> => {
  if (symbols.length === 0) return {};

  // Yahoo Finance quote docs:
  // https://jsr.io/@gadicc/yahoo-finance2/doc/modules/quote/~/quote
  const quotePromise = yahooFinance.quote(symbols, {
    fields: [
      "symbol",
      "currency",
      "region",
      "shortName",
      "longName",
      "displayName",
      "exchange",
      "fullExchangeName",
      "logoUrl",
      "companyLogoUrl",
      "coinImageUrl",
    ],
    return: "object",
  });

  const quoteResult = await withTimeout(quotePromise, timeoutMs);
  if (!quoteResult) return {};

  // Debug: full Yahoo quote response for each search request.
  console.log("[Yahoo][quote]", { symbols, quoteResult });

  return quoteResult as Record<string, YahooQuote | undefined>;
};

const searchYahooInstruments = async (
  query: string,
  limit: number,
  timeoutMs: number
): Promise<InstrumentSearchResult[]> => {
  // Yahoo Finance search docs:
  // https://jsr.io/@gadicc/yahoo-finance2/doc/modules/search/~/search
  const searchPromise = yahooFinance.search(query, {
    quotesCount: limit,
    newsCount: 0,
  });

  const searchResult = await withTimeout(searchPromise, timeoutMs);
  if (!searchResult) return [];

  // Debug: full Yahoo search response for each request.
  console.log("[Yahoo][search]", { query, searchResult });

  const quotes = (searchResult.quotes ?? [])
    .filter((item) => Boolean(item && "symbol" in item))
    .map((item) => item as YahooSearchQuote)
    .filter((item) => item.isYahooFinance !== false);

  const normalizedQuery = query.trim().toUpperCase();
  const rankedQuotes = quotes
    .filter((quote) => isAllowedInstrumentType(quote.quoteType))
    .sort((a, b) => {
      const aScore = rankQuote(a, normalizedQuery);
      const bScore = rankQuote(b, normalizedQuery);
      if (aScore !== bScore) return aScore - bScore;
      return (b.score ?? 0) - (a.score ?? 0);
    });

  const symbols = Array.from(
    new Set(
      rankedQuotes
        .map((item) => item.symbol)
        .filter((symbol): symbol is string => Boolean(symbol))
    )
  ).slice(0, limit);

  const quoteBySymbol = await fetchYahooQuotes(symbols, timeoutMs);

  return rankedQuotes
    .map((quote) => normalizeYahooInstrument(quote, quoteBySymbol))
    .filter((item): item is InstrumentSearchResult => Boolean(item));
};

export async function searchInstruments(
  supabase: SupabaseServerClient,
  userId: string,
  params: Readonly<Partial<SearchParams> & { query: string }>
): Promise<InstrumentSearchResponse> {
  // Query validation happens in the route; this keeps the service focused on I/O.
  const query = params.query.trim();
  const limit = clampLimit(params.limit ?? DEFAULT_LIMIT);
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const mode = params.mode ?? "auto";

  const localResults = await searchLocalInstruments(
    supabase,
    userId,
    query,
    limit
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
    yahooResults = await searchYahooInstruments(query, limit, effectiveTimeoutMs);
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
