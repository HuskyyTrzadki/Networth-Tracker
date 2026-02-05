"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ChangePill,
  DailyReturnsBarChart,
  PortfolioAreaChart,
} from "@/features/design-system";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/features/design-system/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import { cn } from "@/lib/cn";
import { getCurrencyFormatter } from "@/lib/format-currency";

import type { LiveTotals } from "../../server/get-portfolio-live-totals";
import type { SnapshotCurrency } from "../../server/snapshots/supported-currencies";
import type { SnapshotScope, SnapshotChartRow } from "../../server/snapshots/types";
import {
  computeDailyReturns,
  computePeriodReturn,
} from "../lib/twr";
import {
  type ChartMode,
  type ChartRange,
  formatDayLabel,
  formatPercent,
  formatRangeLabel,
  getRangeRows,
  getTotalValue,
  mergeLivePoint,
  rangeOptions,
  toPerformanceRows,
} from "../lib/chart-helpers";

const currencyLabels: Record<SnapshotCurrency, string> = {
  PLN: "PLN",
  USD: "USD",
  EUR: "EUR",
};

type Props = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
  rows: readonly SnapshotChartRow[];
  todayBucketDate: string;
  liveTotalsByCurrency: Readonly<Record<SnapshotCurrency, LiveTotals>>;
}>;

