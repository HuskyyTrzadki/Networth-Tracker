import type { InstrumentDividendSignals } from "@/features/market-data/server/get-instrument-dividend-signals-cached";

import type {
  HistoricalInsightWidget,
  InsightChartPoint,
} from "./stock-insights-widget-types";

const DIVIDENDS_SERIES = [
  {
    key: "primary",
    label: "Dywidenda/akcje",
    color: "#5fb7b8",
    layer: "bar",
  },
] as const;

const parseIsoDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const toAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const quarterKey = (date: Date) =>
  `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;

const yearKey = (date: Date) => String(date.getUTCFullYear());

const formatQuarterLabel = (year: number, quarter: number) =>
  `Q${quarter} ${String(year).slice(-2)}`;

const formatAnnualLabel = (year: number) => `FY ${String(year).slice(-2)}`;

const QUARTER_END_MONTH_DAY: Readonly<Record<number, string>> = {
  1: "03-31",
  2: "06-30",
  3: "09-30",
  4: "12-31",
};

const formatQuarterDate = (year: number, quarter: number) =>
  `${year}-${QUARTER_END_MONTH_DAY[quarter] ?? "12-31"}`;

const formatAnnualDate = (year: number) => `${year}-12-31`;

const groupDividendEvents = (signals: InstrumentDividendSignals) => {
  const quarterly = new Map<string, number>();
  const annual = new Map<string, number>();

  signals.pastEvents.forEach((event) => {
    const amount = toAmount(event.amountPerShare);
    const date = parseIsoDate(event.eventDate);

    if (amount === null || Number.isNaN(date.getTime())) {
      return;
    }

    quarterly.set(quarterKey(date), (quarterly.get(quarterKey(date)) ?? 0) + amount);
    annual.set(yearKey(date), (annual.get(yearKey(date)) ?? 0) + amount);
  });

  return { quarterly, annual };
};

const buildQuarterlyPoints = (grouped: ReadonlyMap<string, number>) => {
  const keys = Array.from(grouped.keys()).sort();
  const firstKey = keys[0];
  const lastKey = keys[keys.length - 1];

  if (!firstKey || !lastKey) {
    return [] as InsightChartPoint[];
  }

  const [firstYear, firstQuarter] = firstKey.split("-Q").map(Number);
  const [lastYear, lastQuarter] = lastKey.split("-Q").map(Number);
  const points: InsightChartPoint[] = [];
  let year = firstYear;
  let quarter = firstQuarter;

  while (year < lastYear || (year === lastYear && quarter <= lastQuarter)) {
    const key = `${year}-Q${quarter}`;
    points.push({
      period: formatQuarterLabel(year, quarter),
      primary: grouped.get(key) ?? 0,
      date: formatQuarterDate(year, quarter),
    });

    quarter += 1;
    if (quarter > 4) {
      quarter = 1;
      year += 1;
    }
  }

  return points;
};

const buildAnnualPoints = (grouped: ReadonlyMap<string, number>) => {
  const keys = Array.from(grouped.keys()).sort();
  const firstYear = Number(keys[0]);
  const lastYear = Number(keys[keys.length - 1]);

  if (!Number.isInteger(firstYear) || !Number.isInteger(lastYear)) {
    return [] as InsightChartPoint[];
  }

  const points: InsightChartPoint[] = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    points.push({
      period: formatAnnualLabel(year),
      primary: grouped.get(String(year)) ?? 0,
      date: formatAnnualDate(year),
    });
  }

  return points;
};

export function buildDividendsInsightWidget(
  signals: InstrumentDividendSignals
): HistoricalInsightWidget | null {
  const grouped = groupDividendEvents(signals);
  const quarterlyPoints = buildQuarterlyPoints(grouped.quarterly);
  const annualPoints = buildAnnualPoints(grouped.annual);

  if (quarterlyPoints.length === 0 && annualPoints.length === 0) {
    return null;
  }

  return {
    kind: "historical",
    id: "dividends",
    title: "Dywidendy",
    subtitle: "Dywidenda na akcje",
    badge: "Kapital",
    valueFormat: "usd_per_share",
    sourceLabel: "Yahoo Finance",
    emptyState: "Brak historii dywidendy dla tej spolki.",
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
    series: DIVIDENDS_SERIES,
  };
}
