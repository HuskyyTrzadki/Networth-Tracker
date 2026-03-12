import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";
import type { CompaniesMarketCapAnnualHistoryPoint } from "@/features/market-data/server/companiesmarketcap/types";
import { mergeAnnualNumericHistory } from "@/features/stocks/server/annual-history-merge";

import type {
  HistoricalInsightWidget,
  InsightChartPoint,
  HistoricalInsightDataset,
} from "./stock-insights-widget-types";

const REVENUE_SERIES = [
  {
    key: "primary",
    label: "Revenue",
    color: "#6d9ef8",
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

const formatAnnualLabel = (periodEndDate: string, isTtm = false) => {
  const date = parseIsoDate(periodEndDate);
  const year = String(date.getUTCFullYear()).slice(-2);
  return isTtm ? `TTM ${year}` : `FY ${year}`;
};

const toPoint = (
  event: FundamentalSeriesEvent,
  frequency: HistoricalInsightDataset["frequency"]
): InsightChartPoint | null => {
  if (typeof event.value !== "number" || !Number.isFinite(event.value) || event.value <= 0) {
    return null;
  }

  return {
    period:
      frequency === "quarterly"
        ? formatQuarterLabel(event.periodEndDate)
        : formatAnnualLabel(event.periodEndDate),
    primary: toBillions(event.value),
    date: event.periodEndDate,
  };
};

const toRevenueDataset = (
  frequency: HistoricalInsightDataset["frequency"],
  events: readonly FundamentalSeriesEvent[]
): HistoricalInsightDataset => ({
  frequency,
  points: events
    .map((event) => toPoint(event, frequency))
    .filter((point): point is InsightChartPoint => point !== null),
});

const toYearKey = (periodEndDate: string) => periodEndDate.slice(0, 4);

const toQuarterNumber = (periodEndDate: string) =>
  Math.floor(parseIsoDate(periodEndDate).getUTCMonth() / 3) + 1;

const deriveAnnualEventsFromQuarterly = (
  quarterlyEvents: readonly FundamentalSeriesEvent[]
) =>
  Array.from(
    quarterlyEvents.reduce<Map<string, FundamentalSeriesEvent[]>>((result, event) => {
      if (
        event.periodType !== "FLOW_QUARTERLY" ||
        typeof event.value !== "number" ||
        !Number.isFinite(event.value) ||
        event.value <= 0
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
    .flatMap(([, events]) => {
      const sortedEvents = [...events].sort((left, right) =>
        left.periodEndDate.localeCompare(right.periodEndDate)
      );
      const quarterSet = new Set(sortedEvents.map((event) => toQuarterNumber(event.periodEndDate)));

      if (sortedEvents.length < 4 || quarterSet.size < 4) {
        return [];
      }

      const latestEvent = sortedEvents[sortedEvents.length - 1];
      const annualValue = sortedEvents.reduce(
        (sum, event) => sum + (event.value ?? 0),
        0
      );

      return [
        {
          periodEndDate: latestEvent.periodEndDate,
          value: annualValue,
          periodType: "TTM_PROXY_ANNUAL" as const,
          source: "quarterly_rollup" as const,
        },
      ];
    })
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));

const mergeAnnualRevenueEvents = (
  quarterlyEvents: readonly FundamentalSeriesEvent[],
  annualEvents: readonly FundamentalSeriesEvent[],
  fallbackAnnualHistory: readonly CompaniesMarketCapAnnualHistoryPoint[]
) => {
  const byYear = new Map<string, FundamentalSeriesEvent>();

  annualEvents.forEach((event) => {
    byYear.set(toYearKey(event.periodEndDate), event);
  });

  deriveAnnualEventsFromQuarterly(quarterlyEvents).forEach((event) => {
    byYear.set(toYearKey(event.periodEndDate), event);
  });

  fallbackAnnualHistory.forEach((point) => {
    if (typeof point.value !== "number" || !Number.isFinite(point.value) || point.value <= 0) {
      return;
    }

    const periodEndDate = `${point.year}-12-31`;
    byYear.set(String(point.year), {
      periodEndDate,
      value: point.value,
      periodType: "TTM_PROXY_ANNUAL",
      source: point.isTtm ? "trailing" : "annual_proxy",
    });
  });

  return Array.from(byYear.values()).sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );
};

const mergeAnnualRevenuePoints = (
  yahooPoints: readonly InsightChartPoint[],
  fallbackAnnualHistory: readonly CompaniesMarketCapAnnualHistoryPoint[]
) => {
  return mergeAnnualNumericHistory(
    yahooPoints.map((point) => ({
      year: Number((point.date ?? "").slice(0, 4)),
      date: point.date ?? "",
      value: point.primary * 1_000_000_000,
      isTtm: false,
      source: "primary" as const,
    })),
    fallbackAnnualHistory
  ).map((point) => ({
    period: formatAnnualLabel(point.date, point.isTtm),
    primary: toBillions(point.value),
    date: point.date,
  }));
};

export function buildRevenueInsightWidget(input: Readonly<{
  quarterlyEvents: readonly FundamentalSeriesEvent[];
  annualEvents: readonly FundamentalSeriesEvent[];
  fallbackAnnualHistory?: readonly CompaniesMarketCapAnnualHistoryPoint[];
}>): HistoricalInsightWidget | null {
  const hasAnnualFallback = (input.fallbackAnnualHistory?.length ?? 0) > 0;
  const quarterly = toRevenueDataset("quarterly", input.quarterlyEvents);
  const annual = toRevenueDataset(
    "annual",
    mergeAnnualRevenueEvents(
      input.quarterlyEvents,
      input.annualEvents,
      input.fallbackAnnualHistory ?? []
    )
  );
  const annualPoints = mergeAnnualRevenuePoints(annual.points, input.fallbackAnnualHistory ?? []);

  if (quarterly.points.length === 0 && annualPoints.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: "revenue",
    title: "Revenue",
    subtitle: "Przychody kwartalne i roczne",
    badge: "Przychody",
    valueFormat: "usd_billions",
    sourceLabel: hasAnnualFallback
      ? "Yahoo Finance + CompaniesMarketCap"
      : "Yahoo Finance",
    emptyState: "Brak historii przychodow dla tej spolki.",
    datasets: [
      {
        ...quarterly,
        points: quarterly.points,
      },
      {
        ...annual,
        points: annualPoints,
      },
    ],
    series: REVENUE_SERIES,
  };
}
