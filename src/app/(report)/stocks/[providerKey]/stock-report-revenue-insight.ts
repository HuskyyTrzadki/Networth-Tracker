import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import type {
  InsightChartPoint,
  InsightWidgetPeriod,
  RevenueInsightDataset,
  RevenueInsightFrequency,
  RevenueInsightWidget,
} from "./stock-insights-widget-types";

const PERIOD_YEAR_MAP: Readonly<Record<Exclude<InsightWidgetPeriod, "ALL">, number>> = {
  "1Y": 1,
  "2Y": 2,
  "3Y": 3,
  "5Y": 5,
  "10Y": 10,
};

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

const formatAnnualLabel = (periodEndDate: string) => {
  const date = parseIsoDate(periodEndDate);
  return `FY ${String(date.getUTCFullYear()).slice(-2)}`;
};

const toPoint = (
  event: FundamentalSeriesEvent,
  frequency: RevenueInsightFrequency
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
  frequency: RevenueInsightFrequency,
  events: readonly FundamentalSeriesEvent[]
): RevenueInsightDataset => ({
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
  annualEvents: readonly FundamentalSeriesEvent[]
) => {
  const byYear = new Map<string, FundamentalSeriesEvent>();

  annualEvents.forEach((event) => {
    byYear.set(toYearKey(event.periodEndDate), event);
  });

  deriveAnnualEventsFromQuarterly(quarterlyEvents).forEach((event) => {
    byYear.set(toYearKey(event.periodEndDate), event);
  });

  return Array.from(byYear.values()).sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );
};

const fallbackFrequency = (
  widget: RevenueInsightWidget
): RevenueInsightFrequency =>
  widget.datasets.some((dataset) => dataset.frequency === "quarterly" && dataset.points.length > 0)
    ? "quarterly"
    : "annual";

const datasetByFrequency = (
  widget: RevenueInsightWidget,
  frequency: RevenueInsightFrequency
) =>
  widget.datasets.find((dataset) => dataset.frequency === frequency) ??
  widget.datasets.find((dataset) => dataset.points.length > 0) ??
  null;

const getRequiredPointsForPeriod = (
  frequency: RevenueInsightFrequency,
  period: Exclude<InsightWidgetPeriod, "ALL">
) => {
  const years = PERIOD_YEAR_MAP[period];
  return frequency === "quarterly" ? years * 4 : years;
};

export function buildRevenueInsightWidget(input: Readonly<{
  quarterlyEvents: readonly FundamentalSeriesEvent[];
  annualEvents: readonly FundamentalSeriesEvent[];
}>): RevenueInsightWidget | null {
  const quarterly = toRevenueDataset("quarterly", input.quarterlyEvents);
  const annual = toRevenueDataset(
    "annual",
    mergeAnnualRevenueEvents(input.quarterlyEvents, input.annualEvents)
  );

  if (quarterly.points.length === 0 && annual.points.length === 0) {
    return null;
  }

  return {
    kind: "revenue",
    id: "revenue",
    title: "Revenue",
    subtitle: "Przychody kwartalne i roczne",
    badge: "Przychody",
    valueFormat: "usd_billions",
    sourceLabel: "Yahoo Finance",
    emptyState: "Brak historii przychodow z Yahoo dla tej spolki.",
    datasets: [
      {
        ...quarterly,
        // Keep one shared series definition so the generic chart renderer can stay simple.
        points: quarterly.points,
      },
      {
        ...annual,
        points: annual.points,
      },
    ],
    series: REVENUE_SERIES,
  };
}

export function resolveDefaultRevenueInsightFrequency(
  widget: RevenueInsightWidget
): RevenueInsightFrequency {
  return fallbackFrequency(widget);
}

export function getRevenueInsightAvailablePeriods(
  widget: RevenueInsightWidget,
  frequency: RevenueInsightFrequency
): InsightWidgetPeriod[] {
  const dataset = datasetByFrequency(widget, frequency);

  if (!dataset || dataset.points.length === 0) {
    return [];
  }

  const periods = (Object.entries(PERIOD_YEAR_MAP) as Array<
    [Exclude<InsightWidgetPeriod, "ALL">, number]
  >)
    .filter(([period]) => dataset.points.length >= getRequiredPointsForPeriod(frequency, period))
    .map(([period]) => period);

  return [...periods, "ALL"];
}

export function resolveDefaultRevenueInsightPeriod(
  widget: RevenueInsightWidget,
  frequency: RevenueInsightFrequency
): InsightWidgetPeriod {
  const availablePeriods = getRevenueInsightAvailablePeriods(widget, frequency);
  const longestBoundedPeriod = [...availablePeriods]
    .reverse()
    .find((period) => period !== "ALL");

  return longestBoundedPeriod ?? availablePeriods[0] ?? "ALL";
}

export function resolveVisibleRevenueInsightPoints(
  widget: RevenueInsightWidget,
  frequency: RevenueInsightFrequency,
  period: InsightWidgetPeriod
): readonly InsightChartPoint[] {
  const dataset = datasetByFrequency(widget, frequency);
  const points = dataset?.points ?? [];

  if (points.length === 0 || period === "ALL") {
    return points;
  }

  const requiredPoints = getRequiredPointsForPeriod(frequency, period);
  const visiblePoints = points.slice(-requiredPoints);

  return visiblePoints.length > 0 ? visiblePoints : points;
}
