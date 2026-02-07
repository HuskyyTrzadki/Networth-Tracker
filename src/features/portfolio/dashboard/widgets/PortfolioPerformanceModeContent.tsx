"use client";

import { DailyReturnsLineChart } from "@/features/design-system";
import { cn } from "@/lib/cn";

import type { ChartRange } from "../lib/chart-helpers";
import { formatPercent } from "../lib/chart-helpers";
import { PortfolioPerformanceDailySummaryCard } from "./PortfolioPerformanceDailySummaryCard";

type Point = Readonly<{
  label: string;
  value: number;
  benchmarkValue: number | null;
}>;

type Props = Readonly<{
  rebuildMessage: string | null;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  hasPerformanceData: boolean;
  range: ChartRange;
  showRealSeries: boolean;
  selectedPeriodReturn: number | null;
  currency: "PLN" | "USD" | "EUR";
  hasInflationData: boolean;
  nominalPeriodReturn: number | null;
  inflationPeriodReturn: number | null;
  dailyReturnValue: number | null;
  cumulativeChartData: readonly Point[];
}>;

export function PortfolioPerformanceModeContent({
  rebuildMessage,
  hasHoldings,
  shouldBootstrap,
  hasPerformanceData,
  range,
  showRealSeries,
  selectedPeriodReturn,
  currency,
  hasInflationData,
  nominalPeriodReturn,
  inflationPeriodReturn,
  dailyReturnValue,
  cumulativeChartData,
}: Props) {
  if (rebuildMessage) {
    return (
      <div className={getEmptyStateClassName(shouldBootstrap)}>
        {rebuildMessage}
      </div>
    );
  }

  if (!hasPerformanceData) {
    return (
      <div className={getEmptyStateClassName(shouldBootstrap)}>
        {hasHoldings
          ? "Brak danych do wyliczenia performance."
          : "Dodaj transakcje, aby zobaczyć performance."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground">
          {showRealSeries
            ? `Realny zwrot za okres (${range})`
            : `Zwrot za okres (${range})`}
        </div>
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
        {currency === "PLN" && hasInflationData ? (
          <div className="mt-1 text-xs text-muted-foreground">
            Nominalnie:{" "}
            {nominalPeriodReturn !== null
              ? formatPercent(nominalPeriodReturn)
              : "—"}{" "}
            · Inflacja od początku:{" "}
            {inflationPeriodReturn !== null
              ? formatPercent(inflationPeriodReturn)
              : "—"}
          </div>
        ) : null}
      </div>

      {range === "1D" ? (
        <PortfolioPerformanceDailySummaryCard
          dailyReturnValue={dailyReturnValue}
        />
      ) : (
        <DailyReturnsLineChart
          data={cumulativeChartData}
          height={140}
          benchmarkLabel="Inflacja skumulowana (PL)"
        />
      )}
    </div>
  );
}

const getEmptyStateClassName = (shouldBootstrap: boolean) =>
  [
    "grid h-[240px] place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground",
    shouldBootstrap ? "animate-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");
