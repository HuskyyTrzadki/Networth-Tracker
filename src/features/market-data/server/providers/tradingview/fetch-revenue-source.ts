import {
  buildTradingViewRevenueSourceSnapshot,
  type BuildTradingViewRevenueSourceSnapshotInput,
} from "./revenue-source-parser";
import {
  mapInstrumentToTradingViewRevenueUrl,
  buildTradingViewRevenueGeoUrl,
} from "./fetch-revenue-geo";
import type { SymbolMapInput } from "./symbol-map";

export const buildTradingViewRevenueSourceUrl = buildTradingViewRevenueGeoUrl;

export const mapInstrumentToTradingViewRevenueSourceUrl = (
  input: SymbolMapInput,
  locale = "www"
) => mapInstrumentToTradingViewRevenueUrl(input, locale);

export const buildTradingViewRevenueSourceFromRows = (
  input: BuildTradingViewRevenueSourceSnapshotInput
) => buildTradingViewRevenueSourceSnapshot(input);
