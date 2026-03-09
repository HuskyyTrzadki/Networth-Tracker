import type { PolishCpiPoint } from "@/features/market-data";

import type { LiveTotals } from "../../server/get-portfolio-live-totals";
import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { SnapshotChartRow } from "../../server/snapshots/types";
import {
  BENCHMARK_IDS,
  benchmarkLineDefinitions,
  inflationLineDefinition,
  type ComparisonLineDefinition,
  type ComparisonOptionId,
  type DashboardBenchmarkSeries,
} from "./benchmark-config";
import { toBenchmarkReturnSeriesById } from "./benchmark-performance";
import {
  computeCumulativeReturns,
  computeDailyReturns,
  computePeriodReturn,
} from "./twr";
import {
  type ChartMode,
  type ChartRange,
  type NullableSeriesPoint,
  getRangeRows,
  getTotalValue,
  hasRangeCoverage,
  mergeLivePoint,
  projectSeriesToRows,
  toComparisonChartData,
  toCumulativeInflationSeries,
  toInvestedCapitalSeries,
} from "./chart-helpers";
import { toPerformanceRows } from "../widgets/portfolio-value-over-time-chart-helpers";

type Input = Readonly<{
  rowsWithLiveAnchor: readonly SnapshotChartRow[];
  range: ChartRange;
  mode: ChartMode;
  currency: SnapshotCurrency;
  todayBucketDate: string;
  liveTotals: LiveTotals;
  canUseLiveEndpoint: boolean;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeriesState: DashboardBenchmarkSeries;
  selectedComparisons: readonly ComparisonOptionId[];
}>;

