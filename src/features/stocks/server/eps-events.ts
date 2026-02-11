import type { EpsTtmEvent } from "./types";

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

export const toNumberOrNull = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const toDateOrNull = (value: unknown) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const normalizedValue =
      typeof value === "number" && value > 0 && value < 10_000_000_000
        ? value * 1000
        : value;
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

export const extractEpsFromRow = (row: YahooFinancialSeriesRow) => {
  const preferred =
    toNumberOrNull(row.dilutedEPS) ??
    toNumberOrNull(row.basicEPS) ??
    toNumberOrNull(row.trailingDilutedEPS) ??
    toNumberOrNull(row.trailingBasicEPS) ??
    toNumberOrNull(row.reportedNormalizedDilutedEPS);

  if (preferred !== null) {
    return preferred;
  }

  // Fallback for provider shape changes: pick any numeric EPS-like field.
  const dynamicField = Object.entries(row).find(([key, value]) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return false;
    return key.toLowerCase().includes("eps");
  });

  return dynamicField ? toNumberOrNull(dynamicField[1]) : null;
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
  const byDate = new Map<string, number | null>();

  rows.forEach((row) => {
    const date = toDateOrNull(row.date);
    if (!date) return;

    const periodEndDate = toIsoDate(date);
    const eps = extractEpsFromRow(row);
    if (eps === null) return;

    const existing = byDate.get(periodEndDate);
    if (existing !== null && existing !== undefined) return;
    byDate.set(periodEndDate, eps);
  });

  return Array.from(byDate.entries())
    .map(([periodEndDate, epsTtm]) => ({ periodEndDate, epsTtm }))
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));
};

export const parseQuarterlyRows = (
  rows: readonly YahooFinancialSeriesRow[]
): QuarterlyEpsEvent[] => {
  const byDate = new Map<string, number>();

  rows.forEach((row) => {
    const date = toDateOrNull(row.date);
    if (!date) return;
    if (row.periodType && row.periodType !== "3M") return;

    const eps = extractEpsFromRow(row);
    if (eps === null) return;

    byDate.set(toIsoDate(date), eps);
  });

  return Array.from(byDate.entries())
    .map(([periodEndDate, eps]) => ({ periodEndDate, eps }))
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));
};

export const buildTtmEventsFromQuarterly = (
  rows: readonly QuarterlyEpsEvent[]
): EpsTtmEvent[] => {
  if (rows.length < 4) return [];

  const result: EpsTtmEvent[] = [];
  for (let index = 3; index < rows.length; index += 1) {
    const window = rows.slice(index - 3, index + 1);
    const ttm = window.reduce((sum, row) => sum + row.eps, 0);
    result.push({
      periodEndDate: rows[index].periodEndDate,
      epsTtm: Number.isFinite(ttm) ? ttm : null,
    });
  }

  return result;
};

export const parseAnnualRows = (
  rows: readonly YahooFinancialSeriesRow[]
): AnnualEpsEvent[] => {
  const byDate = new Map<string, number>();
  const todayIsoDate = toIsoDate(new Date());

  rows.forEach((row) => {
    const date = toDateOrNull(row.date);
    if (!date) return;
    if (row.periodType && row.periodType !== "12M") return;

    const periodEndDate = toIsoDate(date);
    if (periodEndDate > todayIsoDate) return;

    const eps = extractEpsFromRow(row);
    if (eps === null) return;

    byDate.set(periodEndDate, eps);
  });

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
  const byDate = new Map<string, number | null>();

  sources.forEach((rows) => {
    rows.forEach((row) => {
      if (byDate.has(row.periodEndDate)) return;
      byDate.set(row.periodEndDate, row.epsTtm);
    });
  });

  return Array.from(byDate.entries())
    .map(([periodEndDate, epsTtm]) => ({ periodEndDate, epsTtm }))
    .sort((left, right) => left.periodEndDate.localeCompare(right.periodEndDate));
};
