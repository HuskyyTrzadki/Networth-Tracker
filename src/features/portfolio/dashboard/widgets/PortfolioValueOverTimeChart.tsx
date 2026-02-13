"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrencyFormatter } from "@/lib/format-currency";

import type { PolishCpiPoint } from "@/features/market-data";
import type { LiveTotals } from "../../server/get-portfolio-live-totals";
import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { SnapshotScope, SnapshotChartRow } from "../../server/snapshots/types";
import {
  type BenchmarkId,
  type ComparisonOptionId,
  type DashboardBenchmarkSeries,
} from "../lib/benchmark-config";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import {
  type ChartMode,
  type ChartRange,
  formatDayLabelWithYear,
  getRangeRows,
  getTotalValue,
} from "../lib/chart-helpers";
import { buildPortfolioValueOverTimeViewModel } from "../lib/portfolio-value-over-time-view-model";
import { loadFullSnapshotHistory } from "../lib/load-full-snapshot-history";
import { PortfolioPerformanceModeContent } from "./PortfolioPerformanceModeContent";
import { PortfolioValueModeContent } from "./PortfolioValueModeContent";
import { PortfolioValueOverTimeHeader } from "./PortfolioValueOverTimeHeader";
import {
  MAX_LIVE_ANCHOR_GAP_DAYS,
  resolveInitialChartRange,
  resolveInitialChartMode,
  toIsoDayMs,
  toLiveSnapshotRow,
} from "./portfolio-value-over-time-chart-helpers";

type Props = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
  initialIncludesFullHistory: boolean;
  rows: readonly SnapshotChartRow[];
  todayBucketDate: string;
  liveTotalsByCurrency: Readonly<Record<SnapshotCurrency, LiveTotals>>;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeries: DashboardBenchmarkSeries;
  rebuild: SnapshotRebuildStatus;
}>;

