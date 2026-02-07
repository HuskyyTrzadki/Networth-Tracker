"use client";

import { PortfolioComparisonChart } from "@/features/design-system";

import type { ComparisonChartPoint, NullableSeriesPoint } from "../lib/chart-helpers";
import type { ChartRange } from "../lib/chart-helpers";
import { PortfolioValueDailySummaryCard } from "./PortfolioValueDailySummaryCard";

type Props = Readonly<{
  rebuildMessage: string | null;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  hasValuePoints: boolean;
  range: ChartRange;
  currency: "PLN" | "USD" | "EUR";
  latestValue: number | null;
  dailyDelta: number | null;
  dailyDeltaPercent: number | null;
  comparisonChartData: readonly ComparisonChartPoint[];
  investedCapitalSeries: readonly NullableSeriesPoint[];
  formatCurrencyValue: (value: number) => string;
  formatDayLabelWithYear: (label: string) => string;
}>;

export function PortfolioValueModeContent({
  rebuildMessage,
  hasHoldings,
  shouldBootstrap,
  hasValuePoints,
  range,
  currency,
  latestValue,
  dailyDelta,
  dailyDeltaPercent,
  comparisonChartData,
  investedCapitalSeries,
  formatCurrencyValue,
  formatDayLabelWithYear,
}: Props) {
  if (rebuildMessage) {
    return (
      <div className={getEmptyStateClassName(shouldBootstrap)}>
        {rebuildMessage}
      </div>
    );
  }

  if (!hasValuePoints) {
    return (
      <div className={getEmptyStateClassName(shouldBootstrap)}>
        {hasHoldings
          ? "Tworzymy pierwszy punkt wartości portfela."
          : "Dodaj transakcje, aby zobaczyć wykres."}
      </div>
    );
  }

  if (range === "1D") {
    return (
      <PortfolioValueDailySummaryCard
        currency={currency}
        latestValue={latestValue}
        dailyDelta={dailyDelta}
        dailyDeltaPercent={dailyDeltaPercent}
      />
    );
  }

  const hasInvestedCapitalData = comparisonChartData.some(
    (entry) => entry.investedCapital !== null
  );
  const hasInvestedCapitalGaps =
    hasInvestedCapitalData &&
    investedCapitalSeries.some((entry) => entry.value === null);

  return (
    <div className="space-y-2">
      <PortfolioComparisonChart
        data={comparisonChartData}
        height={240}
        valueFormatter={formatCurrencyValue}
        labelFormatter={formatDayLabelWithYear}
      />
      {hasInvestedCapitalGaps ? (
        <div className="text-xs text-muted-foreground">
          Zainwestowany kapitał ma luki historyczne, bo część dni nie ma danych
          przepływów lub transferów.
        </div>
      ) : null}
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
