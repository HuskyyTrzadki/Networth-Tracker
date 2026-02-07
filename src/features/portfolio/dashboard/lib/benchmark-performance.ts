import type { SnapshotCurrency } from "../../lib/supported-currencies";
import { computeCumulativeReturns, computeDailyReturns } from "./twr";
import {
  type DashboardBenchmarkSeries,
  getBenchmarkValueForCurrency,
} from "./benchmark-config";

export type BenchmarkReturnPoint = Readonly<{
  label: string;
  value: number | null;
}>;

const toDailyRows = (points: readonly BenchmarkReturnPoint[]) =>
  points.map((point) => ({
    bucketDate: point.label,
    totalValue: point.value,
    externalCashflow: 0,
    implicitTransfer: 0,
    isPartial: false,
  }));

export const toBenchmarkReturnSeries = (
  points: readonly BenchmarkReturnPoint[]
): BenchmarkReturnPoint[] => {
  const dailyReturns = computeDailyReturns(toDailyRows(points));
  const cumulative = computeCumulativeReturns(dailyReturns);

  return cumulative.map((entry) => ({
    label: entry.bucketDate,
    value: entry.value,
  }));
};

export const toBenchmarkReturnSeriesById = (
  benchmarks: DashboardBenchmarkSeries,
  currency: SnapshotCurrency,
  labels?: readonly string[]
) => {
  const toPoints = (
    series: DashboardBenchmarkSeries[keyof DashboardBenchmarkSeries]
  ) => {
    const byDate = new Map(series.map((point) => [point.date, point] as const));
    const effectiveLabels = labels ?? series.map((point) => point.date);

    return effectiveLabels.map((label) => {
      const point = byDate.get(label);

      return {
        label,
        value: point ? getBenchmarkValueForCurrency(point, currency) : null,
      };
    });
  };

  return {
    SP500: toBenchmarkReturnSeries(toPoints(benchmarks.SP500)),
    WIG20: toBenchmarkReturnSeries(toPoints(benchmarks.WIG20)),
    MWIG40: toBenchmarkReturnSeries(toPoints(benchmarks.MWIG40)),
  };
};
