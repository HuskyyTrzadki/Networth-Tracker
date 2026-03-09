import type {
  InsightChartPoint,
  InsightSeries,
  InsightValueFormat,
  InsightWidget,
} from "./stock-insights-widget-types";

const signedPercentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  signDisplay: "always",
  maximumFractionDigits: 1,
});

const ratioFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

const axisDecimalFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

export const truncateInsightPeriodLabel = (value: string) => value.replace(" ", "\n");

export const toSeriesValue = (
  point: InsightChartPoint,
  key: InsightSeries["key"]
) => {
  if (key === "primary") return point.primary;
  if (key === "secondary") return point.secondary ?? null;
  return point.tertiary ?? null;
};

export const formatInsightValue = (
  value: number | null | undefined,
  format: InsightValueFormat
) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  switch (format) {
    case "usd_billions":
      return `$${decimalFormatter.format(value)}B`;
    case "usd_per_share":
      return `$${decimalFormatter.format(value)}`;
    case "shares_billions":
      return `${decimalFormatter.format(value)}B`;
    case "ratio":
      return `${ratioFormatter.format(value)}x`;
    default:
      return decimalFormatter.format(value);
  }
};

export const formatInsightAxisValue = (
  value: number,
  format: InsightValueFormat
) => {
  switch (format) {
    case "usd_billions":
      return `$${axisDecimalFormatter.format(value)}B`;
    case "usd_per_share":
      return `$${axisDecimalFormatter.format(value)}`;
    case "shares_billions":
      return `${axisDecimalFormatter.format(value)}B`;
    case "ratio":
      return `${axisDecimalFormatter.format(value)}x`;
    default:
      return axisDecimalFormatter.format(value);
  }
};

export const shouldRenderInsightWidgetSubtitle = (widget: InsightWidget) => {
  const normalizedTitle = widget.title.trim().toLowerCase();
  const normalizedSubtitle = widget.subtitle.trim().toLowerCase();

  if (normalizedSubtitle.length === 0) {
    return false;
  }

  return normalizedTitle !== normalizedSubtitle;
};

export const resolveInsightWidgetCardStat = (
  widget: InsightWidget,
  points: readonly InsightChartPoint[]
) => {
  const first = points[0];
  const latest = points[points.length - 1];

  if (!first || !latest) {
    return "Brak danych";
  }

  if (widget.series.length === 1) {
    const current = toSeriesValue(latest, widget.series[0].key);
    const previous = toSeriesValue(first, widget.series[0].key);
    const change =
      typeof current === "number" &&
      typeof previous === "number" &&
      previous !== 0
        ? (current - previous) / Math.abs(previous)
        : null;

    return `${formatInsightValue(
      current,
      widget.series[0].valueFormat ?? widget.valueFormat
    )} • ${change === null ? "-" : signedPercentFormatter.format(change)}`;
  }

  if (widget.id === "cash-debt") {
    return `Gotowka ${formatInsightValue(latest.primary, "usd_billions")} • Dlug ${formatInsightValue(
      latest.secondary,
      "usd_billions"
    )}`;
  }

  if (widget.id === "expenses") {
    const total = latest.primary + (latest.secondary ?? 0);
    return `Razem ${formatInsightValue(total, "usd_billions")}`;
  }

  if (widget.id === "valuation") {
    return `P/E ${formatInsightValue(latest.primary, "ratio")} • EV/EBITDA ${formatInsightValue(
      latest.secondary,
      "ratio"
    )}`;
  }

  return "Trend kwartalny";
};