export function PortfolioValueOverTimeChart({
  scope,
  portfolioId,
  hasHoldings,
  hasSnapshots,
  rows,
  todayBucketDate,
  liveTotalsByCurrency,
}: Props) {
  const [currency, setCurrency] = useState<SnapshotCurrency>("PLN");
  const [mode, setMode] = useState<ChartMode>("PERFORMANCE");
  const [range, setRange] = useState<ChartRange>("YTD");
  const [bootstrapped, setBootstrapped] = useState(false);
  const router = useRouter();

  const shouldBootstrap = hasHoldings && !hasSnapshots && !bootstrapped;

  useEffect(() => {
    if (!shouldBootstrap) return;

    const payload =
      scope === "PORTFOLIO"
        ? { scope, portfolioId }
        : { scope };

    void fetch("/api/portfolio-snapshots/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).finally(() => {
      setBootstrapped(true);
      router.refresh();
    });
  }, [portfolioId, router, scope, shouldBootstrap]);

  const hasRangeCoverage = (option: ChartRange) => {
    if (rows.length < 2) return false;
    if (option === "ALL" || option === "YTD") return true;

    const last = new Date(`${rows[rows.length - 1].bucketDate}T00:00:00Z`);
    const first = new Date(`${rows[0].bucketDate}T00:00:00Z`);
    const spanDays = Math.floor((last.getTime() - first.getTime()) / (24 * 60 * 60 * 1000));

    const rangeLengthDays: Record<ChartRange, number> = {
      "1D": 1,
      "7D": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
      YTD: 0,
      ALL: 0,
    };
    const requiredDaysBack =
      rangeLengthDays[option] > 0 ? rangeLengthDays[option] - 1 : 0;

    return spanDays >= requiredDaysBack;
  };

  const rangeMeta = getRangeRows(rows, range);
  const valuePoints = rangeMeta.rows
    .map((row) => {
      const value = getTotalValue(row, currency);
      if (value === null) return null;
      return { label: row.bucketDate, value };
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  const liveTotals = liveTotalsByCurrency[currency];
  const effectivePoints = mergeLivePoint(
    valuePoints,
    todayBucketDate,
    liveTotals.totalValue
  );

  const performanceRows = toPerformanceRows(rangeMeta.rowsForReturns, currency);
  const dailyReturns = computeDailyReturns(performanceRows);
  const periodReturn = computePeriodReturn(dailyReturns);
  const dailyChartRows = dailyReturns.filter((entry) => entry.value !== null);
  const dailyChartData = dailyChartRows.map((entry) => ({
    label: formatDayLabel(entry.bucketDate),
    value: entry.value!,
  }));

  const hasPerformanceData = dailyChartData.length > 0;
  const hasValuePoints = effectivePoints.length > 0;

  const performancePartial = dailyReturns.some(
    (entry) => entry.value !== null && entry.isPartial
  );

  const latestValueRow =
    rangeMeta.rowsForReturns[rangeMeta.rowsForReturns.length - 1] ?? null;
  const previousValueRow =
    rangeMeta.rowsForReturns[rangeMeta.rowsForReturns.length - 2] ?? null;
  const latestValue = latestValueRow
    ? getTotalValue(latestValueRow, currency)
    : null;
  const previousValue = previousValueRow
    ? getTotalValue(previousValueRow, currency)
    : null;
  const dailyDelta =
    latestValue !== null && previousValue !== null
      ? latestValue - previousValue
      : null;
  const dailyDeltaPercent =
    dailyDelta !== null && previousValue && previousValue !== 0
      ? dailyDelta / previousValue
      : null;
  const dailyReturn = dailyReturns[dailyReturns.length - 1] ?? null;
  const dailyReturnValue = dailyReturn?.value ?? null;

  const isRangeDisabled = (option: ChartRange) => {
    if (!hasRangeCoverage(option)) return true;

    const meta = getRangeRows(rows, option);
    if (mode === "VALUE") {
      const valueRows = option === "1D" ? meta.rowsForReturns : meta.rows;
      const count = valueRows.filter(
        (row) => getTotalValue(row, currency) !== null
      ).length;
      const minRequired = option === "1D" ? 2 : 1;
      return count < minRequired;
    }

    const perfRows = toPerformanceRows(meta.rowsForReturns, currency);
    const returns = computeDailyReturns(perfRows);
    const validReturns = returns.filter((entry) => entry.value !== null).length;
    return validReturns < 1;
  };

  const modeOptions = (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        if (value === "VALUE" || value === "PERFORMANCE") {
          setMode(value);
        }
      }}
      className="flex flex-wrap gap-2"
    >
      <ToggleGroupItem value="PERFORMANCE">Performance</ToggleGroupItem>
      <ToggleGroupItem value="VALUE">Wartość</ToggleGroupItem>
    </ToggleGroup>
  );

  const rangeOptionsUi = (
    <ToggleGroup
      type="single"
      value={range}
      onValueChange={(value) => {
        const next = value as ChartRange;
        if (!next) return;
        setRange(next);
      }}
      className="flex flex-wrap gap-2"
    >
      {rangeOptions.map((option) => {
        const isDisabled = isRangeDisabled(option.value);

        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={isDisabled}
          >
            {formatRangeLabel(option.label)}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {modeOptions}
          {rangeOptionsUi}
        </div>
        {mode === "PERFORMANCE" && performancePartial ? (
          <div className="text-xs text-muted-foreground">
            Częściowe dane: performance może być przybliżone.
          </div>
        ) : null}
        {mode === "VALUE" && liveTotals.totalValue !== null && liveTotals.isPartial ? (
          <div className="text-xs text-muted-foreground">
            Częściowa wycena: brak cen dla {liveTotals.missingQuotes} pozycji,
            brak FX dla {liveTotals.missingFx} pozycji.
          </div>
        ) : null}
      </div>

      <Tabs
        value={currency}
        onValueChange={(value) => setCurrency(value as SnapshotCurrency)}
      >
        <TabsList>
          {Object.entries(currencyLabels).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {mode === "VALUE" ? (
        hasValuePoints ? (
          range === "1D" ? (
            <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">
                Zmiana dzienna ({currency})
              </div>
              <div className="flex flex-wrap items-baseline gap-2">
                <div className="text-3xl font-semibold">
                  {latestValue !== null
                    ? getCurrencyFormatter(currency)?.format(latestValue) ??
                      latestValue.toString()
                    : "—"}
                </div>
                {dailyDelta !== null ? (
                  <ChangePill
                    value={
                      getCurrencyFormatter(currency)?.format(dailyDelta) ??
                      dailyDelta.toString()
                    }
                    trend={dailyDelta > 0 ? "up" : dailyDelta < 0 ? "down" : "flat"}
                  />
                ) : null}
                {dailyDeltaPercent !== null ? (
                  <ChangePill
                    value={formatPercent(dailyDeltaPercent)}
                    trend={
                      dailyDeltaPercent > 0
                        ? "up"
                        : dailyDeltaPercent < 0
                          ? "down"
                          : "flat"
                    }
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <PortfolioAreaChart
              data={effectivePoints}
              height={240}
              valueFormatter={(value) =>
                getCurrencyFormatter(currency)?.format(value) ?? value.toString()
              }
              labelFormatter={formatDayLabel}
            />
          )
        ) : (
          <div
            className={cn(
              "grid h-[240px] place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground",
              shouldBootstrap ? "animate-pulse" : ""
            )}
          >
            {hasHoldings
              ? "Tworzymy pierwszy punkt wartości portfela."
              : "Dodaj transakcje, aby zobaczyć wykres."}
          </div>
        )
      ) : hasPerformanceData ? (
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">
              Zwrot za okres ({range})
            </div>
            <div
              className={cn(
                "text-3xl font-semibold",
                periodReturn.value !== null && periodReturn.value > 0
                  ? "text-emerald-600"
                  : periodReturn.value !== null && periodReturn.value < 0
                    ? "text-rose-600"
                    : "text-foreground"
              )}
            >
              {periodReturn.value !== null
                ? formatPercent(periodReturn.value)
                : "—"}
            </div>
          </div>
          {range === "1D" ? (
            <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Zwrot dzienny</div>
              <div className="flex flex-wrap items-baseline gap-2">
                <div className="text-3xl font-semibold">
                  {dailyReturnValue !== null
                    ? formatPercent(dailyReturnValue)
                    : "—"}
                </div>
                {dailyReturnValue !== null ? (
                  <ChangePill
                    value={formatPercent(dailyReturnValue)}
                    trend={
                      dailyReturnValue > 0
                        ? "up"
                        : dailyReturnValue < 0
                          ? "down"
                          : "flat"
                    }
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <DailyReturnsBarChart data={dailyChartData} height={140} />
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid h-[240px] place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground",
            shouldBootstrap ? "animate-pulse" : ""
          )}
        >
          {hasHoldings
            ? "Brak danych do wyliczenia performance."
            : "Dodaj transakcje, aby zobaczyć performance."}
        </div>
      )}
    </div>
  );
}
