"use client";

import { useEffect, useReducer } from "react";

import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { SnapshotScope, SnapshotChartRow } from "../../server/snapshots/types";
import {
  type BenchmarkId,
  type ComparisonOptionId,
  type DashboardBenchmarkSeries,
} from "../lib/benchmark-config";
import { type ChartMode, type ChartRange, rangeOptions } from "../lib/chart-helpers";
import {
  resolveInitialChartMode,
  resolveInitialChartRange,
} from "./portfolio-value-over-time-chart-helpers";

const EMPTY_BENCHMARK_DATES: Record<BenchmarkId, readonly string[]> = {
  SP500: [],
  WIG20: [],
  MWIG40: [],
};

type Updater<T> = T | ((current: T) => T);

export type ChartState = Readonly<{
  currency: SnapshotCurrency;
  mode: ChartMode;
  range: ChartRange;
  fullHistoryRows: readonly SnapshotChartRow[] | null;
  isAllHistoryLoading: boolean;
  selectedComparisons: readonly ComparisonOptionId[];
  benchmarkSeriesOverrides: Partial<DashboardBenchmarkSeries>;
  loadedBenchmarkDatesById: Record<BenchmarkId, readonly string[]>;
  loadingBenchmarkIds: readonly BenchmarkId[];
  rangeStorageHydrated: boolean;
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
  | {
      type: "set_benchmark_series_overrides";
      payload: Updater<Partial<DashboardBenchmarkSeries>>;
    }
  | {
      type: "set_loaded_benchmark_dates";
      payload: Updater<Record<BenchmarkId, readonly string[]>>;
    }
  | { type: "set_loading_benchmark_ids"; payload: Updater<readonly BenchmarkId[]> }
  | { type: "set_range_storage_hydrated"; payload: boolean }
  | { type: "set_bootstrapped"; payload: boolean }
  | { type: "set_bootstrap_pending"; payload: boolean };

type Input = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
  rows: readonly SnapshotChartRow[];
}>;

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
      return {
        ...state,
        benchmarkSeriesOverrides:
          typeof action.payload === "function"
            ? action.payload(state.benchmarkSeriesOverrides)
            : action.payload,
      };
    case "set_loaded_benchmark_dates":
      return {
        ...state,
        loadedBenchmarkDatesById:
          typeof action.payload === "function"
            ? action.payload(state.loadedBenchmarkDatesById)
            : action.payload,
      };
    case "set_loading_benchmark_ids":
      return {
        ...state,
        loadingBenchmarkIds:
          typeof action.payload === "function"
            ? action.payload(state.loadingBenchmarkIds)
            : action.payload,
      };
    case "set_range_storage_hydrated":
      return { ...state, rangeStorageHydrated: action.payload };
    case "set_bootstrapped":
      return { ...state, bootstrapped: action.payload };
    case "set_bootstrap_pending":
      return { ...state, bootstrapPending: action.payload };
    default:
      return state;
  }
};

export function usePortfolioValueChartState({ scope, portfolioId, rows }: Input) {
  const rangeStorageKey = `portfolio:chart-range:${scope}:${portfolioId ?? "all"}`;
  const initialRange = resolveInitialChartRange(rows);
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
    rangeStorageHydrated: false,
    bootstrapped: false,
    bootstrapPending: false,
  });

  useEffect(() => {
    const savedRange = window.localStorage.getItem(rangeStorageKey) as ChartRange | null;
    if (savedRange && rangeOptions.some((option) => option.value === savedRange)) {
      dispatch({ type: "set_range", payload: savedRange });
    }
    dispatch({ type: "set_range_storage_hydrated", payload: true });
  }, [rangeStorageKey]);

  useEffect(() => {
    if (!state.rangeStorageHydrated) return;

    window.localStorage.setItem(rangeStorageKey, state.range);
  }, [rangeStorageKey, state.range, state.rangeStorageHydrated]);

  return {
    state,
    setCurrency: (currency: SnapshotCurrency) =>
      dispatch({ type: "set_currency", payload: currency }),
    setMode: (mode: ChartMode) => dispatch({ type: "set_mode", payload: mode }),
    setRange: (range: ChartRange) => dispatch({ type: "set_range", payload: range }),
    setFullHistoryRows: (rowsInput: readonly SnapshotChartRow[] | null) =>
      dispatch({ type: "set_full_history_rows", payload: rowsInput }),
    setIsAllHistoryLoading: (isLoading: boolean) =>
      dispatch({ type: "set_is_all_history_loading", payload: isLoading }),
    setSelectedComparisons: (selected: readonly ComparisonOptionId[]) =>
      dispatch({ type: "set_selected_comparisons", payload: selected }),
    setBenchmarkSeriesOverrides: (overrides: Updater<Partial<DashboardBenchmarkSeries>>) =>
      dispatch({ type: "set_benchmark_series_overrides", payload: overrides }),
    setLoadedBenchmarkDates: (dates: Updater<Record<BenchmarkId, readonly string[]>>) =>
      dispatch({ type: "set_loaded_benchmark_dates", payload: dates }),
    setLoadingBenchmarkIds: (ids: Updater<readonly BenchmarkId[]>) =>
      dispatch({ type: "set_loading_benchmark_ids", payload: ids }),
    setBootstrapped: (bootstrapped: boolean) =>
      dispatch({ type: "set_bootstrapped", payload: bootstrapped }),
    setBootstrapPending: (pending: boolean) =>
      dispatch({ type: "set_bootstrap_pending", payload: pending }),
  };
}
