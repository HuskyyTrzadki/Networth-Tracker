import type { CompaniesMarketCapAnnualHistoryPoint } from "@/features/market-data/server/companiesmarketcap/types";

type AnnualPointSource = "primary" | "companiesmarketcap";

export type AnnualNumericHistoryPoint = Readonly<{
  year: number;
  date: string;
  value: number;
  isTtm: boolean;
  source: AnnualPointSource;
}>;

export const toAnnualDate = (year: number) => `${year}-12-31`;

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function mergeAnnualNumericHistory(
  primary: readonly AnnualNumericHistoryPoint[],
  fallback: readonly CompaniesMarketCapAnnualHistoryPoint[]
): readonly AnnualNumericHistoryPoint[] {
  const byYear = new Map<number, AnnualNumericHistoryPoint>();

  fallback.forEach((point) => {
    if (!isFiniteNumber(point.value)) {
      return;
    }

    byYear.set(point.year, {
      year: point.year,
      date: toAnnualDate(point.year),
      value: point.value,
      isTtm: point.isTtm,
      source: "companiesmarketcap",
    });
  });

  primary.forEach((point) => {
    byYear.set(point.year, point);
  });

  return Array.from(byYear.values()).sort((left, right) => left.year - right.year);
}

export function pickYearEndValuesFromHistory<T>(
  points: readonly T[],
  options: Readonly<{
    getDate: (point: T) => string;
    getValue: (point: T) => number | null;
  }>
): readonly AnnualNumericHistoryPoint[] {
  const byYear = new Map<number, AnnualNumericHistoryPoint>();

  points.forEach((point) => {
    const date = options.getDate(point);
    const year = Number(date.slice(0, 4));
    const value = options.getValue(point);

    if (!Number.isInteger(year) || !isFiniteNumber(value)) {
      return;
    }

    byYear.set(year, {
      year,
      date: toAnnualDate(year),
      value,
      isTtm: false,
      source: "primary",
    });
  });

  return Array.from(byYear.values()).sort((left, right) => left.year - right.year);
}

export function buildAsOfAnnualSeries(
  dates: readonly string[],
  annualHistory: readonly AnnualNumericHistoryPoint[]
): readonly (number | null)[] {
  const sortedAnnualHistory = [...annualHistory].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  let cursor = 0;
  let currentValue: number | null = null;

  return dates.map((date) => {
    while (
      cursor < sortedAnnualHistory.length &&
      sortedAnnualHistory[cursor]?.date <= date
    ) {
      currentValue = sortedAnnualHistory[cursor]?.value ?? null;
      cursor += 1;
    }

    return currentValue;
  });
}

export function fillOutsidePrimaryCoverage(
  dates: readonly string[],
  primaryValues: readonly (number | null)[],
  annualHistory: readonly AnnualNumericHistoryPoint[]
): readonly (number | null)[] {
  const firstPrimaryIndex = primaryValues.findIndex((value) => isFiniteNumber(value));
  const lastPrimaryIndex =
    primaryValues.length -
    1 -
    [...primaryValues].reverse().findIndex((value) => isFiniteNumber(value));

  if (firstPrimaryIndex === -1 || lastPrimaryIndex < 0) {
    return buildAsOfAnnualSeries(dates, annualHistory);
  }

  const annualValues = buildAsOfAnnualSeries(dates, annualHistory);

  return primaryValues.map((value, index) => {
    if (isFiniteNumber(value)) {
      return value;
    }

    if (index < firstPrimaryIndex || index > lastPrimaryIndex) {
      return annualValues[index] ?? null;
    }

    return value;
  });
}
