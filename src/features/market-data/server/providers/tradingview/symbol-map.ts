import type { TradingViewSymbolMapResult } from "./types";

export type SymbolMapInput = Readonly<{
  exchange: string | null;
  providerKey: string;
  symbol: string;
}>;

const WSE_SUFFIX = ".WA";
const TICKER_PATTERN = /^[A-Z0-9._-]+$/;

const sanitize = (value: string | null | undefined) => value?.trim().toUpperCase() ?? "";

const normalizeWseTicker = (value: string) =>
  value.endsWith(WSE_SUFFIX) ? value.slice(0, -WSE_SUFFIX.length) : value;

const toMapFailure = (
  reason: Extract<TradingViewSymbolMapResult, { ok: false }>['reason']
): TradingViewSymbolMapResult => ({ ok: false, reason });

export function mapInstrumentToTradingViewSymbol(
  input: SymbolMapInput
): TradingViewSymbolMapResult {
  const exchange = sanitize(input.exchange);
  const providerKey = sanitize(input.providerKey);
  const symbol = sanitize(input.symbol);

  if (providerKey.length === 0 && symbol.length === 0) {
    return toMapFailure("MISSING_TICKER");
  }

  const sourceTicker = providerKey || symbol;

  if (exchange === "NASDAQ" || exchange === "NYSE") {
    if (!TICKER_PATTERN.test(sourceTicker)) {
      return toMapFailure("INVALID_TICKER");
    }

    return {
      ok: true,
      venue: exchange,
      ticker: sourceTicker,
      symbolPath: `${exchange}-${sourceTicker}`,
    };
  }

  if (exchange === "WSE") {
    const ticker = normalizeWseTicker(sourceTicker);

    if (ticker.length === 0) {
      return toMapFailure("MISSING_TICKER");
    }

    if (!TICKER_PATTERN.test(ticker)) {
      return toMapFailure("INVALID_TICKER");
    }

    return {
      ok: true,
      venue: "GPW",
      ticker,
      symbolPath: `GPW-${ticker}`,
    };
  }

  return toMapFailure("UNSUPPORTED_EXCHANGE");
}
