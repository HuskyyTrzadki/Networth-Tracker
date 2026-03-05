import { buildTradingViewRevenueBreakdownSnapshot } from "./revenue-breakdown-parser";
import type { TradingViewRevenueBreakdownSnapshot, TradingViewRevenueBreakdownRow } from "./types";

export type BuildTradingViewRevenueSourceSnapshotInput = Readonly<{
  provider: string;
  providerKey: string;
  sourceUrl: string;
  rows: readonly TradingViewRevenueBreakdownRow[];
  fetchedAt?: string;
  seriesOrder?: readonly string[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export const buildTradingViewRevenueSourceSnapshot = (
  input: BuildTradingViewRevenueSourceSnapshotInput
): TradingViewRevenueBreakdownSnapshot => {
  const snapshot = buildTradingViewRevenueBreakdownSnapshot(input);

  return {
    ...snapshot,
    metadata: {
      ...snapshot.metadata,
      sourcesCount: Object.keys(snapshot.historyByLabel).length,
    },
  };
};
