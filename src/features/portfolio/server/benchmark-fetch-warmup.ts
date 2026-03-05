import { fetchYahooDailySeries } from "@/features/market-data/server/providers/yahoo/yahoo-daily";

import {
  buildPairKey,
  hasCoverage,
  normalizeNumber,
  type FxSeriesRow,
  type InstrumentSeriesRow,
} from "./benchmark-series-helpers";
import type {
  BenchmarkCacheRepository,
  FxDailyUpsertRow,
  InstrumentDailyUpsertRow,
} from "./benchmark-cache-repository";

type YahooDailySeries = Readonly<{
  currency: string;
  exchangeTimezone: string;
  candles: readonly Readonly<{
    date: string;
    asOf: string;
    open: string | number | null;
    high: string | number | null;
    low: string | number | null;
    close: string | number | null;
    volume: string | number | null;
  }>[];
}>;

export type BenchmarkPriceProvider = Readonly<{
  fetchDailySeries: (
    providerKey: string,
    fromDate: string,
    toDate: string
  ) => Promise<YahooDailySeries | null>;
}>;

type LoadBenchmarkInstrumentSeriesInput = Readonly<{
  repository: BenchmarkCacheRepository;
  providerName: string;
  provider: BenchmarkPriceProvider;
  providerKeys: readonly string[];
  fromDate: string;
  toDate: string;
  warmupFromDate: string;
}>;

type LoadFxSeriesInput = Readonly<{
  repository: BenchmarkCacheRepository;
  providerName: string;
  provider: BenchmarkPriceProvider;
  sourceCurrencies: readonly string[];
  targetCurrencies: readonly string[];
  fromDate: string;
  toDate: string;
  warmupFromDate: string;
}>;

const FETCH_TIMEOUT_MS = 5000;

const sortByDate = <T extends { date: string }>(rows: readonly T[]) =>
  [...rows].sort((left, right) => left.date.localeCompare(right.date));

