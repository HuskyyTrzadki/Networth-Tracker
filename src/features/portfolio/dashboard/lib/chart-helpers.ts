import type { SnapshotCurrency } from "../../server/snapshots/supported-currencies";
import type { SnapshotChartRow } from "../../server/snapshots/types";
import type { PerformanceInputRow } from "./twr";

export type ChartMode = "VALUE" | "PERFORMANCE";
export type ChartRange = "1D" | "7D" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

export type RangeOption = Readonly<{
  value: ChartRange;
  label: string;
}>;

export type NullableSeriesPoint = Readonly<{
  label: string;
  value: number | null;
}>;

export type InflationSeriesPoint = Readonly<{
  periodDate: string;
  value: number;
}>;

export type ComparisonChartPoint = Readonly<{
  label: string;
  portfolioValue: number;
  investedCapital: number | null;
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

const dayDiff = (later: Date, earlier: Date) =>
  Math.floor((later.getTime() - earlier.getTime()) / (24 * 60 * 60 * 1000));

// If the "previous row" is too old versus range start, using it would create
// misleading returns over a long data gap (e.g. 2024 -> 2026 jump).
const MAX_PREVIOUS_ROW_GAP_DAYS = 7;

const rangeLengthDays: Record<ChartRange, number> = {
  "1D": 1,
  "7D": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  YTD: 0,
  ALL: 0,
};

const getRangeStartDate = (anchorDate: Date, range: ChartRange) => {
  const start = new Date(anchorDate);

  if (range === "ALL") {
    return null;
  }

  if (range === "YTD") {
    return new Date(Date.UTC(anchorDate.getUTCFullYear(), 0, 1));
  }

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
  const firstRangeRow = rangeRows[0] ?? null;

  const shouldIncludePreviousRow =
    previousRow !== null &&
    firstRangeRow !== null &&
    dayDiff(
      parseBucketDate(firstRangeRow.bucketDate),
      parseBucketDate(previousRow.bucketDate)
    ) <= MAX_PREVIOUS_ROW_GAP_DAYS;

  return {
    rows: rangeRows,
    rowsForReturns: shouldIncludePreviousRow
      ? [previousRow, ...rangeRows]
      : rangeRows,
  };
};

export const hasRangeCoverage = (
  rows: readonly SnapshotChartRow[],
  range: ChartRange
) => {
  if (rows.length === 0) return false;
  if (range === "ALL") return true;
  if (range === "YTD") return rows.length > 0;
  if (rows.length < 2) return false;

  const last = parseBucketDate(rows[rows.length - 1].bucketDate);
  const first = parseBucketDate(rows[0].bucketDate);
  const spanDays = Math.floor(
    (last.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)
  );
  const requiredDaysBack = rangeLengthDays[range] > 0 ? rangeLengthDays[range] - 1 : 0;

  return spanDays >= requiredDaysBack;
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

export const toInvestedCapitalSeries = (
  rows: readonly SnapshotChartRow[],
  currency: SnapshotCurrency
): NullableSeriesPoint[] => {
  let cumulative = 0;
  let canAccumulate = true;
  let hasAnyKnownPoint = false;

  return rows.map((row) => {
    const externalCashflow = getExternalCashflow(row, currency);
    const implicitTransfer = getImplicitTransfer(row, currency);

    if (externalCashflow === null || implicitTransfer === null) {
      if (hasAnyKnownPoint) {
        canAccumulate = false;
      }
      return { label: row.bucketDate, value: null };
    }

    if (!canAccumulate) {
      return { label: row.bucketDate, value: null };
    }

    hasAnyKnownPoint = true;
    cumulative += externalCashflow + implicitTransfer;
    return { label: row.bucketDate, value: cumulative };
  });
};

export const projectSeriesToRows = (
  rows: readonly SnapshotChartRow[],
  series: readonly NullableSeriesPoint[]
): NullableSeriesPoint[] => {
  const seriesByLabel = new Map(
    series.map((point) => [point.label, point.value] as const)
  );

  return rows.map((row) => ({
    label: row.bucketDate,
    value: seriesByLabel.get(row.bucketDate) ?? null,
  }));
};

export const toCumulativeInflationSeries = (
  bucketDates: readonly string[],
  inflationPoints: readonly InflationSeriesPoint[]
): NullableSeriesPoint[] => {
  if (bucketDates.length === 0 || inflationPoints.length === 0) {
    return bucketDates.map((bucketDate) => ({ label: bucketDate, value: null }));
  }

  const sortedPoints = [...inflationPoints].sort((a, b) =>
    a.periodDate.localeCompare(b.periodDate)
  );
  let inflationIndex = 0;
  let latestKnownIndex: InflationSeriesPoint | null = null;
  let baseIndex: number | null = null;

  return bucketDates.map((bucketDate) => {
    while (
      inflationIndex < sortedPoints.length &&
      sortedPoints[inflationIndex].periodDate <= bucketDate
    ) {
      latestKnownIndex = sortedPoints[inflationIndex];
      inflationIndex += 1;
    }

    if (!latestKnownIndex) {
      return { label: bucketDate, value: null };
    }

    if (baseIndex === null) {
      baseIndex = latestKnownIndex.value;
    }

    if (!baseIndex || baseIndex <= 0) {
      return { label: bucketDate, value: null };
    }

    return {
      label: bucketDate,
      value: latestKnownIndex.value / baseIndex - 1,
    };
  });
};

export const toRealReturnSeries = (
  nominalReturns: readonly NullableSeriesPoint[],
  cumulativeInflation: readonly NullableSeriesPoint[]
): NullableSeriesPoint[] => {
  const inflationByLabel = new Map(
    cumulativeInflation.map((entry) => [entry.label, entry.value] as const)
  );

  return nominalReturns.map((nominalEntry) => {
    const inflationValue = inflationByLabel.get(nominalEntry.label) ?? null;

    if (nominalEntry.value === null || inflationValue === null) {
      return {
        label: nominalEntry.label,
        value: null,
      };
    }

    const denominator = 1 + inflationValue;
    if (denominator <= 0) {
      return {
        label: nominalEntry.label,
        value: null,
      };
    }

    return {
      label: nominalEntry.label,
      value: (1 + nominalEntry.value) / denominator - 1,
    };
  });
};

export const toComparisonChartData = (
  valuePoints: readonly { label: string; value: number }[],
  investedCapitalSeries: readonly NullableSeriesPoint[],
  todayBucketDate: string
): ComparisonChartPoint[] => {
  const investedCapitalByLabel = new Map(
    investedCapitalSeries.map((point) => [point.label, point.value] as const)
  );
  const latestKnownInvestedCapital = [...investedCapitalSeries]
    .reverse()
    .find((point) => point.value !== null)?.value ?? null;

  return valuePoints.map((point) => {
    const hasSnapshotPoint = investedCapitalByLabel.has(point.label);
    const investedCapitalValue = hasSnapshotPoint
      ? investedCapitalByLabel.get(point.label) ?? null
      : null;

    // UX rule: today's endpoint should stay visible even when today's
    // invested-capital snapshot is null (e.g. flow FX missing or cron timing).
    if (
      point.label === todayBucketDate &&
      investedCapitalValue === null &&
      latestKnownInvestedCapital !== null
    ) {
      return {
        label: point.label,
        portfolioValue: point.value,
        investedCapital: latestKnownInvestedCapital,
      };
    }

    if (hasSnapshotPoint) {
      return {
        label: point.label,
        portfolioValue: point.value,
        investedCapital: investedCapitalValue,
      };
    }

    return {
      label: point.label,
      portfolioValue: point.value,
      investedCapital: null,
    };
  });
};

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

export const formatDayLabelWithYear = (label: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(label));
