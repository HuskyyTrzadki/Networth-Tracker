import {
  buildTradingViewRevenueBreakdownSnapshot,
  normalizeTradingViewMoneyValue,
} from "./revenue-breakdown-parser";
import type {
  TradingViewCountryDomRow,
  TradingViewRevenueGeoSnapshot,
} from "./types";

export type BuildTradingViewRevenueGeoSnapshotInput = Readonly<{
  provider: string;
  providerKey: string;
  sourceUrl: string;
  rows: readonly TradingViewCountryDomRow[];
  fetchedAt?: string;
  seriesOrder?: readonly string[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export { normalizeTradingViewMoneyValue };

export const buildTradingViewRevenueGeoSnapshot = (
  input: BuildTradingViewRevenueGeoSnapshotInput
): TradingViewRevenueGeoSnapshot => {
  const snapshot = buildTradingViewRevenueBreakdownSnapshot({
    provider: input.provider,
    providerKey: input.providerKey,
    sourceUrl: input.sourceUrl,
    rows: input.rows.map((row) => ({
      label: row.country,
      rawValues: row.rawValues,
    })),
    fetchedAt: input.fetchedAt,
    seriesOrder: input.seriesOrder,
    metadata: input.metadata,
  });

  return {
    provider: snapshot.provider,
    providerKey: snapshot.providerKey,
    source: snapshot.source,
    fetchedAt: snapshot.fetchedAt,
    latestByCountry: snapshot.latestByLabel,
    historyByCountry: snapshot.historyByLabel,
    seriesOrder: snapshot.seriesOrder,
    metadata: {
      ...snapshot.metadata,
      countriesCount: Object.keys(snapshot.historyByLabel).length,
    },
  };
};
