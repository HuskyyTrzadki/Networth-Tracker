import type { StockChartResponse, StockValuationRangeContext } from "./types";

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

export const buildPeValuationRangeContext = ({
  summaryPeTtm,
  chart,
}: Readonly<{
  summaryPeTtm: number | null;
  chart: StockChartResponse;
}>): StockValuationRangeContext => {
  const pePoints = chart.points
    .map((point) => ({
      value: point.pe,
      date: toDateOnly(point.t),
    }))
    .filter(
      (point): point is { value: number; date: string | null } =>
        typeof point.value === "number" && Number.isFinite(point.value)
    );

  if (pePoints.length === 0) {
    return {
      metric: "peTtm",
      current: summaryPeTtm,
      min: null,
      max: null,
      median: null,
      percentile: null,
      pointsCount: 0,
      coverageStart: null,
      coverageEnd: null,
      isTruncated: chart.resolvedRange !== "5Y",
      interpretation: "NO_DATA",
    };
  }

  const sortedValues = pePoints
    .map((point) => point.value)
    .sort((a, b) => a - b);
  const min = sortedValues[0] ?? null;
  const max = sortedValues[sortedValues.length - 1] ?? null;
  const safeCurrent = typeof summaryPeTtm === "number" ? summaryPeTtm : null;
  const percentile =
    safeCurrent === null || min === null || max === null
      ? null
      : min === max
        ? 0.5
        : clamp((safeCurrent - min) / (max - min), 0, 1);

  const validDates = pePoints
    .map((point) => point.date)
    .filter((value): value is string => value !== null)
    .sort();

  return {
    metric: "peTtm",
    current: summaryPeTtm,
    min,
    max,
    median: median(sortedValues),
    percentile,
    pointsCount: sortedValues.length,
    coverageStart: validDates[0] ?? null,
    coverageEnd: validDates[validDates.length - 1] ?? null,
    isTruncated: chart.resolvedRange !== "5Y",
    interpretation: resolveInterpretation(percentile, sortedValues.length),
  };
};