export function PortfolioValueOverTimeChart({
  scope,
  portfolioId,
  hasHoldings,
  hasSnapshots,
  initialIncludesFullHistory,
  rows,
  todayBucketDate,
  liveTotalsByCurrency,
  polishCpiSeries,
  benchmarkSeries,
  rebuild,
}: Props) {
  const [currency, setCurrency] = useState<SnapshotCurrency>("PLN");
  const [mode, setMode] = useState<ChartMode>(() => resolveInitialChartMode(rows));
  const [range, setRange] = useState<ChartRange>(() => resolveInitialChartRange(rows));
  const [fullHistoryRows, setFullHistoryRows] = useState<
    readonly SnapshotChartRow[] | null
  >(null);
  const [isAllHistoryLoading, setIsAllHistoryLoading] = useState(false);
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
  const snapshotRows = fullHistoryRows ?? rows;
  const includesFullHistory = initialIncludesFullHistory || fullHistoryRows !== null;

  const shouldBootstrap = hasHoldings && !hasSnapshots && !bootstrapped;
  const rebuildStartDate = rebuild.fromDate ?? rebuild.dirtyFrom;

  const liveTotals = liveTotalsByCurrency[currency];

  const lastValuationBucketDate =
    [...snapshotRows].reverse().find((row) => getTotalValue(row, currency) !== null)
      ?.bucketDate ?? null;

  const lastSnapshotMs = toIsoDayMs(lastValuationBucketDate);
  const todayBucketMs = toIsoDayMs(todayBucketDate);
  const gapDaysFromSnapshotToToday =
    Number.isFinite(lastSnapshotMs) && Number.isFinite(todayBucketMs)
      ? Math.max(0, Math.floor((todayBucketMs - lastSnapshotMs) / 86_400_000))
      : null;

  const canUseLiveEndpoint =
    !rebuild.isBusy &&
    liveTotals.totalValue !== null &&
    (lastValuationBucketDate === null ||
      (gapDaysFromSnapshotToToday !== null &&
        gapDaysFromSnapshotToToday <= MAX_LIVE_ANCHOR_GAP_DAYS));

  const shouldAppendLiveAnchorRow =
    canUseLiveEndpoint && !snapshotRows.some((row) => row.bucketDate === todayBucketDate);

  const rowsWithLiveAnchor = shouldAppendLiveAnchorRow
    ? [...snapshotRows, toLiveSnapshotRow(currency, todayBucketDate, liveTotals)]
    : snapshotRows;

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

  const viewModel = buildPortfolioValueOverTimeViewModel({
    rowsWithLiveAnchor,
    range,
    mode,
    currency,
    todayBucketDate,
    liveTotals,
    canUseLiveEndpoint,
    polishCpiSeries,
    benchmarkSeriesState,
    selectedComparisons,
  });

  const currencyFormatter = getCurrencyFormatter(currency);
  const formatCurrencyValue = (value: number) =>
    currencyFormatter?.format(value) ?? value.toString();

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

  const ensureAllHistoryLoaded = async (): Promise<readonly SnapshotChartRow[] | null> => {
    if (includesFullHistory || isAllHistoryLoading) {
      return includesFullHistory ? snapshotRows : null;
    }

    setIsAllHistoryLoading(true);
    try {
      const payload = await loadFullSnapshotHistory({
        scope,
        portfolioId,
      });
      if (!payload) {
        return null;
      }

      if (payload.includesFullHistory) {
        setFullHistoryRows(payload.rows);
      }
      return payload.rows;
    } finally {
      setIsAllHistoryLoading(false);
    }
  };

  const getRequiredBenchmarkDatesForRows = (
    sourceRows: readonly SnapshotChartRow[],
    selectedRange: ChartRange
  ) => getRangeRows(sourceRows, selectedRange).rowsForReturns.map((row) => row.bucketDate);

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
      const requiredDates = viewModel.getRequiredBenchmarkDates(range);
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

          void (async () => {
            const rowsForRange =
              nextRange === "ALL"
                ? (await ensureAllHistoryLoaded()) ?? snapshotRows
                : snapshotRows;
            const requiredDates = getRequiredBenchmarkDatesForRows(
              rowsForRange,
              nextRange
            );
            selectedComparisons
              .filter((comparisonId): comparisonId is BenchmarkId =>
                comparisonId !== "INFLATION_PL"
              )
              .forEach((benchmarkId) => {
                void ensureBenchmarkSeriesLoaded(benchmarkId, requiredDates);
              });
          })();
        }}
        isRangeDisabled={viewModel.isRangeDisabled}
        currency={currency}
        onCurrencyChange={setCurrency}
        comparisonOptions={viewModel.comparisonOptions}
        selectedComparisons={selectedComparisons}
        loadingComparisons={loadingBenchmarkIds}
        onComparisonChange={handleComparisonChange}
        performancePartial={viewModel.performancePartial}
        valueIsPartial={liveTotals.totalValue !== null && liveTotals.isPartial}
        missingQuotes={liveTotals.missingQuotes}
        missingFx={liveTotals.missingFx}
        rebuildStatus={rebuild.status}
        rebuildMessage={rebuild.message}
        isAllHistoryLoading={isAllHistoryLoading}
        isAllHistoryTruncated={!includesFullHistory}
      />

      {mode === "VALUE" ? (
        <PortfolioValueModeContent
          rebuildStatus={rebuild.status}
          rebuildFromDate={rebuildStartDate}
          rebuildToDate={rebuild.toDate}
          rebuildProgressPercent={rebuild.progressPercent}
          hasHoldings={hasHoldings}
          shouldBootstrap={shouldBootstrap}
          hasValuePoints={viewModel.hasValuePoints}
          range={range}
          currency={currency}
          latestValue={viewModel.latestValue}
          dailyDelta={viewModel.dailyDelta}
          dailyDeltaPercent={viewModel.dailyDeltaPercent}
          selectedPeriodAbsoluteChange={viewModel.selectedPeriodAbsoluteChange}
          selectedPeriodChangePercent={viewModel.selectedPeriodChangePercent}
          comparisonChartData={viewModel.comparisonChartData}
          investedCapitalSeries={viewModel.investedCapitalSeries}
          formatCurrencyValue={formatCurrencyValue}
          formatDayLabelWithYear={formatDayLabelWithYear}
        />
      ) : (
        <PortfolioPerformanceModeContent
          rebuildStatus={rebuild.status}
          rebuildFromDate={rebuildStartDate}
          rebuildToDate={rebuild.toDate}
          rebuildProgressPercent={rebuild.progressPercent}
          hasHoldings={hasHoldings}
          shouldBootstrap={shouldBootstrap}
          hasPerformanceData={viewModel.hasPerformanceData}
          range={range}
          selectedPeriodReturn={viewModel.nominalPeriodReturn}
          selectedPeriodAbsoluteChange={viewModel.selectedPeriodAbsoluteChange}
          currency={currency}
          dailyReturnValue={viewModel.dailyReturnValue}
          cumulativeChartData={viewModel.cumulativeChartData}
          comparisonLines={viewModel.activeComparisonLines}
          formatCurrencyValue={formatCurrencyValue}
        />
      )}
    </div>
  );
}
