"use client";

import { DailyReturnsLineChart } from "@/features/design-system";
import { cn } from "@/lib/cn";

import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { ChartRange } from "../lib/chart-helpers";
import { formatPercent } from "../lib/chart-helpers";
import { PortfolioSnapshotRebuildChartLoader } from "./PortfolioSnapshotRebuildChartLoader";
import { PortfolioPerformanceDailySummaryCard } from "./PortfolioPerformanceDailySummaryCard";
import {
  getPortfolioChartEmptyStateClassName,
  SHARED_PORTFOLIO_CHART_HEIGHT,
} from "./portfolio-value-over-time-chart-layout";

type Point = Readonly<{
  label: string;
  value: number;
  comparisons?: Readonly<Record<string, number | null | undefined>>;
}>;

type ComparisonLine = Readonly<{
  id: string;
  label: string;
  color: string;
  strokeStyle?: "monotone" | "stepAfter";
}>;

type Props = Readonly<{
  rebuildStatus: "idle" | "queued" | "running" | "failed";
  rebuildFromDate: string | null;
  rebuildToDate: string | null;
  rebuildProgressPercent: number | null;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  hasPerformanceData: boolean;
  range: ChartRange;
  selectedPeriodReturn: number | null;
  selectedPeriodAbsoluteChange: number | null;
  currency: SnapshotCurrency;
  dailyReturnValue: number | null;
  cumulativeChartData: readonly Point[];
  comparisonLines: readonly ComparisonLine[];
  formatCurrencyValue: (value: number) => string;
}>;

export function PortfolioPerformanceModeContent({
  rebuildStatus,
  rebuildFromDate,
  rebuildToDate,
  rebuildProgressPercent,
  hasHoldings,
  shouldBootstrap,
  hasPerformanceData,
  range,
  selectedPeriodReturn,
  selectedPeriodAbsoluteChange,
  currency,
  dailyReturnValue,
  cumulativeChartData,
  comparisonLines,
  formatCurrencyValue,
}: Props) {
  const isRebuildBusy = rebuildStatus === "queued" || rebuildStatus === "running";

  if (isRebuildBusy) {
    return (
      <PortfolioSnapshotRebuildChartLoader
        fromDate={rebuildFromDate}
        toDate={rebuildToDate}
        progressPercent={rebuildProgressPercent}
      />
    );
  }

  if (!hasPerformanceData) {
    return (
      <div className={getPortfolioChartEmptyStateClassName(shouldBootstrap)}>
        {hasHoldings
          ? shouldBootstrap
            ? "Tworzymy pierwszy punkt wartości portfela."
            : "Performance będzie dostępny po co najmniej 2 dniach danych."
          : "Dodaj transakcje, aby zobaczyć performance."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground">{`Zwrot za okres (${range})`}</div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div
            className={cn(
              "text-4xl font-semibold",
              selectedPeriodReturn !== null && selectedPeriodReturn > 0
                ? "text-emerald-600"
                : selectedPeriodReturn !== null && selectedPeriodReturn < 0
                  ? "text-rose-600"
                  : "text-foreground"
            )}
          >
            {selectedPeriodReturn !== null
              ? formatPercent(selectedPeriodReturn)
              : "—"}
          </div>
          <div
            className={cn(
              "font-mono text-sm tabular-nums",
              selectedPeriodAbsoluteChange !== null && selectedPeriodAbsoluteChange > 0
                ? "text-emerald-600"
                : selectedPeriodAbsoluteChange !== null &&
                    selectedPeriodAbsoluteChange < 0
                  ? "text-rose-600"
                  : "text-muted-foreground"
            )}
          >
            {selectedPeriodAbsoluteChange !== null
              ? `${selectedPeriodAbsoluteChange > 0 ? "+" : ""}${formatCurrencyValue(
                  selectedPeriodAbsoluteChange
                )} ${currency}`
              : "—"}
          </div>
        </div>
      </div>

      {range === "1D" ? (
        <PortfolioPerformanceDailySummaryCard
          dailyReturnValue={dailyReturnValue}
        />
      ) : (
        <DailyReturnsLineChart
          data={cumulativeChartData}
          height={SHARED_PORTFOLIO_CHART_HEIGHT}
          comparisonLines={comparisonLines}
        />
      )}
    </div>
  );
}
