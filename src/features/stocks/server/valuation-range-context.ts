import type {
  StockChartResponse,
  StockValuationHistoryPoint,
  StockValuationMetric,
  StockValuationRangeContext,
} from "./types";

const MIN_POINTS_FOR_CONTEXT = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toDateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const median = (sortedValues: readonly number[]) => {
  if (sortedValues.length === 0) return null;
  const middle = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 1) {
    return sortedValues[middle];
  }
  return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
};

const resolveInterpretation = (
  percentile: number | null,
  pointsCount: number
): StockValuationRangeContext["interpretation"] => {
  if (percentile === null) return "NO_DATA";
  if (pointsCount < MIN_POINTS_FOR_CONTEXT) return "INSUFFICIENT_HISTORY";
  if (percentile <= 0.2) return "HISTORY_LOW";
  if (percentile >= 0.8) return "HISTORY_HIGH";
  return "HISTORY_MID";
};

const getHistoryPointValue = (
  point: StockValuationHistoryPoint,
  metric: StockValuationMetric
) => {
  if (metric === "peTtm") return point.peTtm;
  if (metric === "priceToSales") return point.priceToSales;
  return point.priceToBook;
};

export const buildStockValuationRangeContext = ({
  metric,
  current,
  historyPoints,
  resolvedRange,
}: Readonly<{
  metric: StockValuationMetric;
  current: number | null;
  historyPoints: readonly StockValuationHistoryPoint[];
  resolvedRange: string;
}>): StockValuationRangeContext => {
  const metricPoints = historyPoints
    .map((point) => ({
      value: getHistoryPointValue(point, metric),
      date: toDateOnly(point.t),
    }))
    .filter(
      (point): point is { value: number; date: string | null } =>
        typeof point.value === "number" && Number.isFinite(point.value)
    );

  if (metricPoints.length === 0) {
    return {
      metric,
      current,
      min: null,
      max: null,
      median: null,
      percentile: null,
      pointsCount: 0,
      coverageStart: null,
      coverageEnd: null,
      isTruncated: resolvedRange !== "5Y",
      interpretation: "NO_DATA",
    };
  }

  const sortedValues = metricPoints
    .map((point) => point.value)
    .sort((a, b) => a - b);
  const min = sortedValues[0] ?? null;
  const max = sortedValues[sortedValues.length - 1] ?? null;
  const safeCurrent = typeof current === "number" ? current : null;
  const percentile =
    safeCurrent === null || min === null || max === null
      ? null
      : min === max
        ? 0.5
        : clamp((safeCurrent - min) / (max - min), 0, 1);

  const validDates = metricPoints
    .map((point) => point.date)
    .filter((value): value is string => value !== null)
    .sort();

  return {
    metric,
    current,
    min,
    max,
    median: median(sortedValues),
    percentile,
    pointsCount: sortedValues.length,
    coverageStart: validDates[0] ?? null,
    coverageEnd: validDates[validDates.length - 1] ?? null,
    isTruncated: resolvedRange !== "5Y",
    interpretation: resolveInterpretation(percentile, sortedValues.length),
  };
};

export const buildPeValuationRangeContext = ({
  summaryPeTtm,
  chart,
}: Readonly<{
  summaryPeTtm: number | null;
  chart: StockChartResponse;
}>): StockValuationRangeContext =>
  buildStockValuationRangeContext({
    metric: "peTtm",
    current: summaryPeTtm,
    resolvedRange: chart.resolvedRange,
    historyPoints: chart.points.map((point) => ({
      t: point.t,
      peTtm: point.pe,
      priceToSales: null,
      priceToBook: null,
    })),
  });
