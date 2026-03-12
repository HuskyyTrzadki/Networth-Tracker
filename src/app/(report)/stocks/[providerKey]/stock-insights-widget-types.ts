export const INSIGHT_WIDGET_PERIODS = [
  "1Y",
  "2Y",
  "3Y",
  "5Y",
  "10Y",
  "ALL",
] as const;

export type InsightWidgetPeriod = (typeof INSIGHT_WIDGET_PERIODS)[number];

export type InsightSeriesKey = "primary" | "secondary" | "tertiary";

export type InsightValueFormat =
  | "usd_billions"
  | "usd_per_share"
  | "ratio"
  | "shares_billions";

export type InsightChartLayer = "bar" | "line" | "area";

export type InsightChartPoint = Readonly<{
  period: string;
  primary: number;
  secondary?: number;
  tertiary?: number;
  date?: string;
}>;

export type InsightSeries = Readonly<{
  key: InsightSeriesKey;
  label: string;
  color: string;
  layer: InsightChartLayer;
  valueFormat?: InsightValueFormat;
  stackId?: "total";
}>;

type InsightWidgetBase = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  valueFormat: InsightValueFormat;
}>;

export type StaticInsightWidget = InsightWidgetBase &
  Readonly<{
    kind: "static";
    description: string;
    implication: string;
    nextFocus: string;
    points: readonly InsightChartPoint[];
    series: readonly InsightSeries[];
  }>;

export type HistoricalInsightFrequency = "daily" | "quarterly" | "annual";

export type HistoricalInsightFrequencyMode = "manual" | "best-available";

export type HistoricalInsightDataset = Readonly<{
  frequency: HistoricalInsightFrequency;
  points: readonly InsightChartPoint[];
}>;

export type HistoricalInsightWidget = InsightWidgetBase &
  Readonly<{
    kind: "historical";
    series: readonly InsightSeries[];
    sourceLabel: string;
    emptyState: string;
    frequencyMode?: HistoricalInsightFrequencyMode;
    datasets: readonly HistoricalInsightDataset[];
  }>;

export type InsightWidget = StaticInsightWidget | HistoricalInsightWidget;
