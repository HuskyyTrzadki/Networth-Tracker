import { fetchYahooQuotes, normalizeYahooFxQuote } from "./yahoo-quote";

const buildFxSymbol = (from: string, to: string) =>
  `${from}${to}=X`.toUpperCase();

export async function fetchYahooFxQuotes(
  pairs: readonly { from: string; to: string }[],
  timeoutMs: number
) {
  // MVP: only direct FX pairs (no triangulation).
  const symbols = pairs.map((pair) => buildFxSymbol(pair.from, pair.to));
  const quotes = await fetchYahooQuotes(symbols, timeoutMs);

  const byPair = new Map<
    string,
    ReturnType<typeof normalizeYahooFxQuote> | null
  >();

  pairs.forEach((pair) => {
    const symbol = buildFxSymbol(pair.from, pair.to);
    const normalized = normalizeYahooFxQuote(symbol, quotes[symbol]);
    byPair.set(`${pair.from}:${pair.to}`, normalized);
  });

  return byPair;
}

export const __test__ = { buildFxSymbol };
