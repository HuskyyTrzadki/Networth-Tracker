import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import type {
  HistoricalInsightWidget,
  InsightChartPoint,
} from "./stock-insights-widget-types";

const FREE_CASH_FLOW_SERIES = [
  {
    key: "primary",
    label: "FCF",
    color: "#c67a3c",
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

const toQuarterNumber = (periodEndDate: string) =>
  Math.floor(parseIsoDate(periodEndDate).getUTCMonth() / 3) + 1;

const toYearKey = (periodEndDate: string) => periodEndDate.slice(0, 4);

const toQuarterlyPoints = (events: readonly FundamentalSeriesEvent[]) =>
  events.flatMap((event) => {
    if (typeof event.value !== "number" || !Number.isFinite(event.value)) {
      return [];
    }

    return [
      {
        period: formatQuarterLabel(event.periodEndDate),
        primary: toBillions(event.value),
        date: event.periodEndDate,
      } satisfies InsightChartPoint,
    ];
  });

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

      return [
        {
          period: formatAnnualLabel(`${yearKey}-12-31`),
          primary: toBillions(annualValue),
          date: `${yearKey}-12-31`,
        } satisfies InsightChartPoint,
      ];
    })
    .sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""));

const toAnnualPoints = (annualEvents: readonly FundamentalSeriesEvent[]) =>
  annualEvents.flatMap((event) => {
    if (typeof event.value !== "number" || !Number.isFinite(event.value)) {
      return [];
    }

    return [
      {
        period: formatAnnualLabel(event.periodEndDate),
        primary: toBillions(event.value),
        date: event.periodEndDate,
      } satisfies InsightChartPoint,
    ];
  });

const mergeAnnualPoints = (
  quarterlyAnnualPoints: readonly InsightChartPoint[],
  directAnnualPoints: readonly InsightChartPoint[]
) => {
  const byYear = new Map<string, InsightChartPoint>();

  directAnnualPoints.forEach((point) => {
    byYear.set((point.date ?? "").slice(0, 4), point);
  });

  quarterlyAnnualPoints.forEach((point) => {
    const yearKey = (point.date ?? "").slice(0, 4);
    if (!byYear.has(yearKey)) {
      byYear.set(yearKey, point);
    }
  });

  return Array.from(byYear.values()).sort((left, right) =>
    (left.date ?? "").localeCompare(right.date ?? "")
  );
};

export function buildFreeCashFlowInsightWidget(input: Readonly<{
  quarterlyEvents: readonly FundamentalSeriesEvent[];
  annualEvents: readonly FundamentalSeriesEvent[];
}>): HistoricalInsightWidget | null {
  const quarterlyPoints = toQuarterlyPoints(input.quarterlyEvents);
  const annualPoints = mergeAnnualPoints(
    deriveAnnualPointsFromQuarterly(input.quarterlyEvents),
    toAnnualPoints(input.annualEvents)
  );

  if (quarterlyPoints.length === 0 && annualPoints.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: "free-cash-flow",
    title: "Wolne przeplywy pieniezne",
    subtitle: "Wolna gotowka po inwestycjach",
    badge: "Przeplywy",
    valueFormat: "usd_billions",
    sourceLabel: "Yahoo Finance",
    emptyState: "Brak historii wolnych przeplywow pienieznych dla tej spolki.",
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
    series: FREE_CASH_FLOW_SERIES,
  };
}
