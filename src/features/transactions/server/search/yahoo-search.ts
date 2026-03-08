import { yahooFinance } from "@/lib/yahoo-finance-client";

import type { InstrumentSearchResult, InstrumentType } from "../../lib/instrument-search";
import type { YahooQuote, YahooSearchQuote } from "./search-types";
import { normalizeYahooInstrument } from "./search-normalize";
import {
  getExchangePriority,
  isAllowedByFilter,
  isAllowedInstrumentType,
  rankQuote,
  withTimeout,
} from "./search-utils";

const isYahooDebugEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.DEBUG_YAHOO_SEARCH === "1";

const logYahooDebug = (event: string, payload: Readonly<Record<string, unknown>>) => {
  if (!isYahooDebugEnabled) {
    return;
  }

  console.info(`[Yahoo][${event}]`, payload);
};

const fetchYahooQuotes = async (
  symbols: string[],
  timeoutMs: number
): Promise<Record<string, YahooQuote | undefined>> => {
  if (symbols.length === 0) return {};

  // Yahoo Finance quote docs:
  // https://jsr.io/@gadicc/yahoo-finance2/doc/modules/quote/~/quote
  const quotePromise = yahooFinance.quote(
    symbols,
    {
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
    },
    // Yahoo occasionally returns partial data (e.g., futures without full fields).
    // Skipping strict validation prevents dropping all search results.
    { validateResult: false }
  );

  const quoteResult = await withTimeout(quotePromise, timeoutMs);
  if (!quoteResult) return {};

  logYahooDebug("quote", { symbols, quoteResult });

  return quoteResult as Record<string, YahooQuote | undefined>;
};

export const searchYahooInstruments = async (
  query: string,
  limit: number,
  timeoutMs: number,
  types?: readonly InstrumentType[] | null
): Promise<InstrumentSearchResult[]> => {
  // Yahoo Finance search docs:
  // https://jsr.io/@gadicc/yahoo-finance2/doc/modules/search/~/search
  const searchPromise = yahooFinance.search(query, {
      quotesCount: limit,
      newsCount: 0,
      enableFuzzyQuery: true,
    },
    // Yahoo search occasionally returns schema-invalid `typeDisp` casing
    // (for example `equity` instead of `Equity`) for otherwise usable hits.
    { validateResult: false }
  );

  const searchResult = await withTimeout(searchPromise, timeoutMs);
  if (!searchResult || typeof searchResult !== "object") return [];

  logYahooDebug("search", { query, searchResult });

  const quotes = (Array.isArray((searchResult as { quotes?: unknown }).quotes)
    ? (searchResult as { quotes: unknown[] }).quotes
    : [])
    .filter(
      (item): item is YahooSearchQuote =>
        typeof item === "object" && item !== null && "symbol" in item
    )
    .map((item) => item as YahooSearchQuote)
    .filter((item) => item.isYahooFinance !== false);

  const normalizedQuery = query.trim().toUpperCase();
  const rankedQuotes = quotes
    .filter((quote) => isAllowedInstrumentType(quote.quoteType))
    .filter((quote) =>
      isAllowedByFilter(quote.quoteType as InstrumentType, types)
    )
    .sort((a, b) => {
      const aScore = rankQuote(a, normalizedQuery);
      const bScore = rankQuote(b, normalizedQuery);
      if (aScore !== bScore) return aScore - bScore;

      const aYahooScore = a.score ?? 0;
      const bYahooScore = b.score ?? 0;
      if (aYahooScore !== bYahooScore) {
        return bYahooScore - aYahooScore;
      }

      const aExchangePriority = getExchangePriority({
        exchange: a.exchange,
        exchangeDisplayName: a.exchDisp,
      });
      const bExchangePriority = getExchangePriority({
        exchange: b.exchange,
        exchangeDisplayName: b.exchDisp,
      });
      if (aExchangePriority !== bExchangePriority) {
        return aExchangePriority - bExchangePriority;
      }

      return 0;
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
