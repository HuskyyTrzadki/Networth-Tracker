import type { CompaniesMarketCapAnnualHistoryPoint } from "@/features/market-data/server/companiesmarketcap/types";
import { mergeAnnualNumericHistory } from "@/features/stocks/server/annual-history-merge";
import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import type {
  HistoricalInsightWidget,
  InsightChartPoint,
} from "./stock-insights-widget-types";

const EARNINGS_SERIES = [
  {
    key: "primary",
    label: "Earnings",
    color: "#78a98a",
    layer: "bar",
  },
] as const;

const toBillions = (value: number) => value / 1_000_000_000;

const parseIsoDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const formatQuarterLabel = (periodEndDate: string) => {
  const date = parseIsoDate(periodEndDate);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${quarter} ${String(date.getUTCFullYear()).slice(-2)}`;
};

const formatAnnualLabel = (year: number, isTtm = false) =>
  `${isTtm ? "TTM" : "FY"} ${String(year).slice(-2)}`;

const toQuarterlyPoint = (event: FundamentalSeriesEvent): InsightChartPoint | null => {
  if (typeof event.value !== "number" || !Number.isFinite(event.value)) {
    return null;
  }

  return {
    period: formatQuarterLabel(event.periodEndDate),
    primary: toBillions(event.value),
    date: event.periodEndDate,
  };
};

const toYearKey = (periodEndDate: string) => periodEndDate.slice(0, 4);

const toQuarterNumber = (periodEndDate: string) =>
  Math.floor(parseIsoDate(periodEndDate).getUTCMonth() / 3) + 1;

const deriveAnnualPointsFromQuarterly = (
  quarterlyEvents: readonly FundamentalSeriesEvent[]
) =>
  Array.from(
    quarterlyEvents.reduce<Map<string, FundamentalSeriesEvent[]>>((result, event) => {
      if (
        event.periodType !== "FLOW_QUARTERLY" ||
        typeof event.value !== "number" ||
        !Number.isFinite(event.value)
      ) {
        return result;
      }

      const yearKey = toYearKey(event.periodEndDate);
      const existing = result.get(yearKey) ?? [];
      existing.push(event);
      result.set(yearKey, existing);
      return result;
    }, new Map<string, FundamentalSeriesEvent[]>())
  )
    .flatMap(([yearKey, events]) => {
      const sortedEvents = [...events].sort((left, right) =>
        left.periodEndDate.localeCompare(right.periodEndDate)
      );
      const quarterSet = new Set(sortedEvents.map((event) => toQuarterNumber(event.periodEndDate)));

      if (sortedEvents.length < 4 || quarterSet.size < 4) {
        return [];
      }

      const annualValue = sortedEvents.reduce((sum, event) => sum + (event.value ?? 0), 0);
      const year = Number(yearKey);

      return [
        {
          period: formatAnnualLabel(year),
          primary: toBillions(annualValue),
          date: `${yearKey}-12-31`,
        } satisfies InsightChartPoint,
      ];
    })
    .sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""));

const mergeAnnualPoints = (
  yahooAnnualPoints: readonly InsightChartPoint[],
  fallbackAnnualHistory: readonly CompaniesMarketCapAnnualHistoryPoint[]
) => {
  return mergeAnnualNumericHistory(
    yahooAnnualPoints.map((point) => ({
      year: Number((point.date ?? "").slice(0, 4)),
      date: point.date ?? "",
      value: point.primary * 1_000_000_000,
      isTtm: false,
      source: "primary" as const,
    })),
    fallbackAnnualHistory
  ).map((point) => ({
    period: formatAnnualLabel(point.year, point.isTtm),
    primary: toBillions(point.value),
    date: point.date,
  }));
};

export function buildEarningsInsightWidget(input: Readonly<{
  quarterlyEvents: readonly FundamentalSeriesEvent[];
  fallbackAnnualHistory?: readonly CompaniesMarketCapAnnualHistoryPoint[];
}>): HistoricalInsightWidget | null {
  const hasAnnualFallback = (input.fallbackAnnualHistory?.length ?? 0) > 0;
  const quarterlyPoints = input.quarterlyEvents
    .map((event) => toQuarterlyPoint(event))
    .filter((point): point is InsightChartPoint => point !== null);
  const annualPoints = mergeAnnualPoints(
    deriveAnnualPointsFromQuarterly(input.quarterlyEvents),
    input.fallbackAnnualHistory ?? []
  );

  if (quarterlyPoints.length === 0 && annualPoints.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: "earnings",
    title: "Earnings",
    subtitle: "Zysk netto kwartalny i roczny",
    badge: "Zysk",
    valueFormat: "usd_billions",
    sourceLabel: hasAnnualFallback
      ? "Yahoo Finance + CompaniesMarketCap"
      : "Yahoo Finance",
    emptyState: "Brak historii zysku netto dla tej spolki.",
    datasets: [
      {
        frequency: "quarterly",
        points: quarterlyPoints,
      },
      {
        frequency: "annual",
        points: annualPoints,
      },
    ],
    series: EARNINGS_SERIES,
  };
}
