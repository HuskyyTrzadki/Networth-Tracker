import type {
  FundamentalSeriesEvent,
  FundamentalSeriesMetric,
  FundamentalSeriesPeriodType,
  FundamentalSeriesSource,
} from "./types";
import { toDateOrNull, toFiniteNumber, toIsoDate } from "./value-normalizers";

type YahooFinancialSeriesRow = Readonly<{
  periodType?: string;
  date?: Date | string | number;
  dilutedEPS?: number;
  basicEPS?: number;
}> &
  Readonly<Record<string, unknown>>;

const pickByFields = (
  row: YahooFinancialSeriesRow,
  fields: readonly string[]
): number | null =>
  fields
    .map((field) => toFiniteNumber(row[field]))
    .find((value): value is number => value !== null) ?? null;

const pickByKeyword = (
  row: YahooFinancialSeriesRow,
  keyword: string
): number | null =>
  Object.entries(row).reduce<number | null>((found, [key, value]) => {
    if (found !== null || !key.toLowerCase().includes(keyword)) {
      return found;
    }
    return toFiniteNumber(value);
  }, null);

const extractMetricValue = (
  row: YahooFinancialSeriesRow,
  metric: FundamentalSeriesMetric
) => {
  if (metric === "eps_ttm") {
    return (
      pickByFields(row, [
        "dilutedEPS",
        "basicEPS",
        "trailingDilutedEPS",
        "trailingBasicEPS",
        "reportedNormalizedDilutedEPS",
      ]) ?? pickByKeyword(row, "eps")
    );
  }

  return (
    pickByFields(row, [
      "totalRevenue",
      "operatingRevenue",
      "trailingTotalRevenue",
      "trailingOperatingRevenue",
      "quarterlyTotalRevenue",
      "quarterlyOperatingRevenue",
      "annualTotalRevenue",
      "annualOperatingRevenue",
    ]) ?? pickByKeyword(row, "revenue")
  );
};

const createEvent = (
  periodEndDate: string,
  value: number | null,
  periodType: FundamentalSeriesPeriodType,
  source: FundamentalSeriesSource
): FundamentalSeriesEvent => ({
  periodEndDate,
  value,
  periodType,
  source,
});

const sortByDateAsc = (rows: readonly FundamentalSeriesEvent[]) =>
  [...rows].sort((left, right) =>
    left.periodEndDate.localeCompare(right.periodEndDate)
  );

export const unwrapYahooRows = (raw: unknown): YahooFinancialSeriesRow[] => {
  if (Array.isArray(raw)) {
    return raw as YahooFinancialSeriesRow[];
  }

  const record = raw as
    | {
        timeseries?: {
          result?: unknown[];
        };
      }
    | undefined;

  if (Array.isArray(record?.timeseries?.result)) {
    return record.timeseries.result as YahooFinancialSeriesRow[];
  }

  return [];
};

type ParseRowsOptions = Readonly<{
  metric: FundamentalSeriesMetric;
  expectedPeriodType?: string;
  source: FundamentalSeriesSource;
  outputPeriodType: FundamentalSeriesPeriodType;
  skipFutureDates?: boolean;
}>;

export const parseFundamentalRows = (
  rows: readonly YahooFinancialSeriesRow[],
  options: ParseRowsOptions
): FundamentalSeriesEvent[] => {
  const todayIsoDate = toIsoDate(new Date());
  const byDate = rows.reduce<Map<string, FundamentalSeriesEvent>>((result, row) => {
    if (options.expectedPeriodType && row.periodType !== options.expectedPeriodType) {
      return result;
    }

    const date = toDateOrNull(row.date);
    if (!date) return result;

    const periodEndDate = toIsoDate(date);
    if (options.skipFutureDates && periodEndDate > todayIsoDate) {
      return result;
    }

    const value = extractMetricValue(row, options.metric);
    if (value === null) return result;

    result.set(
      periodEndDate,
      createEvent(
        periodEndDate,
        value,
        options.outputPeriodType,
        options.source
      )
    );

    return result;
  }, new Map<string, FundamentalSeriesEvent>());

  return sortByDateAsc(Array.from(byDate.values()));
};

export const buildTtmFromQuarterly = (
  rows: readonly FundamentalSeriesEvent[]
): FundamentalSeriesEvent[] => {
  if (rows.length < 4) return [];

  const sortedRows = sortByDateAsc(rows);
  return sortedRows
    .map((row, index, sourceRows) => {
      if (index < 3) return null;

      const window = sourceRows.slice(index - 3, index + 1);
      const ttm = window.reduce((sum, sourceRow) => sum + (sourceRow.value ?? 0), 0);
      if (!Number.isFinite(ttm)) return null;

      return createEvent(row.periodEndDate, ttm, "TTM", "quarterly_rollup");
    })
    .filter((row): row is FundamentalSeriesEvent => row !== null);
};

export const buildAnnualProxySeries = (
  rows: readonly FundamentalSeriesEvent[]
): FundamentalSeriesEvent[] =>
  rows.map((row) =>
    createEvent(
      row.periodEndDate,
      row.value,
      "TTM_PROXY_ANNUAL",
      "annual_proxy"
    )
  );

export const mergeSeriesWithPriority = (
  sources: readonly (readonly FundamentalSeriesEvent[])[]
): FundamentalSeriesEvent[] => {
  const byDate = sources.flat().reduce<Map<string, FundamentalSeriesEvent>>((result, row) => {
    if (result.has(row.periodEndDate)) {
      return result;
    }
    result.set(row.periodEndDate, row);
    return result;
  }, new Map<string, FundamentalSeriesEvent>());

  return sortByDateAsc(Array.from(byDate.values()));
};

export const __test__ = {
  toNumberOrNull: toFiniteNumber,
  unwrapYahooRows,
  parseFundamentalRows,
  buildTtmFromQuarterly,
  buildAnnualProxySeries,
  mergeSeriesWithPriority,
};
