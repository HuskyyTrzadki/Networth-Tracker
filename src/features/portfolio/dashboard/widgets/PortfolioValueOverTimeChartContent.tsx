"use client";

import { cn } from "@/lib/cn";

import {
  type BenchmarkId,
  type ComparisonOptionId,
} from "../lib/benchmark-config";
import { formatDayLabelWithYear, type ChartMode, type ChartRange } from "../lib/chart-helpers";
import { buildPortfolioValueOverTimeViewModel } from "../lib/portfolio-value-over-time-view-model";
import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import { PortfolioPerformanceModeContent } from "./PortfolioPerformanceModeContent";
import { PortfolioValueModeContent } from "./PortfolioValueModeContent";
import { PortfolioValueOverTimeHeader } from "./PortfolioValueOverTimeHeader";
import { SHARED_PORTFOLIO_WIDGET_MIN_HEIGHT_CLASS } from "./portfolio-value-over-time-chart-layout";

type PortfolioChartViewModel = ReturnType<typeof buildPortfolioValueOverTimeViewModel>;

type Props = Readonly<{
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
}>;

export function PortfolioValueOverTimeChartContent({
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
}: Props) {
  return (
    <div className={cn("space-y-4", SHARED_PORTFOLIO_WIDGET_MIN_HEIGHT_CLASS)}>
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
          selectedPeriodPerformanceAbsoluteChange={
            viewModel.selectedPeriodPerformanceAbsoluteChange
          }
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
