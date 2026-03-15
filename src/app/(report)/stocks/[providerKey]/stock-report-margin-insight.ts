import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import type {
  HistoricalInsightWidget,
  InsightChartPoint,
} from "./stock-insights-widget-types";

type MarginWidgetConfig = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  seriesLabel: string;
  color: string;
  emptyState: string;
}>;

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

const toValueMap = (events: readonly FundamentalSeriesEvent[]) =>
  events.reduce<Map<string, number>>((result, event) => {
    if (typeof event.value !== "number" || !Number.isFinite(event.value)) {
      return result;
    }

    result.set(event.periodEndDate, event.value);
    return result;
  }, new Map<string, number>());

const buildMarginPoints = (
  frequency: "quarterly" | "annual",
  revenueEvents: readonly FundamentalSeriesEvent[],
  numeratorEvents: readonly FundamentalSeriesEvent[]
) => {
  const revenueByDate = toValueMap(revenueEvents);
  const numeratorByDate = toValueMap(numeratorEvents);
  const dates = Array.from(
    new Set([...revenueByDate.keys(), ...numeratorByDate.keys()])
  ).sort();

  return dates.flatMap((date) => {
    const revenue = revenueByDate.get(date);
    const numerator = numeratorByDate.get(date);

    if (
      revenue === undefined ||
      numerator === undefined ||
      !Number.isFinite(revenue) ||
      !Number.isFinite(numerator) ||
      revenue <= 0
    ) {
      return [];
    }

    return [
      {
        period:
          frequency === "quarterly" ? formatQuarterLabel(date) : formatAnnualLabel(date),
        primary: numerator / revenue,
        date,
      } satisfies InsightChartPoint,
    ];
  });
};

const toQuarterNumber = (periodEndDate: string) =>
  Math.floor(parseIsoDate(periodEndDate).getUTCMonth() / 3) + 1;

const toYearKey = (periodEndDate: string) => periodEndDate.slice(0, 4);

const deriveAnnualFlowEvents = (events: readonly FundamentalSeriesEvent[]) =>
  Array.from(
    events.reduce<Map<string, FundamentalSeriesEvent[]>>((result, event) => {
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
    .flatMap(([yearKey, yearEvents]) => {
      const sortedEvents = [...yearEvents].sort((left, right) =>
        left.periodEndDate.localeCompare(right.periodEndDate)
      );
      const quarterSet = new Set(
        sortedEvents.map((event) => toQuarterNumber(event.periodEndDate))
      );

      if (sortedEvents.length < 4 || quarterSet.size < 4) {
        return [];
      }

      const totalValue = sortedEvents.reduce((sum, event) => sum + (event.value ?? 0), 0);

      return [
        {
          periodEndDate: `${yearKey}-12-31`,
          value: totalValue,
          periodType: "FLOW_ANNUAL" as const,
          source: "quarterly_rollup" as const,
        },
      ];
    })
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));

const mergeAnnualFlowEvents = (
  annualEvents: readonly FundamentalSeriesEvent[],
  quarterlyEvents: readonly FundamentalSeriesEvent[]
) => {
  const byYear = new Map<string, FundamentalSeriesEvent>();

  annualEvents.forEach((event) => {
    byYear.set(toYearKey(event.periodEndDate), event);
  });

  deriveAnnualFlowEvents(quarterlyEvents).forEach((event) => {
    const yearKey = toYearKey(event.periodEndDate);
    if (!byYear.has(yearKey)) {
      byYear.set(yearKey, event);
    }
  });

  return Array.from(byYear.values()).sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );
};

export function buildMarginInsightWidget(
  config: MarginWidgetConfig,
  input: Readonly<{
    quarterlyRevenueEvents: readonly FundamentalSeriesEvent[];
    quarterlyNumeratorEvents: readonly FundamentalSeriesEvent[];
    annualRevenueEvents: readonly FundamentalSeriesEvent[];
    annualNumeratorEvents: readonly FundamentalSeriesEvent[];
  }>
): HistoricalInsightWidget | null {
  const quarterlyPoints = buildMarginPoints(
    "quarterly",
    input.quarterlyRevenueEvents,
    input.quarterlyNumeratorEvents
  );
  const annualPoints = buildMarginPoints(
    "annual",
    mergeAnnualFlowEvents(input.annualRevenueEvents, input.quarterlyRevenueEvents),
    mergeAnnualFlowEvents(
      input.annualNumeratorEvents,
      input.quarterlyNumeratorEvents
    )
  );

  if (quarterlyPoints.length === 0 && annualPoints.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: config.id,
    title: config.title,
    subtitle: config.subtitle,
    badge: "Efektywnosc",
    valueFormat: "percent",
    sourceLabel: "Yahoo Finance",
    emptyState: config.emptyState,
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
    series: [
      {
        key: "primary",
        label: config.seriesLabel,
        color: config.color,
        layer: "line",
        valueFormat: "percent",
      },
    ],
  };
}
