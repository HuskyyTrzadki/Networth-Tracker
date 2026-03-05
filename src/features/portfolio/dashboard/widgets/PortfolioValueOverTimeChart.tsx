"use client";

import { getCurrencyFormatter } from "@/lib/format-currency";

import type { PolishCpiPoint } from "@/features/market-data/types";
import type { LiveTotals } from "../../server/get-portfolio-live-totals";
import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { SnapshotScope, SnapshotChartRow } from "../../server/snapshots/types";
import {
  type BenchmarkId,
  type ComparisonOptionId,
  type DashboardBenchmarkSeries,
} from "../lib/benchmark-config";
import { buildPortfolioValueOverTimeViewModel } from "../lib/portfolio-value-over-time-view-model";
import { getRangeRows, getTotalValue, type ChartRange } from "../lib/chart-helpers";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import {
  MAX_LIVE_ANCHOR_GAP_DAYS,
  toIsoDayMs,
  toLiveSnapshotRow,
} from "./portfolio-value-over-time-chart-helpers";
import { PortfolioValueOverTimeChartContent } from "./PortfolioValueOverTimeChartContent";
import { usePortfolioChartDataLoading } from "./use-portfolio-chart-data-loading";
import { usePortfolioValueChartState } from "./use-portfolio-value-chart-state";

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
  const {
    state,
    setCurrency,
    setMode,
    setRange,
    setFullHistoryRows,
    setIsAllHistoryLoading,
    setSelectedComparisons,
    setBenchmarkSeriesOverrides,
    setLoadedBenchmarkDates,
    setLoadingBenchmarkIds,
    setBootstrapped,
    setBootstrapPending,
  } = usePortfolioValueChartState({ scope, portfolioId, rows });

  const snapshotRows = state.fullHistoryRows ?? rows;
  const includesFullHistory = initialIncludesFullHistory || state.fullHistoryRows !== null;
  const shouldBootstrap = hasHoldings && !hasSnapshots && !state.bootstrapped;

  const { ensureBenchmarkSeriesLoaded, ensureAllHistoryLoaded, handleBootstrapRequest } =
    usePortfolioChartDataLoading({
      scope,
      portfolioId,
      includesFullHistory,
      snapshotRows,
      shouldBootstrap,
      bootstrapPending: state.bootstrapPending,
      isAllHistoryLoading: state.isAllHistoryLoading,
      loadingBenchmarkIds: state.loadingBenchmarkIds,
      loadedBenchmarkDatesById: state.loadedBenchmarkDatesById,
      benchmarkSeriesOverrides: state.benchmarkSeriesOverrides,
      setBootstrapPending,
      setBootstrapped,
      setIsAllHistoryLoading,
      setFullHistoryRows,
      setLoadingBenchmarkIds,
      setLoadedBenchmarkDates,
      setBenchmarkSeriesOverrides,
    });

  const rebuildStartDate = rebuild.fromDate ?? rebuild.dirtyFrom;
  const liveTotals = liveTotalsByCurrency[state.currency];
  const transactionCreateHref = portfolioId
    ? `/transactions/new?portfolio=${portfolioId}`
    : "/transactions/new";
  const cashDepositHref = portfolioId
    ? `/transactions/new?portfolio=${portfolioId}&preset=cash-deposit`
    : "/transactions/new?preset=cash-deposit";

  const lastValuationBucketDate =
    [...snapshotRows].reverse().find((row) => getTotalValue(row, state.currency) !== null)
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
    ? [...snapshotRows, toLiveSnapshotRow(state.currency, todayBucketDate, liveTotals)]
    : snapshotRows;

  const benchmarkSeriesState: DashboardBenchmarkSeries = {
    SP500: state.benchmarkSeriesOverrides.SP500 ?? benchmarkSeries.SP500,
    WIG20: state.benchmarkSeriesOverrides.WIG20 ?? benchmarkSeries.WIG20,
    MWIG40: state.benchmarkSeriesOverrides.MWIG40 ?? benchmarkSeries.MWIG40,
  };

  const viewModel = buildPortfolioValueOverTimeViewModel({
    rowsWithLiveAnchor,
    range: state.range,
    mode: state.mode,
    currency: state.currency,
    todayBucketDate,
    liveTotals,
    canUseLiveEndpoint,
    polishCpiSeries,
    benchmarkSeriesState,
    selectedComparisons: state.selectedComparisons,
  });

  const currencyFormatter = getCurrencyFormatter(state.currency);
  const formatCurrencyValue = (value: number) =>
    currencyFormatter?.format(value) ?? value.toString();

  const getRequiredBenchmarkDatesForRows = (
    sourceRows: readonly SnapshotChartRow[],
    selectedRange: ChartRange
  ) => getRangeRows(sourceRows, selectedRange).rowsForReturns.map((row) => row.bucketDate);

  const handleComparisonChange = (optionId: ComparisonOptionId, enabled: boolean) => {
    const nextComparisons = (() => {
      const current = state.selectedComparisons;
      if (enabled) {
        if (current.includes(optionId)) {
          return current;
        }

        return [...current, optionId];
      }

      return current.filter((id) => id !== optionId);
    })();

    setSelectedComparisons(nextComparisons);

    if (enabled && optionId !== "INFLATION_PL") {
      const requiredDates = viewModel.getRequiredBenchmarkDates(state.range);
      void ensureBenchmarkSeriesLoaded(optionId, requiredDates);
    }
  };

  return (
    <PortfolioValueOverTimeChartContent
      mode={state.mode}
      range={state.range}
      currency={state.currency}
      selectedComparisons={state.selectedComparisons}
      loadingBenchmarkIds={state.loadingBenchmarkIds}
      rebuild={rebuild}
      rebuildStartDate={rebuildStartDate}
      bootstrapPending={state.bootstrapPending}
      hasHoldings={hasHoldings}
      shouldBootstrap={shouldBootstrap}
      viewModel={viewModel}
      isAllHistoryLoading={state.isAllHistoryLoading}
      includesFullHistory={includesFullHistory}
      transactionCreateHref={transactionCreateHref}
      cashDepositHref={cashDepositHref}
      onModeChange={setMode}
      onRangeChange={(nextRange) => {
        setRange(nextRange);

        void (async () => {
          const rowsForRange =
            nextRange === "ALL" ? (await ensureAllHistoryLoaded()) ?? snapshotRows : snapshotRows;
          const requiredDates = getRequiredBenchmarkDatesForRows(rowsForRange, nextRange);

          state.selectedComparisons
            .filter(
              (comparisonId): comparisonId is BenchmarkId => comparisonId !== "INFLATION_PL"
            )
            .forEach((benchmarkId) => {
              void ensureBenchmarkSeriesLoaded(benchmarkId, requiredDates);
            });
        })();
      }}
      onCurrencyChange={setCurrency}
      onComparisonChange={handleComparisonChange}
      onBootstrapRequest={handleBootstrapRequest}
      formatCurrencyValue={formatCurrencyValue}
    />
  );
}
