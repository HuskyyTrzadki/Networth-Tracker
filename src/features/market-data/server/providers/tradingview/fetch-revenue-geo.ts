import {
  buildTradingViewRevenueGeoSnapshot,
  type BuildTradingViewRevenueGeoSnapshotInput,
} from "./revenue-geo-parser";
import {
  mapInstrumentToTradingViewSymbol,
  type SymbolMapInput,
} from "./symbol-map";

export const buildTradingViewRevenueGeoUrl = (symbolPath: string, locale = "www") =>
  `https://${locale}.tradingview.com/symbols/${symbolPath}/financials-revenue/`;

export const mapInstrumentToTradingViewRevenueUrl = (
  input: SymbolMapInput,
  locale = "www"
) => {
  const mapped = mapInstrumentToTradingViewSymbol(input);

  if (!mapped.ok) {
    return mapped;
  }

  return {
    ...mapped,
    revenueUrl: buildTradingViewRevenueGeoUrl(mapped.symbolPath, locale),
  };
};

export const buildTradingViewRevenueGeoFromRows = (
  input: BuildTradingViewRevenueGeoSnapshotInput
) => buildTradingViewRevenueGeoSnapshot(input);
