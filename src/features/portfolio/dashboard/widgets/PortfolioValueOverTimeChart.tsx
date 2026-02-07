"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/features/design-system/components/ui/tabs";
import { getCurrencyFormatter } from "@/lib/format-currency";

import type { PolishCpiPoint } from "@/features/market-data";
import type { LiveTotals } from "../../server/get-portfolio-live-totals";
import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { SnapshotScope, SnapshotChartRow } from "../../server/snapshots/types";
import {
  BENCHMARK_IDS,
  benchmarkLineDefinitions,
  inflationLineDefinition,
  type BenchmarkId,
  type ComparisonOptionId,
  type DashboardBenchmarkSeries,
} from "../lib/benchmark-config";
import { toBenchmarkReturnSeriesById } from "../lib/benchmark-performance";
import {
  computeCumulativeReturns,
  computeDailyReturns,
  computePeriodReturn,
} from "../lib/twr";
import { useSnapshotRebuild } from "../hooks/useSnapshotRebuild";
import {
  type ChartMode,
  type ChartRange,
  type NullableSeriesPoint,
  formatDayLabelWithYear,
  getRangeRows,
  getTotalValue,
  hasRangeCoverage,
  mergeLivePoint,
  projectSeriesToRows,
  toComparisonChartData,
  toCumulativeInflationSeries,
  toInvestedCapitalSeries,
} from "../lib/chart-helpers";
import { PortfolioPerformanceModeContent } from "./PortfolioPerformanceModeContent";
import { PortfolioValueModeContent } from "./PortfolioValueModeContent";
import { PortfolioValueOverTimeHeader } from "./PortfolioValueOverTimeHeader";
import {
  MAX_LIVE_ANCHOR_GAP_DAYS,
  toIsoDayMs,
  toLiveSnapshotRow,
  toPerformanceRows,
} from "./portfolio-value-over-time-chart-helpers";

const currencyLabels: Record<SnapshotCurrency, string> = {
  PLN: "PLN",
  USD: "USD",
  EUR: "EUR",
};

type Props = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
  rows: readonly SnapshotChartRow[];
  todayBucketDate: string;
  liveTotalsByCurrency: Readonly<Record<SnapshotCurrency, LiveTotals>>;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeries: DashboardBenchmarkSeries;
}>;

