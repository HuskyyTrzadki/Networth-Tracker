import type { CompaniesMarketCapAnnualHistoryPoint } from "@/features/market-data/server/companiesmarketcap/types";
import {
  mergeAnnualNumericHistory,
  pickYearEndValuesFromHistory,
} from "@/features/stocks/server/annual-history-merge";
import type { StockValuationHistoryPoint } from "@/features/stocks/server/types";

import type {
  HistoricalInsightWidget,
  InsightChartPoint,
} from "./stock-insights-widget-types";

type RatioMetricConfig = Readonly<{
  id: "pe-ratio" | "ps-ratio";
  title: string;
  subtitle: string;
  badge: string;
  seriesLabel: string;
  color: string;
  metric: "peTtm" | "priceToSales";
}>;

const METRIC_CONFIG: Readonly<Record<RatioMetricConfig["id"], RatioMetricConfig>> = {
  "pe-ratio": {
    id: "pe-ratio",
    title: "P/E",
    subtitle: "Cena do zysku",
    badge: "Mnozniki",
    seriesLabel: "P/E",
    color: "#b36b79",
    metric: "peTtm",
  },
  "ps-ratio": {
    id: "ps-ratio",
    title: "P/S",
    subtitle: "Cena do sprzedazy",
    badge: "Mnozniki",
    seriesLabel: "P/S",
    color: "#7c6ab2",
    metric: "priceToSales",
  },
} as const;

const parseIsoDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const formatDailyLabel = (dateString: string) => {
  const date = parseIsoDate(dateString);
  const month = date.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });

  return `${month} ${String(date.getUTCFullYear()).slice(-2)}`;
};

const formatAnnualLabel = (year: number, isTtm = false) =>
  `${isTtm ? "TTM" : "FY"} ${String(year).slice(-2)}`;

const getMetricValue = (
  point: StockValuationHistoryPoint,
  metric: RatioMetricConfig["metric"]
) => (metric === "peTtm" ? point.peTtm : point.priceToSales);

const toDailyPoints = (
  historyPoints: readonly StockValuationHistoryPoint[],
  metric: RatioMetricConfig["metric"]
) =>
  historyPoints.flatMap((point) => {
    const value = getMetricValue(point, metric);

    if (typeof value !== "number" || !Number.isFinite(value)) {
      return [];
    }

    const date = point.t.slice(0, 10);

    return [
      {
        period: formatDailyLabel(date),
        primary: value,
        date,
      } satisfies InsightChartPoint,
    ];
  });

const toAnnualPoints = (
  historyPoints: readonly StockValuationHistoryPoint[],
  metric: RatioMetricConfig["metric"],
  fallbackAnnualHistory: readonly CompaniesMarketCapAnnualHistoryPoint[]
) =>
  mergeAnnualNumericHistory(
    pickYearEndValuesFromHistory(historyPoints, {
      getDate: (point) => point.t.slice(0, 10),
      getValue: (point) => getMetricValue(point, metric),
    }),
    fallbackAnnualHistory
  ).map((point) => ({
    period: formatAnnualLabel(point.year, point.isTtm),
    primary: point.value,
    date: point.date,
  }));

const extendDetailedPointsWithAnnualHistory = (
  detailedPoints: readonly InsightChartPoint[],
  annualPoints: readonly InsightChartPoint[]
) => {
  if (detailedPoints.length === 0) {
    return annualPoints;
  }

  const firstDetailedDate = detailedPoints[0]?.date;

  if (!firstDetailedDate) {
    return detailedPoints;
  }

  const olderAnnualPoints = annualPoints.filter((point) => {
    const annualDate = point.date;
    return typeof annualDate === "string" && annualDate < firstDetailedDate;
  });

  return [...olderAnnualPoints, ...detailedPoints];
};

export function buildValuationRatioInsightWidget(input: Readonly<{
  kind: RatioMetricConfig["id"];
  historyPoints: readonly StockValuationHistoryPoint[];
  fallbackAnnualHistory?: readonly CompaniesMarketCapAnnualHistoryPoint[];
}>): HistoricalInsightWidget | null {
  const config = METRIC_CONFIG[input.kind];
  const dailyPoints = toDailyPoints(input.historyPoints, config.metric);
  const annualPoints = toAnnualPoints(
    input.historyPoints,
    config.metric,
    input.fallbackAnnualHistory ?? []
  );
  const bestAvailablePoints = extendDetailedPointsWithAnnualHistory(
    dailyPoints,
    annualPoints
  );

  if (bestAvailablePoints.length === 0 && annualPoints.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: config.id,
    title: config.title,
    subtitle: config.subtitle,
    badge: config.badge,
    valueFormat: "ratio",
    sourceLabel:
      (input.fallbackAnnualHistory?.length ?? 0) > 0
        ? "Yahoo Finance + CompaniesMarketCap"
        : "Yahoo Finance",
    emptyState: "Brak historii mnoznika dla tej spolki.",
    frequencyMode: "best-available",
    datasets: [
      {
        frequency: "daily",
        points: bestAvailablePoints,
      },
      {
        frequency: "annual",
        points: annualPoints,
      },
    ],
    series: [
      {
        key: "primary",
        label: config.seriesLabel,
        color: config.color,
        layer: "line",
      },
    ],
  };
}
