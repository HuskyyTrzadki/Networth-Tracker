import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import type {
  HistoricalInsightDataset,
  HistoricalInsightWidget,
} from "./stock-insights-widget-types";

const SHARES_OUTSTANDING_SERIES = [
  {
    key: "primary",
    label: "Akcje w obiegu",
    color: "#6da3ba",
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

const formatAnnualLabel = (periodEndDate: string) => {
  const date = parseIsoDate(periodEndDate);
  return `FY ${String(date.getUTCFullYear()).slice(-2)}`;
};

const toValidEvents = (events: readonly FundamentalSeriesEvent[]) =>
  events.filter(
    (event): event is FundamentalSeriesEvent & { value: number } =>
      typeof event.value === "number" &&
      Number.isFinite(event.value) &&
      event.value > 0
  );

const toYearKey = (periodEndDate: string) => periodEndDate.slice(0, 4);

const mergeAnnualPointInTimeEvents = (
  annualEvents: readonly FundamentalSeriesEvent[],
  quarterlyEvents: readonly FundamentalSeriesEvent[]
) => {
  const byYear = new Map<string, FundamentalSeriesEvent>();

  toValidEvents(annualEvents).forEach((event) => {
    byYear.set(toYearKey(event.periodEndDate), event);
  });

  toValidEvents(quarterlyEvents)
    .filter((event) => event.periodEndDate.endsWith("-12-31"))
    .forEach((event) => {
      const yearKey = toYearKey(event.periodEndDate);
      if (!byYear.has(yearKey)) {
        byYear.set(yearKey, {
          ...event,
          periodType: "POINT_IN_TIME_ANNUAL",
          source: "annual_balance_sheet",
        });
      }
    });

  return Array.from(byYear.values()).sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );
};

const buildDataset = (
  frequency: HistoricalInsightDataset["frequency"],
  events: readonly FundamentalSeriesEvent[]
): HistoricalInsightDataset => ({
  frequency,
  points: toValidEvents(events).map((event) => ({
    period:
      frequency === "quarterly"
        ? formatQuarterLabel(event.periodEndDate)
        : formatAnnualLabel(event.periodEndDate),
    primary: toBillions(event.value),
    date: event.periodEndDate,
  })),
});

export function buildSharesOutstandingInsightWidget(input: Readonly<{
  quarterlyEvents: readonly FundamentalSeriesEvent[];
  annualEvents: readonly FundamentalSeriesEvent[];
}>): HistoricalInsightWidget | null {
  const quarterly = buildDataset("quarterly", input.quarterlyEvents);
  const annual = buildDataset(
    "annual",
    mergeAnnualPointInTimeEvents(input.annualEvents, input.quarterlyEvents)
  );

  if (quarterly.points.length === 0 && annual.points.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: "shares-outstanding",
    title: "Akcje w obiegu",
    subtitle: "Liczba akcji w obiegu",
    badge: "Akcje",
    valueFormat: "shares_billions",
    sourceLabel: "Yahoo Finance",
    emptyState: "Brak historii liczby akcji w obiegu dla tej spolki.",
    datasets: [quarterly, annual],
    series: SHARES_OUTSTANDING_SERIES,
  };
}