const toFiniteOrNull = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function buildPortfolioValueOverTimeViewModel(input: Input) {
  const {
    rowsWithLiveAnchor,
    range,
    mode,
    currency,
    todayBucketDate,
    liveTotals,
    canUseLiveEndpoint,
    polishCpiSeries,
    benchmarkSeriesState,
    selectedComparisons,
  } = input;

  const rangeMeta = getRangeRows(rowsWithLiveAnchor, range);

  const valuePoints = rangeMeta.rows
    .map((row) => {
      const value = getTotalValue(row, currency);
      if (value === null) return null;
      return { label: row.bucketDate, value };
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  const effectivePoints = mergeLivePoint(
    valuePoints,
    todayBucketDate,
    canUseLiveEndpoint ? liveTotals.totalValue : null
  );

  const fullInvestedCapitalSeries = toInvestedCapitalSeries(rowsWithLiveAnchor, currency);
  const investedCapitalSeries = projectSeriesToRows(
    rangeMeta.rows,
    fullInvestedCapitalSeries
  );
  const comparisonChartData = toComparisonChartData(
    effectivePoints,
    investedCapitalSeries,
    todayBucketDate
  );

  const performanceRows = toPerformanceRows(
    rangeMeta.rowsForReturns,
    currency,
    todayBucketDate,
    liveTotals,
    canUseLiveEndpoint
  );

  const dailyReturns = computeDailyReturns(performanceRows);
  const cumulativeReturns = computeCumulativeReturns(dailyReturns);
  const nominalCumulativeSeries: NullableSeriesPoint[] = cumulativeReturns.map((entry) => ({
    label: entry.bucketDate,
    value: entry.value,
  }));

  const inflationSeries = toCumulativeInflationSeries(
    cumulativeReturns.map((entry) => entry.bucketDate),
    polishCpiSeries.map((point) => ({
      periodDate: point.periodDate,
      value: point.value,
    }))
  );
  const hasInflationData = inflationSeries.some((entry) => entry.value !== null);

  const benchmarkReturnsById = toBenchmarkReturnSeriesById(
    benchmarkSeriesState,
    currency,
    rangeMeta.rowsForReturns.map((row) => row.bucketDate)
  );

  const nominalPeriodReturn = toFiniteOrNull(computePeriodReturn(dailyReturns).value);

  const inflationByDate = new Map(
    inflationSeries.map((entry) => [entry.label, entry.value] as const)
  );
  const benchmarkSeriesByIdAndDate = {
    SP500: new Map(
      benchmarkReturnsById.SP500.map((entry) => [entry.label, entry.value] as const)
    ),
    WIG20: new Map(
      benchmarkReturnsById.WIG20.map((entry) => [entry.label, entry.value] as const)
    ),
    MWIG40: new Map(
      benchmarkReturnsById.MWIG40.map((entry) => [entry.label, entry.value] as const)
    ),
  };

  const cumulativeChartData = nominalCumulativeSeries
    .map((entry) => {
      const comparisons: Record<string, number | null> = {};

      if (selectedComparisons.includes("INFLATION_PL") && currency === "PLN") {
        comparisons.INFLATION_PL = toFiniteOrNull(inflationByDate.get(entry.label) ?? null);
      }

      BENCHMARK_IDS.forEach((benchmarkId) => {
        if (!selectedComparisons.includes(benchmarkId)) {
          return;
        }

        comparisons[benchmarkId] = toFiniteOrNull(
          benchmarkSeriesByIdAndDate[benchmarkId].get(entry.label) ?? null
        );
      });

      const value = toFiniteOrNull(entry.value);

      return {
        label: entry.label,
        value,
        comparisons,
      };
    })
    .filter((entry) => {
      if (entry.value !== null) return true;

      return Object.values(entry.comparisons).some(
        (value) => typeof value === "number" && Number.isFinite(value)
      );
    });

  const hasPerformanceData = cumulativeChartData.length > 0;
  const hasValuePoints = effectivePoints.length > 0;
  const performancePartial = dailyReturns.some(
    (entry) => entry.value !== null && entry.isPartial
  );

  const latestPerformanceValue = toFiniteOrNull(
    [...performanceRows].reverse().find((row) => toFiniteOrNull(row.totalValue) !== null)
      ?.totalValue ?? null
  );

  const rangeValuedRows = rangeMeta.rows.filter(
    (row) => getTotalValue(row, currency) !== null
  );
  const hasSelectedPeriodComparison = rangeValuedRows.length >= 2;
  const rangeStartValue = rangeValuedRows.length
    ? toFiniteOrNull(getTotalValue(rangeValuedRows[0], currency))
    : null;
  const rangeEndValue = rangeValuedRows.length
    ? toFiniteOrNull(getTotalValue(rangeValuedRows[rangeValuedRows.length - 1], currency))
    : null;

  const selectedPeriodAbsoluteChange =
    hasSelectedPeriodComparison &&
    rangeStartValue !== null &&
    rangeEndValue !== null
      ? toFiniteOrNull(rangeEndValue - rangeStartValue)
      : null;
  const selectedPeriodChangePercent =
    hasSelectedPeriodComparison &&
    rangeStartValue !== null &&
    rangeStartValue !== 0 &&
    selectedPeriodAbsoluteChange !== null
      ? toFiniteOrNull(selectedPeriodAbsoluteChange / rangeStartValue)
      : null;
  const selectedPeriodPerformanceAbsoluteChange =
    nominalPeriodReturn !== null && latestPerformanceValue !== null
      ? toFiniteOrNull(latestPerformanceValue * nominalPeriodReturn)
      : null;

  const isRangeDisabled = (option: ChartRange) => {
    if (!hasRangeCoverage(rowsWithLiveAnchor, option)) return true;

    const optionRangeMeta = getRangeRows(rowsWithLiveAnchor, option);
    if (mode === "VALUE") {
      const count = optionRangeMeta.rows.filter(
        (row) => getTotalValue(row, currency) !== null
      ).length;
      const minRequired = option === "ALL" ? 1 : 2;
      return count < minRequired;
    }

    const optionPerformanceRows = toPerformanceRows(
      optionRangeMeta.rowsForReturns,
      currency,
      todayBucketDate,
      liveTotals,
      canUseLiveEndpoint
    );
    const returns = computeDailyReturns(optionPerformanceRows);
    const validReturns = returns.filter(
      (entry) => typeof entry.value === "number" && Number.isFinite(entry.value)
    ).length;
    return validReturns < 1;
  };

  const comparisonOptions: ComparisonLineDefinition[] = [
    ...(currency === "PLN" && hasInflationData ? [inflationLineDefinition] : []),
    benchmarkLineDefinitions.SP500,
    benchmarkLineDefinitions.WIG20,
    benchmarkLineDefinitions.MWIG40,
  ];
  const activeComparisonLines = comparisonOptions.filter((option) =>
    selectedComparisons.includes(option.id)
  );

  const getRequiredBenchmarkDates = (selectedRange: ChartRange) =>
    getRangeRows(rowsWithLiveAnchor, selectedRange).rowsForReturns.map(
      (row) => row.bucketDate
    );

  return {
    rangeMeta,
    investedCapitalSeries,
    comparisonChartData,
    cumulativeChartData,
    hasPerformanceData,
    hasValuePoints,
    performancePartial,
    nominalPeriodReturn,
    selectedPeriodAbsoluteChange,
    selectedPeriodPerformanceAbsoluteChange,
    selectedPeriodChangePercent,
    hasInflationData,
    comparisonOptions,
    activeComparisonLines,
    isRangeDisabled,
    getRequiredBenchmarkDates,
  };
}

export type PortfolioValueOverTimeViewModel = ReturnType<
  typeof buildPortfolioValueOverTimeViewModel
>;
