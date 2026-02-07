import { decimalOne, divideDecimals, multiplyDecimals, parseDecimalString } from "@/lib/decimal";

import type { SnapshotCurrency } from "../lib/supported-currencies";

type InstrumentSeriesRow = Readonly<{
  date: string;
  currency: string;
  close: string;
}>;

type FxSeriesRow = Readonly<{
  date: string;
  rate: string;
}>;

export type { InstrumentSeriesRow, FxSeriesRow };

export const buildPairKey = (from: string, to: string) => `${from}:${to}`;

export const normalizeNumber = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const DAY_MS = 86_400_000;

const toIsoDayMs = (value: string) => Date.parse(`${value}T00:00:00Z`);

const getGapDays = (fromDate: string, toDate: string) => {
  const fromMs = toIsoDayMs(fromDate);
  const toMs = toIsoDayMs(toDate);

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((toMs - fromMs) / DAY_MS);
};

export const hasCoverage = (
  dates: readonly string[],
  fromDate: string,
  toDate: string,
  maxGapDays = 10
) => {
  if (dates.length === 0) return false;

  const sorted = Array.from(new Set(dates)).sort((left, right) =>
    left.localeCompare(right)
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1] ?? first;

  if (first > fromDate && getGapDays(fromDate, first) > maxGapDays) return false;
  if (last < toDate && getGapDays(last, toDate) > maxGapDays) return false;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (getGapDays(previous, current) > maxGapDays) {
      return false;
    }
  }

  return true;
};

const toAsOfMap = <TRow extends { date: string }>(
  rows: readonly TRow[],
  bucketDates: readonly string[]
) => {
  let index = 0;
  let latest: TRow | null = null;
  const values = new Map<string, TRow | null>();

  bucketDates.forEach((date) => {
    while (index < rows.length && rows[index].date <= date) {
      latest = rows[index];
      index += 1;
    }

    values.set(date, latest);
  });

  return values;
};

export const toAsOfValueMap = (
  rows: readonly InstrumentSeriesRow[],
  bucketDates: readonly string[]
) => toAsOfMap(rows, bucketDates);

export const toAsOfFxMap = (
  rows: readonly FxSeriesRow[],
  bucketDates: readonly string[]
) => toAsOfMap(rows, bucketDates);

const toParsedNumber = (value: string) => {
  const parsed = parseDecimalString(value);
  return parsed ? Number(parsed.toString()) : null;
};

const getConversionRate = (
  date: string,
  directFxAsOfMap: ReadonlyMap<string, FxSeriesRow | null>,
  inverseFxAsOfMap: ReadonlyMap<string, FxSeriesRow | null>
) => {
  const directFx = directFxAsOfMap.get(date) ?? null;
  if (directFx) {
    const directRate = parseDecimalString(directFx.rate);
    if (directRate) return directRate;
  }

  const inverseFx = inverseFxAsOfMap.get(date) ?? null;
  if (inverseFx) {
    const inverseRate = parseDecimalString(inverseFx.rate);
    if (inverseRate) return divideDecimals(decimalOne(), inverseRate);
  }

  return null;
};

export const convertPrice = (
  close: string,
  fromCurrency: string,
  toCurrency: SnapshotCurrency,
  date: string,
  directFxAsOfMap: ReadonlyMap<string, FxSeriesRow | null>,
  inverseFxAsOfMap: ReadonlyMap<string, FxSeriesRow | null>
) => {
  if (fromCurrency === toCurrency) {
    return toParsedNumber(close);
  }

  const closeDecimal = parseDecimalString(close);
  if (!closeDecimal) return null;

  const conversionRate = getConversionRate(date, directFxAsOfMap, inverseFxAsOfMap);
  if (!conversionRate) return null;

  return Number(multiplyDecimals(closeDecimal, conversionRate).toString());
};
