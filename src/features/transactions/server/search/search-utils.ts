import type { InstrumentProvider, InstrumentType } from "../../lib/instrument-search";

import { ALLOWED_QUOTE_TYPES, MAX_LIMIT } from "./search-types";

export const isAllowedInstrumentType = (
  value?: string | null
): value is InstrumentType =>
  Boolean(value && ALLOWED_QUOTE_TYPES.has(value as InstrumentType));

export const isAllowedByFilter = (
  value: InstrumentType | null | undefined,
  allowed?: readonly InstrumentType[] | null
) => {
  if (!allowed || allowed.length === 0) return true;
  if (!value) return false;
  return allowed.includes(value);
};

// Timeout guard: if Yahoo is slow, we return whatever we already have.
export const withTimeout = async <T>(
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

export const buildInstrumentId = (input: Readonly<{
  provider: InstrumentProvider;
  providerKey: string;
}>) => `${input.provider}:${input.providerKey}`;

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

export const clampLimit = (value: number) =>
  Math.max(1, Math.min(value, MAX_LIMIT));

export const rankQuote = (
  quote: Readonly<{
    symbol: string;
    shortname?: string;
    longname?: string;
    quoteType?: string;
  }>,
  normalizedQuery: string
) => {
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
