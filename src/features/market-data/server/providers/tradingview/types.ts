export const TRADINGVIEW_SUPPORTED_INSTRUMENT_EXCHANGES = [
  "NASDAQ",
  "NYSE",
  "WSE",
] as const;

export type TradingViewSupportedInstrumentExchange =
  (typeof TRADINGVIEW_SUPPORTED_INSTRUMENT_EXCHANGES)[number];

export type TradingViewVenueCode = "NASDAQ" | "NYSE" | "GPW";

export type TradingViewSymbolMapSuccess = Readonly<{
  ok: true;
  venue: TradingViewVenueCode;
  ticker: string;
  symbolPath: string;
}>;

export type TradingViewSymbolMapFailure = Readonly<{
  ok: false;
  reason:
    | "UNSUPPORTED_EXCHANGE"
    | "MISSING_TICKER"
    | "INVALID_TICKER";
}>;

export type TradingViewSymbolMapResult =
  | TradingViewSymbolMapSuccess
  | TradingViewSymbolMapFailure;

export type TradingViewCountryDomRow = Readonly<{
  country: string;
  rawValues: readonly string[];
}>;

export type TradingViewRevenueGeoSnapshot = Readonly<{
  provider: string;
  providerKey: string;
  source: "tradingview_dom";
  fetchedAt: string;
  latestByCountry: Readonly<Record<string, number>>;
  historyByCountry: Readonly<Record<string, readonly number[]>>;
  seriesOrder: readonly string[];
  metadata: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type TradingViewIngestionResult = Readonly<{
  providerKey: string;
  exchange: TradingViewSupportedInstrumentExchange;
  status: "SUCCESS" | "SKIPPED" | "FAILED";
  message: string;
  countriesCount: number;
}>;
