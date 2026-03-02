import type { StockScreenerCard, StockScreenerPreviewRange } from "../server/types";

const LOOKBACK_DAYS: Readonly<Record<StockScreenerPreviewRange, number>> = {
  "1M": 31,
  "3M": 93,
  "6M": 186,
  "12M": 366,
};

const toUtcStartOfDay = (value: string) => Date.parse(`${value}T00:00:00.000Z`);

const toPeriodChangePercent = (series: readonly number[]) => {
  const start = series[0] ?? null;
  const end = series.at(-1) ?? null;
  if (start === null || end === null || start === 0) return null;
  return (end - start) / start;
};

export const resolveScreenerPreviewData = (
  previewChart: StockScreenerCard["previewChart"],
  range: StockScreenerPreviewRange
) => {
  if (previewChart.length === 0) {
    return {
      data: [] as StockScreenerCard["previewChart"],
      changePercent: null,
    };
  }

  const lastPoint = previewChart.at(-1) ?? null;
  if (!lastPoint) {
    return {
      data: [] as StockScreenerCard["previewChart"],
      changePercent: null,
    };
  }

  const lastTs = toUtcStartOfDay(lastPoint.date);
  if (!Number.isFinite(lastTs)) {
    return {
      data: previewChart,
      changePercent: toPeriodChangePercent(previewChart.map((point) => point.price)),
    };
  }

  const cutoffTs = lastTs - LOOKBACK_DAYS[range] * 24 * 60 * 60 * 1000;
  const filtered = previewChart.filter((point) => {
    const pointTs = toUtcStartOfDay(point.date);
    return Number.isFinite(pointTs) && pointTs >= cutoffTs;
  });

  const data =
    filtered.length >= 2
      ? filtered
      : previewChart.length >= 2
        ? previewChart.slice(Math.max(0, previewChart.length - 2))
        : previewChart;

  return {
    data,
    changePercent: toPeriodChangePercent(data.map((point) => point.price)),
  };
};
