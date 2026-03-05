import {
  buildSnapshotCurrencyMap,
  SNAPSHOT_CURRENCIES,
} from "../lib/supported-currencies";
import {
  type BenchmarkId,
  type BenchmarkSeriesPoint,
  type DashboardBenchmarkSeries,
  emptyDashboardBenchmarkSeries,
} from "../dashboard/lib/benchmark-config";
import {
  buildPairKey,
  convertPrice,
  toAsOfFxMap,
  toAsOfValueMap,
  type FxSeriesRow,
  type InstrumentSeriesRow,
} from "./benchmark-series-helpers";

type BuildDashboardBenchmarkSeriesInput = Readonly<{
  bucketDates: readonly string[];
  requestedBenchmarkIds: readonly BenchmarkId[];
  benchmarkProviderKeys: Readonly<Record<BenchmarkId, string>>;
  instrumentSeriesByProviderKey: ReadonlyMap<string, InstrumentSeriesRow[]>;
  fxSeriesByPair: ReadonlyMap<string, FxSeriesRow[]>;
}>;

const sortByDate = <T extends { date: string }>(rows: readonly T[]) =>
  [...rows].sort((left, right) => left.date.localeCompare(right.date));

const toEmptyBenchmarkPoint = (date: string): BenchmarkSeriesPoint => ({
  date,
  ...buildSnapshotCurrencyMap(() => null),
});

const toConvertedBenchmarkPoint = (
  date: string,
  close: string,
  sourceCurrency: string,
  fxAsOfByPair: ReadonlyMap<string, ReadonlyMap<string, FxSeriesRow | null>>
): BenchmarkSeriesPoint => ({
  date,
  ...buildSnapshotCurrencyMap((targetCurrency) =>
    convertPrice(
      close,
      sourceCurrency,
      targetCurrency,
      date,
      fxAsOfByPair.get(buildPairKey(sourceCurrency, targetCurrency)) ?? new Map(),
      fxAsOfByPair.get(buildPairKey(targetCurrency, sourceCurrency)) ?? new Map()
    )
  ),
});

export const getSourceCurrencies = (
  instrumentSeriesByProviderKey: ReadonlyMap<string, InstrumentSeriesRow[]>
) =>
  Array.from(
    new Set(
      Array.from(instrumentSeriesByProviderKey.values()).flatMap((rows) =>
        rows.map((row) => row.currency)
      )
    )
  );

export const getFxTargetCurrencies = () => [...SNAPSHOT_CURRENCIES];

export function buildDashboardBenchmarkSeries({
  bucketDates,
  requestedBenchmarkIds,
  benchmarkProviderKeys,
  instrumentSeriesByProviderKey,
  fxSeriesByPair,
}: BuildDashboardBenchmarkSeriesInput): DashboardBenchmarkSeries {
  if (bucketDates.length === 0) return emptyDashboardBenchmarkSeries();
  if (requestedBenchmarkIds.length === 0) return emptyDashboardBenchmarkSeries(bucketDates);

  const sortedBucketDates = [...bucketDates].sort((left, right) => left.localeCompare(right));

  const fxAsOfByPair = new Map<string, ReadonlyMap<string, FxSeriesRow | null>>();
  fxSeriesByPair.forEach((rows, pairKey) => {
    fxAsOfByPair.set(pairKey, toAsOfFxMap(sortByDate(rows), sortedBucketDates));
  });

  const result: Record<BenchmarkId, BenchmarkSeriesPoint[]> = {
    SP500: sortedBucketDates.map((date) => toEmptyBenchmarkPoint(date)),
    WIG20: sortedBucketDates.map((date) => toEmptyBenchmarkPoint(date)),
    MWIG40: sortedBucketDates.map((date) => toEmptyBenchmarkPoint(date)),
  };

  requestedBenchmarkIds.forEach((benchmarkId) => {
    const providerKey = benchmarkProviderKeys[benchmarkId];
    const rows = sortByDate(instrumentSeriesByProviderKey.get(providerKey) ?? []);
    const asOfByDate = toAsOfValueMap(rows, sortedBucketDates);

    result[benchmarkId] = sortedBucketDates.map((date) => {
      const point = asOfByDate.get(date) ?? null;
      if (!point) return toEmptyBenchmarkPoint(date);

      return toConvertedBenchmarkPoint(date, point.close, point.currency, fxAsOfByPair);
    });
  });

  return {
    SP500: result.SP500,
    WIG20: result.WIG20,
    MWIG40: result.MWIG40,
  };
}
