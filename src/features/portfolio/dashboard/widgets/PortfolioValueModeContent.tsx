"use client";

import Link from "next/link";
import { PortfolioComparisonChart } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

import type { SnapshotCurrency } from "../../lib/supported-currencies";
import type { ComparisonChartPoint, NullableSeriesPoint } from "../lib/chart-helpers";
import type { ChartRange } from "../lib/chart-helpers";
import { formatPercent } from "../lib/chart-helpers";
import { PortfolioSnapshotRebuildChartLoader } from "./PortfolioSnapshotRebuildChartLoader";
import { PortfolioValueDailySummaryCard } from "./PortfolioValueDailySummaryCard";
import {
  getPortfolioChartEmptyStateClassName,
  SHARED_PORTFOLIO_CHART_HEIGHT,
} from "./portfolio-value-over-time-chart-layout";

type Props = Readonly<{
  rebuildStatus: "idle" | "queued" | "running" | "failed";
  rebuildFromDate: string | null;
  rebuildToDate: string | null;
  rebuildProgressPercent: number | null;
  hasHoldings: boolean;
  shouldBootstrap: boolean;
  hasValuePoints: boolean;
  range: ChartRange;
  currency: SnapshotCurrency;
  latestValue: number | null;
  dailyDelta: number | null;
  dailyDeltaPercent: number | null;
  selectedPeriodAbsoluteChange: number | null;
  selectedPeriodChangePercent: number | null;
  comparisonChartData: readonly ComparisonChartPoint[];
  investedCapitalSeries: readonly NullableSeriesPoint[];
  formatCurrencyValue: (value: number) => string;
  formatDayLabelWithYear: (label: string) => string;
  transactionCreateHref: string;
  cashDepositHref: string;
}>;

export function PortfolioValueModeContent({
  rebuildStatus,
  rebuildFromDate,
  rebuildToDate,
  rebuildProgressPercent,
  hasHoldings,
  shouldBootstrap,
  hasValuePoints,
  range,
  currency,
  latestValue,
  dailyDelta,
  dailyDeltaPercent,
  selectedPeriodAbsoluteChange,
  selectedPeriodChangePercent,
  comparisonChartData,
  investedCapitalSeries,
  formatCurrencyValue,
  formatDayLabelWithYear,
  transactionCreateHref,
  cashDepositHref,
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

  if (!hasValuePoints) {
    return (
      <div className={cn(getPortfolioChartEmptyStateClassName(shouldBootstrap), "space-y-3")}>
        <p>
          {hasHoldings
            ? "Tworzymy pierwszy punkt wartości portfela."
            : "Dodaj transakcje, aby zobaczyć wykres."}
        </p>
        {!hasHoldings ? (
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button asChild className="h-9 px-3 text-xs" size="sm">
              <Link href={transactionCreateHref} scroll={false}>
                Dodaj pierwsze kupno
              </Link>
            </Button>
            <Button asChild className="h-9 px-3 text-xs" size="sm" variant="outline">
              <Link href={cashDepositHref} scroll={false}>
                Dodaj depozyt gotówki
              </Link>
            </Button>
          </div>
        ) : null}
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
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground">{`Zmiana za okres (${range})`}</div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div
            className={cn(
              "text-4xl font-semibold",
              selectedPeriodAbsoluteChange !== null && selectedPeriodAbsoluteChange > 0
                ? "text-emerald-600"
                : selectedPeriodAbsoluteChange !== null &&
                    selectedPeriodAbsoluteChange < 0
                  ? "text-rose-600"
                  : "text-foreground"
            )}
          >
            {selectedPeriodAbsoluteChange !== null
              ? `${selectedPeriodAbsoluteChange > 0 ? "+" : ""}${formatCurrencyValue(
                  selectedPeriodAbsoluteChange
                )} ${currency}`
              : "—"}
          </div>
          <div
            className={cn(
              "font-mono text-sm tabular-nums",
              selectedPeriodChangePercent !== null && selectedPeriodChangePercent > 0
                ? "text-emerald-600"
                : selectedPeriodChangePercent !== null && selectedPeriodChangePercent < 0
                  ? "text-rose-600"
                  : "text-muted-foreground"
            )}
          >
            {selectedPeriodChangePercent !== null
              ? formatPercent(selectedPeriodChangePercent)
              : "—"}
          </div>
        </div>
      </div>
      <PortfolioComparisonChart
        data={comparisonChartData}
        height={SHARED_PORTFOLIO_CHART_HEIGHT}
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
