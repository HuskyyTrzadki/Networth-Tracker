import type { FundamentalSeriesEvent } from "@/features/stocks/server/types";

import type {
  HistoricalInsightDataset,
  HistoricalInsightWidget,
  InsightChartPoint,
} from "./stock-insights-widget-types";

const CASH_DEBT_SERIES = [
  {
    key: "primary",
    label: "Gotowka",
    color: "#5a8d60",
    layer: "bar",
  },
  {
    key: "secondary",
    label: "Dlug",
    color: "#b8756f",
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

const toEventMap = (events: readonly FundamentalSeriesEvent[]) =>
  events.reduce<Map<string, number>>((result, event) => {
    if (typeof event.value !== "number" || !Number.isFinite(event.value) || event.value < 0) {
      return result;
    }

    result.set(event.periodEndDate, event.value);
    return result;
  }, new Map<string, number>());

const buildDataset = (
  frequency: HistoricalInsightDataset["frequency"],
  cashEvents: readonly FundamentalSeriesEvent[],
  debtEvents: readonly FundamentalSeriesEvent[]
): HistoricalInsightDataset => {
  const cashByDate = toEventMap(cashEvents);
  const debtByDate = toEventMap(debtEvents);
  const dates = Array.from(new Set([...cashByDate.keys(), ...debtByDate.keys()])).sort();

  return {
    frequency,
    points: dates.flatMap((date) => {
      const cash = cashByDate.get(date);
      const debt = debtByDate.get(date);

      if (cash === undefined && debt === undefined) {
        return [];
      }

      return [
        {
          period:
            frequency === "quarterly" ? formatQuarterLabel(date) : formatAnnualLabel(date),
          primary: toBillions(cash ?? 0),
          secondary: toBillions(debt ?? 0),
          date,
        } satisfies InsightChartPoint,
      ];
    }),
  };
};

const toYearKey = (periodEndDate: string) => periodEndDate.slice(0, 4);

const isYearEndQuarter = (event: FundamentalSeriesEvent) =>
  event.periodType === "POINT_IN_TIME" && event.periodEndDate.endsWith("-12-31");

const mergeAnnualBalanceEvents = (
  annualEvents: readonly FundamentalSeriesEvent[],
  quarterlyEvents: readonly FundamentalSeriesEvent[]
) => {
  const byYear = new Map<string, FundamentalSeriesEvent>();

  annualEvents.forEach((event) => {
    byYear.set(toYearKey(event.periodEndDate), event);
  });

  quarterlyEvents
    .filter((event) => isYearEndQuarter(event))
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

export function buildCashDebtInsightWidget(input: Readonly<{
  quarterlyCashEvents: readonly FundamentalSeriesEvent[];
  quarterlyDebtEvents: readonly FundamentalSeriesEvent[];
  annualCashEvents: readonly FundamentalSeriesEvent[];
  annualDebtEvents: readonly FundamentalSeriesEvent[];
}>): HistoricalInsightWidget | null {
  const quarterly = buildDataset(
    "quarterly",
    input.quarterlyCashEvents,
    input.quarterlyDebtEvents
  );
  const annual = buildDataset(
    "annual",
    mergeAnnualBalanceEvents(input.annualCashEvents, input.quarterlyCashEvents),
    mergeAnnualBalanceEvents(input.annualDebtEvents, input.quarterlyDebtEvents)
  );

  if (quarterly.points.length === 0 && annual.points.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: "cash-debt",
    title: "Gotowka i dlug",
    subtitle: "Gotowka vs zadluzenie",
    badge: "Bilans",
    valueFormat: "usd_billions",
    sourceLabel: "Yahoo Finance",
    emptyState: "Brak historii gotowki i dlugu dla tej spolki.",
    datasets: [quarterly, annual],
    series: CASH_DEBT_SERIES,
  };
}