const toFiniteNumber = (value: string | number | null) => {
  if (value === null) return null;

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const groupRowsByKey = <TRow,>(
  rows: readonly TRow[],
  getKey: (row: TRow) => string
) =>
  rows.reduce((accumulator, row) => {
    const key = getKey(row);
    const bucket = accumulator.get(key) ?? [];
    bucket.push(row);
    accumulator.set(key, bucket);
    return accumulator;
  }, new Map<string, TRow[]>());

const toInstrumentSeriesRow = (row: {
  price_date: string;
  currency: string;
  close: string | number;
}): InstrumentSeriesRow => ({
  date: row.price_date,
  currency: row.currency.toUpperCase(),
  close: normalizeNumber(row.close),
});

const toFxSeriesRow = (row: { rate_date: string; rate: string | number }): FxSeriesRow => ({
  date: row.rate_date,
  rate: normalizeNumber(row.rate),
});

export const yahooBenchmarkPriceProvider: BenchmarkPriceProvider = {
  async fetchDailySeries(providerKey, fromDate, toDate) {
    try {
      return await fetchYahooDailySeries(providerKey, fromDate, toDate, FETCH_TIMEOUT_MS);
    } catch (error) {
      // Benchmark overlays are optional; provider failures must not break dashboard rendering.
      console.error("[portfolio][benchmarks] Yahoo daily fetch failed", {
        providerKey,
        fromDate,
        toDate,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },
};

export async function loadBenchmarkInstrumentSeriesByProviderKey({
  repository,
  providerName,
  provider,
  providerKeys,
  fromDate,
  toDate,
  warmupFromDate,
}: LoadBenchmarkInstrumentSeriesInput): Promise<ReadonlyMap<string, InstrumentSeriesRow[]>> {
  const cachedInstrumentRows = await repository.readInstrumentRows(
    providerKeys,
    warmupFromDate,
    toDate
  );

  const groupedRows = groupRowsByKey(
    cachedInstrumentRows.map((row) => ({
      providerKey: row.provider_key,
      row: toInstrumentSeriesRow(row),
    })),
    (entry) => entry.providerKey
  );

  const seriesByProviderKey = new Map<string, InstrumentSeriesRow[]>();
  groupedRows.forEach((entries, providerKey) => {
    seriesByProviderKey.set(
      providerKey,
      sortByDate(entries.map((entry) => entry.row))
    );
  });

  const upserts: InstrumentDailyUpsertRow[] = [];

  for (const providerKey of providerKeys) {
    const currentRows = sortByDate(seriesByProviderKey.get(providerKey) ?? []);
    seriesByProviderKey.set(providerKey, currentRows);

    if (hasCoverage(currentRows.map((row) => row.date), fromDate, toDate)) {
      continue;
    }

    const fetched = await provider.fetchDailySeries(providerKey, warmupFromDate, toDate);
    if (!fetched) continue;

    const fetchedAt = new Date().toISOString();
    const fetchedSeriesRows: InstrumentSeriesRow[] = [];
    const fetchedUpserts: InstrumentDailyUpsertRow[] = [];

    fetched.candles.forEach((candle) => {
      const close = toFiniteNumber(candle.close);
      if (close === null) return;

      fetchedSeriesRows.push({
        date: candle.date,
        currency: fetched.currency.toUpperCase(),
        close: close.toString(),
      });

      fetchedUpserts.push({
        provider: providerName,
        provider_key: providerKey,
        price_date: candle.date,
        exchange_timezone: fetched.exchangeTimezone,
        currency: fetched.currency.toUpperCase(),
        open: toFiniteNumber(candle.open),
        high: toFiniteNumber(candle.high),
        low: toFiniteNumber(candle.low),
        close,
        volume: toFiniteNumber(candle.volume),
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });

    upserts.push(...fetchedUpserts);
    seriesByProviderKey.set(providerKey, sortByDate([...currentRows, ...fetchedSeriesRows]));
  }

  await repository.upsertInstrumentRows(upserts);
  return seriesByProviderKey;
}

export async function loadFxSeriesByPair({
  repository,
  providerName,
  provider,
  sourceCurrencies,
  targetCurrencies,
  fromDate,
  toDate,
  warmupFromDate,
}: LoadFxSeriesInput): Promise<ReadonlyMap<string, FxSeriesRow[]>> {
  const currencies = Array.from(new Set([...sourceCurrencies, ...targetCurrencies]));
  const cachedFxRows = await repository.readFxRows(currencies, warmupFromDate, toDate);

  const groupedRows = groupRowsByKey(
    cachedFxRows.map((row) => ({
      pairKey: buildPairKey(row.base_currency.toUpperCase(), row.quote_currency.toUpperCase()),
      row: toFxSeriesRow(row),
    })),
    (entry) => entry.pairKey
  );

  const seriesByPair = new Map<string, FxSeriesRow[]>();
  groupedRows.forEach((entries, pairKey) => {
    seriesByPair.set(
      pairKey,
      sortByDate(entries.map((entry) => entry.row))
    );
  });

  const pairsToFetch = new Set<string>();
  sourceCurrencies.forEach((from) => {
    targetCurrencies
      .filter((to) => to !== from)
      .forEach((to) => {
        const directKey = buildPairKey(from, to);
        const inverseKey = buildPairKey(to, from);
        const directRows = sortByDate(seriesByPair.get(directKey) ?? []);
        const inverseRows = sortByDate(seriesByPair.get(inverseKey) ?? []);

        seriesByPair.set(directKey, directRows);
        seriesByPair.set(inverseKey, inverseRows);

        const hasDirect = hasCoverage(directRows.map((row) => row.date), fromDate, toDate);
        const hasInverse = hasCoverage(inverseRows.map((row) => row.date), fromDate, toDate);
        if (!hasDirect && !hasInverse) {
          pairsToFetch.add(directKey);
          pairsToFetch.add(inverseKey);
        }
      });
  });

  const upserts: FxDailyUpsertRow[] = [];

  for (const pairKey of pairsToFetch) {
    const [from, to] = pairKey.split(":");
    if (!from || !to) continue;

    // Request both directions so conversion can fallback to inverse rates.
    const fetched = await provider.fetchDailySeries(`${from}${to}=X`, warmupFromDate, toDate);
    if (!fetched) continue;

    const currentRows = seriesByPair.get(pairKey) ?? [];
    const fetchedAt = new Date().toISOString();
    const fetchedRows: FxSeriesRow[] = [];
    const fetchedUpserts: FxDailyUpsertRow[] = [];

    fetched.candles.forEach((candle) => {
      const rate = toFiniteNumber(candle.close);
      if (rate === null) return;

      fetchedRows.push({
        date: candle.date,
        rate: rate.toString(),
      });

      fetchedUpserts.push({
        provider: providerName,
        base_currency: from,
        quote_currency: to,
        rate_date: candle.date,
        source_timezone: fetched.exchangeTimezone,
        rate,
        as_of: candle.asOf,
        fetched_at: fetchedAt,
      });
    });

    upserts.push(...fetchedUpserts);
    seriesByPair.set(pairKey, sortByDate([...currentRows, ...fetchedRows]));
  }

  await repository.upsertFxRows(upserts);
  return seriesByPair;
}