export function PortfolioValueOverTimeChart({
  scope,
  portfolioId,
  hasHoldings,
  hasSnapshots,
  rows,
  todayBucketDate,
  liveTotalsByCurrency,
  polishCpiSeries,
  benchmarkSeries,
}: Props) {
  const [currency, setCurrency] = useState<SnapshotCurrency>("PLN");
  const [mode, setMode] = useState<ChartMode>("PERFORMANCE");
  const [range, setRange] = useState<ChartRange>("YTD");
  const [selectedComparisons, setSelectedComparisons] = useState<ComparisonOptionId[]>([]);
  const [benchmarkSeriesState, setBenchmarkSeriesState] =
    useState<DashboardBenchmarkSeries>(benchmarkSeries);
  const [loadedBenchmarkDatesById, setLoadedBenchmarkDatesById] = useState<
    Record<BenchmarkId, readonly string[]>
  >({
    SP500: [],
    WIG20: [],
    MWIG40: [],
  });
  const [loadingBenchmarkIds, setLoadingBenchmarkIds] = useState<
    readonly BenchmarkId[]
  >([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const router = useRouter();

  const shouldBootstrap = hasHoldings && !hasSnapshots && !bootstrapped;
  const rebuild = useSnapshotRebuild(scope, portfolioId, hasHoldings);
  const rebuildStartDate = rebuild.fromDate ?? rebuild.dirtyFrom;
  const rebuildMessage = rebuild.isBusy
    ? `Aktualizujemy historię ${
        rebuildStartDate ? `od ${rebuildStartDate}` : "portfela"
      }.`
    : null;

  const liveTotals = liveTotalsByCurrency[currency];

  const lastValuationBucketDate =
    [...rows].reverse().find((row) => getTotalValue(row, currency) !== null)
      ?.bucketDate ?? null;

  const lastSnapshotMs = toIsoDayMs(lastValuationBucketDate);
  const todayBucketMs = toIsoDayMs(todayBucketDate);
  const gapDaysFromSnapshotToToday =
    Number.isFinite(lastSnapshotMs) && Number.isFinite(todayBucketMs)
      ? Math.max(0, Math.floor((todayBucketMs - lastSnapshotMs) / 86_400_000))
      : null;

  const canUseLiveEndpoint =
    liveTotals.totalValue !== null &&
    (lastValuationBucketDate === null ||
      (gapDaysFromSnapshotToToday !== null &&
        gapDaysFromSnapshotToToday <= MAX_LIVE_ANCHOR_GAP_DAYS));

  const shouldAppendLiveAnchorRow =
    canUseLiveEndpoint && !rows.some((row) => row.bucketDate === todayBucketDate);

  const rowsWithLiveAnchor = shouldAppendLiveAnchorRow
    ? [...rows, toLiveSnapshotRow(currency, todayBucketDate, liveTotals)]
    : rows;

  useEffect(() => {
    if (!shouldBootstrap) return;

    const payload = scope === "PORTFOLIO" ? { scope, portfolioId } : { scope };

    void fetch("/api/portfolio-snapshots/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).finally(() => {
      setBootstrapped(true);
      router.refresh();
    });
  }, [portfolioId, router, scope, shouldBootstrap]);

  const rangeMeta = getRangeRows(rowsWithLiveAnchor, range);

  const valuePoints = rangeMeta.rows
    .map((row) => {
      const value = getTotalValue(row, currency);
      if (value === null) return null;
      return { label: row.bucketDate, value };
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  const effectivePoints = mergeLivePoint(
    valuePoints,
    todayBucketDate,
    canUseLiveEndpoint ? liveTotals.totalValue : null
  );

  const fullInvestedCapitalSeries = toInvestedCapitalSeries(rowsWithLiveAnchor, currency);
  const investedCapitalSeries = projectSeriesToRows(
    rangeMeta.rows,
    fullInvestedCapitalSeries
  );
  const comparisonChartData = toComparisonChartData(
    effectivePoints,
    investedCapitalSeries,
    todayBucketDate
  );

  const performanceRows = toPerformanceRows(
    rangeMeta.rowsForReturns,
    currency,
    todayBucketDate,
    liveTotals,
    canUseLiveEndpoint
  );

  const dailyReturns = computeDailyReturns(performanceRows);
  const cumulativeReturns = computeCumulativeReturns(dailyReturns);
  const nominalCumulativeSeries: NullableSeriesPoint[] = cumulativeReturns.map((entry) => ({
    label: entry.bucketDate,
    value: entry.value,
  }));

  const inflationSeries = toCumulativeInflationSeries(
    cumulativeReturns.map((entry) => entry.bucketDate),
    polishCpiSeries.map((point) => ({
      periodDate: point.periodDate,
      value: point.value,
    }))
  );

  const hasInflationData = inflationSeries.some((entry) => entry.value !== null);

  const benchmarkReturnsById = toBenchmarkReturnSeriesById(
    benchmarkSeriesState,
    currency,
    rangeMeta.rowsForReturns.map((row) => row.bucketDate)
  );

  const nominalPeriodReturn = computePeriodReturn(dailyReturns).value;

  const inflationByDate = new Map(
    inflationSeries.map((entry) => [entry.label, entry.value] as const)
  );

  const benchmarkSeriesByIdAndDate = {
    SP500: new Map(
      benchmarkReturnsById.SP500.map((entry) => [entry.label, entry.value] as const)
    ),
    WIG20: new Map(
      benchmarkReturnsById.WIG20.map((entry) => [entry.label, entry.value] as const)
    ),
    MWIG40: new Map(
      benchmarkReturnsById.MWIG40.map((entry) => [entry.label, entry.value] as const)
    ),
  };

  const cumulativeChartData = nominalCumulativeSeries
    .filter((entry): entry is (typeof nominalCumulativeSeries)[number] & { value: number } =>
      entry.value !== null
    )
    .map((entry) => {
      const comparisons: Record<string, number | null> = {};

      if (selectedComparisons.includes("INFLATION_PL") && currency === "PLN") {
        comparisons.INFLATION_PL = inflationByDate.get(entry.label) ?? null;
      }

      BENCHMARK_IDS.forEach((benchmarkId) => {
        if (!selectedComparisons.includes(benchmarkId)) {
          return;
        }

        comparisons[benchmarkId] =
          benchmarkSeriesByIdAndDate[benchmarkId].get(entry.label) ?? null;
      });

      return {
        label: entry.label,
        value: entry.value,
        comparisons,
      };
    });

  const hasPerformanceData = cumulativeChartData.length > 0;
  const hasValuePoints = effectivePoints.length > 0;

  const performancePartial = dailyReturns.some(
    (entry) => entry.value !== null && entry.isPartial
  );

  const valuedRowsForSummary = rangeMeta.rowsForReturns.filter(
    (row) => getTotalValue(row, currency) !== null
  );
  const latestValue = valuedRowsForSummary.length
    ? getTotalValue(valuedRowsForSummary[valuedRowsForSummary.length - 1], currency)
    : null;
  const previousValue = valuedRowsForSummary.length > 1
    ? getTotalValue(valuedRowsForSummary[valuedRowsForSummary.length - 2], currency)
    : null;

  const dailyDelta =
    latestValue !== null && previousValue !== null
      ? latestValue - previousValue
      : null;
  const dailyDeltaPercent =
    dailyDelta !== null && previousValue && previousValue !== 0
      ? dailyDelta / previousValue
      : null;

  const dailyReturn = dailyReturns[dailyReturns.length - 1] ?? null;
  const dailyReturnValue = dailyReturn?.value ?? null;

  const isRangeDisabled = (option: ChartRange) => {
    if (!hasRangeCoverage(rowsWithLiveAnchor, option)) return true;

    const meta = getRangeRows(rowsWithLiveAnchor, option);
    if (mode === "VALUE") {
      const valueRows = option === "1D" ? meta.rowsForReturns : meta.rows;
      const count = valueRows.filter(
        (row) => getTotalValue(row, currency) !== null
      ).length;
      const minRequired = option === "ALL" ? 1 : 2;
      return count < minRequired;
    }

    const optionPerformanceRows = toPerformanceRows(
      meta.rowsForReturns,
      currency,
      todayBucketDate,
      liveTotals,
      canUseLiveEndpoint
    );
    const returns = computeDailyReturns(optionPerformanceRows);
    const validReturns = returns.filter((entry) => entry.value !== null).length;
    return validReturns < 1;
  };

  const currencyFormatter = getCurrencyFormatter(currency);
  const formatCurrencyValue = (value: number) =>
    currencyFormatter?.format(value) ?? value.toString();

  const comparisonOptions = [
    ...(currency === "PLN" && hasInflationData ? [inflationLineDefinition] : []),
    benchmarkLineDefinitions.SP500,
    benchmarkLineDefinitions.WIG20,
    benchmarkLineDefinitions.MWIG40,
  ];

  const activeComparisonLines = comparisonOptions.filter((option) =>
    selectedComparisons.includes(option.id)
  );

  const ensureBenchmarkSeriesLoaded = async (
    benchmarkId: BenchmarkId,
    requiredDates: readonly string[]
  ) => {
    if (requiredDates.length === 0) return;

    const loadedDates = new Set(loadedBenchmarkDatesById[benchmarkId]);
    const hasAllRequiredDates = requiredDates.every((date) => loadedDates.has(date));
    if (hasAllRequiredDates) return;

    setLoadingBenchmarkIds((current) =>
      current.includes(benchmarkId) ? current : [...current, benchmarkId]
    );

    try {
      const response = await fetch("/api/benchmarks/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benchmarkId,
          bucketDates: requiredDates,
        }),
      });
      if (!response.ok) return;

      const payload = (await response.json()) as {
        benchmarkId?: BenchmarkId;
        points?: DashboardBenchmarkSeries["SP500"];
      };
      if (payload.benchmarkId !== benchmarkId || !payload.points) return;

      setBenchmarkSeriesState((current) => ({
        ...current,
        [benchmarkId]: payload.points ?? [],
      }));
      setLoadedBenchmarkDatesById((current) => ({
        ...current,
        [benchmarkId]: Array.from(new Set([...current[benchmarkId], ...requiredDates])),
      }));
    } catch {
      // Optional overlay: ignore network failure and keep base chart intact.
    } finally {
      setLoadingBenchmarkIds((current) =>
        current.filter((id) => id !== benchmarkId)
      );
    }
  };

  const handleComparisonChange = (
    optionId: ComparisonOptionId,
    enabled: boolean
  ) => {
    setSelectedComparisons((current) => {
      if (enabled) {
        if (current.includes(optionId)) {
          return current;
        }

        return [...current, optionId];
      }

      return current.filter((id) => id !== optionId);
    });

    if (enabled && optionId !== "INFLATION_PL") {
      const requiredDates = rangeMeta.rowsForReturns.map((row) => row.bucketDate);
      void ensureBenchmarkSeriesLoaded(optionId, requiredDates);
    }
  };

  return (
    <div className="space-y-4">
      <PortfolioValueOverTimeHeader
        mode={mode}
        onModeChange={setMode}
        range={range}
        onRangeChange={(nextRange) => {
          setRange(nextRange);
          const requiredDates = getRangeRows(
            rowsWithLiveAnchor,
            nextRange
          ).rowsForReturns.map((row) => row.bucketDate);
          selectedComparisons
            .filter((comparisonId): comparisonId is BenchmarkId =>
              comparisonId !== "INFLATION_PL"
            )
            .forEach((benchmarkId) => {
              void ensureBenchmarkSeriesLoaded(benchmarkId, requiredDates);
            });
        }}
        isRangeDisabled={isRangeDisabled}
        comparisonOptions={comparisonOptions}
        selectedComparisons={selectedComparisons}
        loadingComparisons={loadingBenchmarkIds}
        onComparisonChange={handleComparisonChange}
        performancePartial={performancePartial}
        valueIsPartial={liveTotals.totalValue !== null && liveTotals.isPartial}
        missingQuotes={liveTotals.missingQuotes}
        missingFx={liveTotals.missingFx}
        rebuildStatus={rebuild.status}
        rebuildFromDate={rebuildStartDate}
        rebuildToDate={rebuild.toDate}
        rebuildProgressPercent={rebuild.progressPercent}
        rebuildMessage={rebuild.message}
      />

      <Tabs
        value={currency}
        onValueChange={(value) => setCurrency(value as SnapshotCurrency)}
      >
        <TabsList>
          {Object.entries(currencyLabels).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {mode === "VALUE" ? (
        <PortfolioValueModeContent
          rebuildMessage={rebuildMessage}
          hasHoldings={hasHoldings}
          shouldBootstrap={shouldBootstrap}
          hasValuePoints={hasValuePoints}
          range={range}
          currency={currency}
          latestValue={latestValue}
          dailyDelta={dailyDelta}
          dailyDeltaPercent={dailyDeltaPercent}
          comparisonChartData={comparisonChartData}
          investedCapitalSeries={investedCapitalSeries}
          formatCurrencyValue={formatCurrencyValue}
          formatDayLabelWithYear={formatDayLabelWithYear}
        />
      ) : (
        <PortfolioPerformanceModeContent
          rebuildMessage={rebuildMessage}
          hasHoldings={hasHoldings}
          shouldBootstrap={shouldBootstrap}
          hasPerformanceData={hasPerformanceData}
          range={range}
          selectedPeriodReturn={nominalPeriodReturn}
          dailyReturnValue={dailyReturnValue}
          cumulativeChartData={cumulativeChartData}
          comparisonLines={activeComparisonLines}
        />
      )}
    </div>
  );
}
