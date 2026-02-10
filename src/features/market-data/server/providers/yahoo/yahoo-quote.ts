import { yahooFinance } from "./yahoo-client";

type YahooQuote = Readonly<{
  symbol: string;
  currency?: string;
  regularMarketPrice?: number | string;
  regularMarketChange?: number | string;
  regularMarketChangePercent?: number | string;
  regularMarketPreviousClose?: number | string;
  regularMarketTime?: number;
}>;

const chunkSymbols = (symbols: string[], size: number) => {
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += size) {
    chunks.push(symbols.slice(i, i + size));
  }
  return chunks;
};

const toIsoFromSeconds = (seconds?: number) =>
  typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;

const toNullableNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export async function fetchYahooQuotes(
  symbols: string[],
  timeoutMs: number
): Promise<Record<string, YahooQuote | undefined>> {
  // Provider fetch: Yahoo quotes are batched and time-boxed per request.
  if (symbols.length === 0) return {};

  const batches = chunkSymbols(symbols, 50);
  const results: Record<string, YahooQuote | undefined> = {};

  for (const batch of batches) {
    // Yahoo Finance quote docs:
    // https://jsr.io/@gadicc/yahoo-finance2/doc/modules/quote/~/quote
    const quotePromise = yahooFinance.quote(
      batch,
      {
        fields: [
          "symbol",
          "currency",
          "regularMarketPrice",
          "regularMarketChange",
          "regularMarketChangePercent",
          "regularMarketPreviousClose",
          "regularMarketTime",
        ],
        return: "object",
      },
      // Yahoo can respond with partial/invalid entries; avoid failing the whole batch.
      { validateResult: false }
    );

    const quoteResult = await Promise.race([
      quotePromise,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs)
      ),
    ]);

    if (!quoteResult) continue;

    Object.entries(quoteResult as Record<string, YahooQuote | undefined>).forEach(
      ([symbol, quote]) => {
        results[symbol] = quote;
      }
    );
  }

  return results;
}

export const normalizeYahooQuote = (symbol: string, quote?: YahooQuote) => {
  if (quote?.regularMarketPrice === undefined || !quote.currency) return null;

  const price = toNullableNumber(quote.regularMarketPrice);
  if (price === null) return null;

  const dayChange = toNullableNumber(quote.regularMarketChange);
  const previousClose = toNullableNumber(quote.regularMarketPreviousClose);
  const dayChangePercentRaw = toNullableNumber(quote.regularMarketChangePercent);
  const computedDayChange =
    dayChange !== null
      ? dayChange
      : previousClose !== null
        ? price - previousClose
        : null;
  const computedDayChangePercent =
    computedDayChange !== null && previousClose !== null && previousClose !== 0
      ? computedDayChange / previousClose
      : dayChangePercentRaw !== null
        ? Math.abs(dayChangePercentRaw) > 1
          ? dayChangePercentRaw / 100
          : dayChangePercentRaw
        : null;

  return {
    symbol,
    currency: quote.currency.toUpperCase(),
    price: price.toString(),
    dayChange: computedDayChange === null ? null : computedDayChange.toString(),
    dayChangePercent: computedDayChangePercent,
    // If the provider lacks a timestamp, we fall back to "now".
    asOf: toIsoFromSeconds(quote.regularMarketTime) ?? new Date().toISOString(),
  };
};

export const normalizeYahooFxQuote = (symbol: string, quote?: YahooQuote) => {
  if (quote?.regularMarketPrice === undefined) return null;
  return {
    symbol,
    price: quote.regularMarketPrice.toString(),
    asOf: toIsoFromSeconds(quote.regularMarketTime) ?? new Date().toISOString(),
  };
};
