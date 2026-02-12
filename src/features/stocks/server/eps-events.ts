import type { EpsTtmEvent } from "./types";
import { toDateOrNull, toFiniteNumber, toIsoDate } from "./value-normalizers";

export { toIsoDate } from "./value-normalizers";

export type YahooFinancialSeriesRow = Readonly<{
  TYPE?: string;
  periodType?: string;
  date?: Date | string | number;
  dilutedEPS?: number;
  basicEPS?: number;
}> &
  Readonly<Record<string, unknown>>;

type QuarterlyEpsEvent = Readonly<{
  periodEndDate: string;
  eps: number;
}>;

type AnnualEpsEvent = Readonly<{
  periodEndDate: string;
  eps: number;
}>;

export const toNumberOrNull = toFiniteNumber;

export const extractEpsFromRow = (row: YahooFinancialSeriesRow) => {
  const preferred =
    toFiniteNumber(row.dilutedEPS) ??
    toFiniteNumber(row.basicEPS) ??
    toFiniteNumber(row.trailingDilutedEPS) ??
    toFiniteNumber(row.trailingBasicEPS) ??
    toFiniteNumber(row.reportedNormalizedDilutedEPS);

  if (preferred !== null) {
    return preferred;
  }

  // Fallback for provider shape changes: pick any numeric EPS-like field.
  return Object.entries(row).reduce<number | null>((found, [key, value]) => {
    if (found !== null || !key.toLowerCase().includes("eps")) {
      return found;
    }
    return toFiniteNumber(value);
  }, null);
};

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

export const parseYahooRows = (
  rows: readonly YahooFinancialSeriesRow[]
): EpsTtmEvent[] => {
  const byDate = rows.reduce<Map<string, number | null>>((result, row) => {
    const date = toDateOrNull(row.date);
    if (!date) return result;

    const periodEndDate = toIsoDate(date);
    const eps = extractEpsFromRow(row);
    if (eps === null) return result;

    const existing = result.get(periodEndDate);
    if (existing !== null && existing !== undefined) return result;

    result.set(periodEndDate, eps);
    return result;
  }, new Map<string, number | null>());

  return Array.from(byDate.entries())
    .map(([periodEndDate, epsTtm]) => ({ periodEndDate, epsTtm }))
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));
};

export const parseQuarterlyRows = (
  rows: readonly YahooFinancialSeriesRow[]
): QuarterlyEpsEvent[] => {
  const byDate = rows.reduce<Map<string, number>>((result, row) => {
    const date = toDateOrNull(row.date);
    if (!date) return result;
    if (row.periodType && row.periodType !== "3M") return result;

    const eps = extractEpsFromRow(row);
    if (eps === null) return result;

    result.set(toIsoDate(date), eps);
    return result;
  }, new Map<string, number>());

  return Array.from(byDate.entries())
    .map(([periodEndDate, eps]) => ({ periodEndDate, eps }))
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));
};

export const buildTtmEventsFromQuarterly = (
  rows: readonly QuarterlyEpsEvent[]
): EpsTtmEvent[] => {
  if (rows.length < 4) return [];

  return rows
    .map((row, index, sourceRows) => {
      if (index < 3) return null;

      const window = sourceRows.slice(index - 3, index + 1);
      const ttm = window.reduce((sum, sourceRow) => sum + sourceRow.eps, 0);

      return {
        periodEndDate: row.periodEndDate,
        epsTtm: Number.isFinite(ttm) ? ttm : null,
      } satisfies EpsTtmEvent;
    })
    .filter((row): row is EpsTtmEvent => row !== null);
};

export const parseAnnualRows = (
  rows: readonly YahooFinancialSeriesRow[]
): AnnualEpsEvent[] => {
  const todayIsoDate = toIsoDate(new Date());
  const byDate = rows.reduce<Map<string, number>>((result, row) => {
    const date = toDateOrNull(row.date);
    if (!date) return result;
    if (row.periodType && row.periodType !== "12M") return result;

    const periodEndDate = toIsoDate(date);
    if (periodEndDate > todayIsoDate) return result;

    const eps = extractEpsFromRow(row);
    if (eps === null) return result;

    result.set(periodEndDate, eps);
    return result;
  }, new Map<string, number>());

  return Array.from(byDate.entries())
    .map(([periodEndDate, eps]) => ({ periodEndDate, eps }))
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));
};

export const buildApproxTtmEventsFromAnnual = (
  rows: readonly AnnualEpsEvent[]
): EpsTtmEvent[] =>
  rows.map((row) => ({
    periodEndDate: row.periodEndDate,
    // Approximation for old history: use annual EPS as TTM proxy.
    epsTtm: row.eps,
  }));

export const mergeEpsEventsWithPriority = (
  sources: readonly (readonly EpsTtmEvent[])[]
): EpsTtmEvent[] => {
  const byDate = sources.flat().reduce<Map<string, number | null>>((result, row) => {
    if (result.has(row.periodEndDate)) return result;
    result.set(row.periodEndDate, row.epsTtm);
    return result;
  }, new Map<string, number | null>());

  return Array.from(byDate.entries())
    .map(([periodEndDate, epsTtm]) => ({ periodEndDate, epsTtm }))
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));
};
