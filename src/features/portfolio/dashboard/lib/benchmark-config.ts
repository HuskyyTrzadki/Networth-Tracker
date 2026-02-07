import {
  buildSnapshotCurrencyMap,
  type SnapshotCurrency,
  type SnapshotCurrencyMap,
} from "../../lib/supported-currencies";

export const BENCHMARK_IDS = ["SP500", "WIG20", "MWIG40"] as const;

export type BenchmarkId = (typeof BENCHMARK_IDS)[number];
export type ComparisonOptionId = BenchmarkId | "INFLATION_PL";

export type BenchmarkSeriesPoint = Readonly<{
  date: string;
}> &
  SnapshotCurrencyMap<number | null>;

export type DashboardBenchmarkSeries = Readonly<Record<BenchmarkId, readonly BenchmarkSeriesPoint[]>>;

export type ComparisonLineDefinition = Readonly<{
  id: ComparisonOptionId;
  label: string;
  color: string;
  strokeStyle?: "monotone" | "stepAfter";
}>;

export const benchmarkLineDefinitions: Readonly<Record<BenchmarkId, ComparisonLineDefinition>> = {
  SP500: {
    id: "SP500",
    label: "S&P 500 (VOO)",
    color: "var(--chart-2)",
  },
  WIG20: {
    id: "WIG20",
    label: "WIG20 (ETFBW20TR)",
    color: "var(--chart-4)",
  },
  MWIG40: {
    id: "MWIG40",
    label: "mWIG40 (ETFBM40TR)",
    color: "var(--chart-5)",
  },
};

export const inflationLineDefinition: ComparisonLineDefinition = {
  id: "INFLATION_PL",
  label: "Inflacja skumulowana (PL)",
  color: "var(--chart-3)",
  strokeStyle: "stepAfter",
};

export const emptyDashboardBenchmarkSeries = (
  dates: readonly string[] = []
): DashboardBenchmarkSeries => ({
  SP500: dates.map((date) => ({ date, ...buildSnapshotCurrencyMap(() => null) })),
  WIG20: dates.map((date) => ({ date, ...buildSnapshotCurrencyMap(() => null) })),
  MWIG40: dates.map((date) => ({ date, ...buildSnapshotCurrencyMap(() => null) })),
});

export const getBenchmarkValueForCurrency = (
  point: BenchmarkSeriesPoint,
  currency: SnapshotCurrency
) => point[currency];
