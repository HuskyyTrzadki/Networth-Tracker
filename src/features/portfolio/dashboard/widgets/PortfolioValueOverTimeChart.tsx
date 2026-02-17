"use client";

import { useEffect, useReducer } from "react";
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
    rangeOptions,
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

type PortfolioChartViewModel = ReturnType<typeof buildPortfolioValueOverTimeViewModel>;

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

const EMPTY_BENCHMARK_DATES: Record<BenchmarkId, readonly string[]> = {
  SP500: [],
  WIG20: [],
  MWIG40: [],
};

type ChartState = Readonly<{
  currency: SnapshotCurrency;
  mode: ChartMode;
  range: ChartRange;
  fullHistoryRows: readonly SnapshotChartRow[] | null;
  isAllHistoryLoading: boolean;
  selectedComparisons: readonly ComparisonOptionId[];
  benchmarkSeriesOverrides: Partial<DashboardBenchmarkSeries>;
  loadedBenchmarkDatesById: Record<BenchmarkId, readonly string[]>;
  loadingBenchmarkIds: readonly BenchmarkId[];
  bootstrapped: boolean;
  bootstrapPending: boolean;
}>;

type ChartAction =
  | { type: "set_currency"; payload: SnapshotCurrency }
  | { type: "set_mode"; payload: ChartMode }
  | { type: "set_range"; payload: ChartRange }
  | { type: "set_full_history_rows"; payload: readonly SnapshotChartRow[] | null }
  | { type: "set_is_all_history_loading"; payload: boolean }
  | { type: "set_selected_comparisons"; payload: readonly ComparisonOptionId[] }
  | { type: "set_benchmark_series_overrides"; payload: Partial<DashboardBenchmarkSeries> }
  | {
      type: "set_loaded_benchmark_dates";
      payload: Record<BenchmarkId, readonly string[]>;
    }
  | { type: "set_loading_benchmark_ids"; payload: readonly BenchmarkId[] }
  | { type: "set_bootstrapped"; payload: boolean }
  | { type: "set_bootstrap_pending"; payload: boolean };

const chartReducer = (state: ChartState, action: ChartAction): ChartState => {
  switch (action.type) {
    case "set_currency":
      return { ...state, currency: action.payload };
    case "set_mode":
      return { ...state, mode: action.payload };
    case "set_range":
      return { ...state, range: action.payload };
    case "set_full_history_rows":
      return { ...state, fullHistoryRows: action.payload };
    case "set_is_all_history_loading":
      return { ...state, isAllHistoryLoading: action.payload };
    case "set_selected_comparisons":
      return { ...state, selectedComparisons: action.payload };
    case "set_benchmark_series_overrides":
      return { ...state, benchmarkSeriesOverrides: action.payload };
    case "set_loaded_benchmark_dates":
      return { ...state, loadedBenchmarkDatesById: action.payload };
    case "set_loading_benchmark_ids":
      return { ...state, loadingBenchmarkIds: action.payload };
    case "set_bootstrapped":
      return { ...state, bootstrapped: action.payload };
    case "set_bootstrap_pending":
      return { ...state, bootstrapPending: action.payload };
    default:
      return state;
  }
};

