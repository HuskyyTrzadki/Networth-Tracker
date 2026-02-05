import type { SnapshotCurrency } from "../../server/snapshots/supported-currencies";
import type { SnapshotChartRow } from "../../server/snapshots/types";
import type { PerformanceInputRow } from "./twr";

export type ChartMode = "VALUE" | "PERFORMANCE";
export type ChartRange = "1D" | "7D" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

export type RangeOption = Readonly<{
  value: ChartRange;
  label: string;
}>;

export const rangeOptions: readonly RangeOption[] = [
  { value: "1D", label: "1D" },
  { value: "7D", label: "7D" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "YTD", label: "YTD" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "ALL" },
];

const parseBucketDate = (value: string) =>
  new Date(`${value}T00:00:00Z`);

const getRangeStartDate = (anchorDate: Date, range: ChartRange) => {
  const start = new Date(anchorDate);

  if (range === "ALL") {
    return null;
  }

  if (range === "YTD") {
    return new Date(Date.UTC(anchorDate.getUTCFullYear(), 0, 1));
  }

  const rangeLengthDays: Record<ChartRange, number> = {
    "1D": 1,
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "1Y": 365,
    YTD: 0,
    ALL: 0,
  };
  const daysBack =
    rangeLengthDays[range] > 0 ? rangeLengthDays[range] - 1 : 0;

  start.setUTCDate(start.getUTCDate() - daysBack);
  return start;
};

export const getRangeRows = (
  rows: readonly SnapshotChartRow[],
  range: ChartRange
) => {
  if (rows.length === 0) {
    return { rows: [] as SnapshotChartRow[], rowsForReturns: [] as SnapshotChartRow[] };
  }

  const anchorDate = parseBucketDate(rows[rows.length - 1].bucketDate);
  const rangeStart = getRangeStartDate(anchorDate, range);

  if (!rangeStart) {
    return { rows: [...rows], rowsForReturns: [...rows] };
  }

  const startIndex = rows.findIndex(
    (row) => parseBucketDate(row.bucketDate) >= rangeStart
  );

  if (startIndex === -1) {
    return { rows: [] as SnapshotChartRow[], rowsForReturns: [] as SnapshotChartRow[] };
  }

  const rangeRows = rows.slice(startIndex);
  const previousRow = startIndex > 0 ? rows[startIndex - 1] : null;

  return {
    rows: rangeRows,
    rowsForReturns: previousRow ? [previousRow, ...rangeRows] : rangeRows,
  };
};

export const getTotalValue = (
  row: SnapshotChartRow,
  currency: SnapshotCurrency
) => {
  if (currency === "PLN") return row.totalValuePln;
  if (currency === "USD") return row.totalValueUsd;
  return row.totalValueEur;
};

export const getExternalCashflow = (
  row: SnapshotChartRow,
  currency: SnapshotCurrency
) => {
  if (currency === "PLN") return row.netExternalCashflowPln;
  if (currency === "USD") return row.netExternalCashflowUsd;
  return row.netExternalCashflowEur;
};

export const getImplicitTransfer = (
  row: SnapshotChartRow,
  currency: SnapshotCurrency
) => {
  if (currency === "PLN") return row.netImplicitTransferPln;
  if (currency === "USD") return row.netImplicitTransferUsd;
  return row.netImplicitTransferEur;
};

export const getIsPartial = (
  row: SnapshotChartRow,
  currency: SnapshotCurrency
) => {
  if (currency === "PLN") return row.isPartialPln;
  if (currency === "USD") return row.isPartialUsd;
  return row.isPartialEur;
};

export const toPerformanceRows = (
  rows: readonly SnapshotChartRow[],
  currency: SnapshotCurrency
): PerformanceInputRow[] =>
  rows.map((row) => ({
    bucketDate: row.bucketDate,
    totalValue: getTotalValue(row, currency),
    externalCashflow: getExternalCashflow(row, currency),
    implicitTransfer: getImplicitTransfer(row, currency),
    isPartial: getIsPartial(row, currency),
  }));

export const mergeLivePoint = (
  points: readonly { label: string; value: number }[],
  todayBucketDate: string,
  liveValue: number | null
) => {
  if (liveValue === null) return points;
  const last = points.at(-1);

  if (last?.label === todayBucketDate) {
    return [...points.slice(0, -1), { ...last, value: liveValue }];
  }

  return [...points, { label: todayBucketDate, value: liveValue }];
};

export const formatRangeLabel = (label: string) => label;

export const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value);

export const formatDayLabel = (label: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
  }).format(new Date(label));
