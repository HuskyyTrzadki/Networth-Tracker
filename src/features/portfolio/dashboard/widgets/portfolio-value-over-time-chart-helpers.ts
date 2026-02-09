import type { LiveTotals } from "../../server/get-portfolio-live-totals";
import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { SnapshotChartRow } from "../../server/snapshots/types";
import type { PerformanceInputRow } from "../lib/twr";
import type { ChartMode } from "../lib/chart-helpers";
import {
  getExternalCashflow,
  getImplicitTransfer,
  getIsPartial,
  getTotalValue,
} from "../lib/chart-helpers";

export const MAX_LIVE_ANCHOR_GAP_DAYS = 7;

export const resolveInitialChartMode = (
  rows: readonly SnapshotChartRow[]
): ChartMode => (rows.length < 2 ? "VALUE" : "PERFORMANCE");

export const toIsoDayMs = (value: string | null) =>
  value ? Date.parse(`${value}T00:00:00Z`) : Number.NaN;

export const toLiveSnapshotRow = (
  currency: SnapshotCurrency,
  bucketDate: string,
  liveTotals: LiveTotals
): SnapshotChartRow => ({
  bucketDate,
  totalValuePln: currency === "PLN" ? liveTotals.totalValue : null,
  totalValueUsd: currency === "USD" ? liveTotals.totalValue : null,
  totalValueEur: currency === "EUR" ? liveTotals.totalValue : null,
  netExternalCashflowPln: 0,
  netExternalCashflowUsd: 0,
  netExternalCashflowEur: 0,
  netImplicitTransferPln: 0,
  netImplicitTransferUsd: 0,
  netImplicitTransferEur: 0,
  isPartialPln: currency === "PLN" ? liveTotals.isPartial : false,
  isPartialUsd: currency === "USD" ? liveTotals.isPartial : false,
  isPartialEur: currency === "EUR" ? liveTotals.isPartial : false,
});

export const toPerformanceRows = (
  rowsForReturns: readonly SnapshotChartRow[],
  currency: SnapshotCurrency,
  todayBucketDate: string,
  liveTotals: LiveTotals,
  canUseLiveEndpoint: boolean
): PerformanceInputRow[] => {
  const rows = rowsForReturns.map((row) => {
    const isToday = row.bucketDate === todayBucketDate;
    const canOverrideToday =
      isToday && canUseLiveEndpoint && liveTotals.totalValue !== null;

    return {
      bucketDate: row.bucketDate,
      totalValue: canOverrideToday
        ? liveTotals.totalValue
        : getTotalValue(row, currency),
      externalCashflow: getExternalCashflow(row, currency),
      implicitTransfer: getImplicitTransfer(row, currency),
      isPartial:
        getIsPartial(row, currency) || (canOverrideToday && liveTotals.isPartial),
    };
  });

  const hasTodayRow = rows.some((row) => row.bucketDate === todayBucketDate);
  if (!canUseLiveEndpoint || liveTotals.totalValue === null || hasTodayRow) {
    return rows;
  }

  return [
    ...rows,
    {
      bucketDate: todayBucketDate,
      totalValue: liveTotals.totalValue,
      externalCashflow: 0,
      implicitTransfer: 0,
      isPartial: liveTotals.isPartial,
    },
  ];
};
