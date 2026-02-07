"use client";

import { DailyReturnsLineChart } from "@/features/design-system";
import { cn } from "@/lib/cn";

import type { ChartRange } from "../lib/chart-helpers";
import { formatPercent } from "../lib/chart-helpers";
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
  rebuildMessage: string | null;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  hasPerformanceData: boolean;
  range: ChartRange;
  selectedPeriodReturn: number | null;
  dailyReturnValue: number | null;
  cumulativeChartData: readonly Point[];
  comparisonLines: readonly ComparisonLine[];
}>;

export function PortfolioPerformanceModeContent({
  rebuildMessage,
  hasHoldings,
  shouldBootstrap,
  hasPerformanceData,
  range,
  selectedPeriodReturn,
  dailyReturnValue,
  cumulativeChartData,
  comparisonLines,
}: Props) {
  if (rebuildMessage) {
    return (
      <div className={getPortfolioChartEmptyStateClassName(shouldBootstrap)}>
        {rebuildMessage}
      </div>
    );
  }

  if (!hasPerformanceData) {
    return (
      <div className={getPortfolioChartEmptyStateClassName(shouldBootstrap)}>
        {hasHoldings
          ? "Brak danych do wyliczenia performance."
          : "Dodaj transakcje, aby zobaczyć performance."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground">{`Zwrot za okres (${range})`}</div>
        <div
          className={cn(
            "text-3xl font-semibold",
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