const bootstrapSnapshots = async (
  payload: Readonly<{ scope: SnapshotScope; portfolioId?: string | null }>
) => {
  await fetch("/api/portfolio-snapshots/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

function PortfolioValueOverTimeChartContent({
  mode,
  range,
  currency,
  selectedComparisons,
  loadingBenchmarkIds,
  rebuild,
  rebuildStartDate,
  bootstrapPending,
  hasHoldings,
  shouldBootstrap,
  viewModel,
  liveTotals,
  isAllHistoryLoading,
  includesFullHistory,
  transactionCreateHref,
  cashDepositHref,
  onBootstrapRequest,
  onModeChange,
  onRangeChange,
  onCurrencyChange,
  onComparisonChange,
  formatCurrencyValue,
}: Readonly<{
  mode: ChartMode;
  range: ChartRange;
  currency: SnapshotCurrency;
  selectedComparisons: readonly ComparisonOptionId[];
  loadingBenchmarkIds: readonly BenchmarkId[];
  rebuild: SnapshotRebuildStatus;
  rebuildStartDate: string | null;
  bootstrapPending: boolean;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  viewModel: PortfolioChartViewModel;
  liveTotals: LiveTotals;
  isAllHistoryLoading: boolean;
  includesFullHistory: boolean;
  transactionCreateHref: string;
  cashDepositHref: string;
  onBootstrapRequest: () => void;
  onModeChange: (nextMode: ChartMode) => void;
  onRangeChange: (nextRange: ChartRange) => void;
  onCurrencyChange: (nextCurrency: SnapshotCurrency) => void;
  onComparisonChange: (optionId: ComparisonOptionId, enabled: boolean) => void;
  formatCurrencyValue: (value: number) => string;
}>) {
  return (
    <div className="space-y-4">
      <PortfolioValueOverTimeHeader
        mode={mode}
        onModeChange={onModeChange}
        range={range}
        onRangeChange={onRangeChange}
        isRangeDisabled={viewModel.isRangeDisabled}
        currency={currency}
        onCurrencyChange={onCurrencyChange}
        comparisonOptions={viewModel.comparisonOptions}
        selectedComparisons={selectedComparisons}
        loadingComparisons={loadingBenchmarkIds}
        onComparisonChange={onComparisonChange}
        performancePartial={viewModel.performancePartial}
        valueIsPartial={liveTotals.totalValue !== null && liveTotals.isPartial}
        missingQuotes={liveTotals.missingQuotes}
        missingFx={liveTotals.missingFx}
        liveAsOf={liveTotals.asOf}
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
          transactionCreateHref={transactionCreateHref}
          cashDepositHref={cashDepositHref}
          bootstrapPending={bootstrapPending}
          onBootstrapRequest={onBootstrapRequest}
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
          transactionCreateHref={transactionCreateHref}
          cashDepositHref={cashDepositHref}
          bootstrapPending={bootstrapPending}
          onBootstrapRequest={onBootstrapRequest}
        />
      )}
    </div>
  );
}

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
  const rangeStorageKey = `portfolio:chart-range:${scope}:${portfolioId ?? "all"}`;
  const initialResolvedRange = resolveInitialChartRange(rows);
  const initialSavedRange =
    typeof window === "undefined"
      ? null
      : (window.localStorage.getItem(rangeStorageKey) as ChartRange | null);
  const initialRange =
    initialSavedRange &&
    rangeOptions.some((option) => option.value === initialSavedRange)
      ? initialSavedRange
      : initialResolvedRange;
  const [state, dispatch] = useReducer(chartReducer, {
    currency: "PLN",
    mode: resolveInitialChartMode(rows),
    range: initialRange,
    fullHistoryRows: null,
    isAllHistoryLoading: false,
    selectedComparisons: [],
    benchmarkSeriesOverrides: {},
    loadedBenchmarkDatesById: EMPTY_BENCHMARK_DATES,
    loadingBenchmarkIds: [],
    bootstrapped: false,
    bootstrapPending: false,
  });
  const {
    currency,
    mode,
    range,
    fullHistoryRows,
    isAllHistoryLoading,
    selectedComparisons,
    benchmarkSeriesOverrides,
    loadedBenchmarkDatesById,
    loadingBenchmarkIds,
    bootstrapped,
    bootstrapPending,
  } = state;
  const router = useRouter();
  const snapshotRows = fullHistoryRows ?? rows;
  const includesFullHistory = initialIncludesFullHistory || fullHistoryRows !== null;

  const shouldBootstrap = hasHoldings && !hasSnapshots && !bootstrapped;
  const rebuildStartDate = rebuild.fromDate ?? rebuild.dirtyFrom;

  const liveTotals = liveTotalsByCurrency[currency];
  const transactionCreateHref = portfolioId
    ? `/transactions/new?portfolio=${portfolioId}`
    : "/transactions/new";
  const cashDepositHref = portfolioId
    ? `/transactions/new?portfolio=${portfolioId}&preset=cash-deposit`
    : "/transactions/new?preset=cash-deposit";

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
  const benchmarkSeriesState: DashboardBenchmarkSeries = {
    SP500: benchmarkSeriesOverrides.SP500 ?? benchmarkSeries.SP500,
    WIG20: benchmarkSeriesOverrides.WIG20 ?? benchmarkSeries.WIG20,
    MWIG40: benchmarkSeriesOverrides.MWIG40 ?? benchmarkSeries.MWIG40,
  };

  const handleBootstrapRequest = async () => {
    if (!shouldBootstrap || bootstrapPending) return;

    dispatch({ type: "set_bootstrap_pending", payload: true });
    const payload = scope === "PORTFOLIO" ? { scope, portfolioId } : { scope };
    const success = await bootstrapSnapshots(payload)
      .then(() => true)
      .catch(() => false);
    dispatch({ type: "set_bootstrap_pending", payload: false });
    if (!success) return;
    dispatch({ type: "set_bootstrapped", payload: true });
    router.refresh();
  };

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

  useEffect(() => {
    window.localStorage.setItem(rangeStorageKey, range);
  }, [range, rangeStorageKey]);

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

    dispatch({
      type: "set_loading_benchmark_ids",
      payload: loadingBenchmarkIds.includes(benchmarkId)
        ? loadingBenchmarkIds
        : [...loadingBenchmarkIds, benchmarkId],
    });

    const response = await fetch("/api/benchmarks/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        benchmarkId,
        bucketDates: requiredDates,
      }),
    }).catch(() => null);
    if (!response?.ok) {
      // Optional overlay: ignore network failure and keep base chart intact.
      dispatch({
        type: "set_loading_benchmark_ids",
        payload: loadingBenchmarkIds.filter((id) => id !== benchmarkId),
      });
      return;
    }

    const payload = (await response.json()) as {
      benchmarkId?: BenchmarkId;
      points?: DashboardBenchmarkSeries["SP500"];
    };
    if (payload.benchmarkId !== benchmarkId || !payload.points) {
      dispatch({
        type: "set_loading_benchmark_ids",
        payload: loadingBenchmarkIds.filter((id) => id !== benchmarkId),
      });
      return;
    }

    dispatch({
      type: "set_benchmark_series_overrides",
      payload: {
        ...benchmarkSeriesOverrides,
        [benchmarkId]: payload.points ?? [],
      },
    });
    dispatch({
      type: "set_loaded_benchmark_dates",
      payload: {
        ...loadedBenchmarkDatesById,
        [benchmarkId]: Array.from(
          new Set([...loadedBenchmarkDatesById[benchmarkId], ...requiredDates])
        ),
      },
    });
    dispatch({
      type: "set_loading_benchmark_ids",
      payload: loadingBenchmarkIds.filter((id) => id !== benchmarkId),
    });
  };

  const ensureAllHistoryLoaded = async (): Promise<readonly SnapshotChartRow[] | null> => {
    if (includesFullHistory || isAllHistoryLoading) {
      return includesFullHistory ? snapshotRows : null;
    }

    dispatch({ type: "set_is_all_history_loading", payload: true });
    const payload = await loadFullSnapshotHistory({
      scope,
      portfolioId,
    });
    if (!payload) {
      dispatch({ type: "set_is_all_history_loading", payload: false });
      return null;
    }

    if (payload.includesFullHistory) {
      dispatch({ type: "set_full_history_rows", payload: payload.rows });
    }
    dispatch({ type: "set_is_all_history_loading", payload: false });
    return payload.rows;
  };

  const getRequiredBenchmarkDatesForRows = (
    sourceRows: readonly SnapshotChartRow[],
    selectedRange: ChartRange
  ) => getRangeRows(sourceRows, selectedRange).rowsForReturns.map((row) => row.bucketDate);

  const handleComparisonChange = (
    optionId: ComparisonOptionId,
    enabled: boolean
  ) => {
    const nextComparisons = (() => {
      const current = selectedComparisons;
      if (enabled) {
        if (current.includes(optionId)) {
          return current;
        }

        return [...current, optionId];
      }

      return current.filter((id) => id !== optionId);
    })();
    dispatch({ type: "set_selected_comparisons", payload: nextComparisons });

    if (enabled && optionId !== "INFLATION_PL") {
      const requiredDates = viewModel.getRequiredBenchmarkDates(range);
      void ensureBenchmarkSeriesLoaded(optionId, requiredDates);
    }
  };

  return (
    <PortfolioValueOverTimeChartContent
      mode={mode}
      range={range}
      currency={currency}
      selectedComparisons={selectedComparisons}
      loadingBenchmarkIds={loadingBenchmarkIds}
      rebuild={rebuild}
      rebuildStartDate={rebuildStartDate}
      bootstrapPending={bootstrapPending}
      hasHoldings={hasHoldings}
      shouldBootstrap={shouldBootstrap}
      viewModel={viewModel}
      liveTotals={liveTotals}
      isAllHistoryLoading={isAllHistoryLoading}
      includesFullHistory={includesFullHistory}
      transactionCreateHref={transactionCreateHref}
      cashDepositHref={cashDepositHref}
      onModeChange={(nextMode) => dispatch({ type: "set_mode", payload: nextMode })}
      onRangeChange={(nextRange) => {
        dispatch({ type: "set_range", payload: nextRange });

        void (async () => {
          const rowsForRange =
            nextRange === "ALL"
              ? (await ensureAllHistoryLoaded()) ?? snapshotRows
              : snapshotRows;
          const requiredDates = getRequiredBenchmarkDatesForRows(rowsForRange, nextRange);
          selectedComparisons
            .filter((comparisonId): comparisonId is BenchmarkId =>
              comparisonId !== "INFLATION_PL"
            )
            .forEach((benchmarkId) => {
              void ensureBenchmarkSeriesLoaded(benchmarkId, requiredDates);
            });
        })();
      }}
      onCurrencyChange={(nextCurrency) =>
        dispatch({ type: "set_currency", payload: nextCurrency })
      }
      onComparisonChange={handleComparisonChange}
      onBootstrapRequest={handleBootstrapRequest}
      formatCurrencyValue={formatCurrencyValue}
    />
  );
}
