"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChartCard } from "@/features/design-system";
import { Badge } from "@/features/design-system/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/design-system/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { cn } from "@/lib/cn";
import {
  formatCurrencyString,
  getCurrencyFormatter,
  splitCurrencyLabel,
} from "@/lib/format-currency";
import { Loader2 } from "lucide-react";

import type { PortfolioSummary } from "../../server/valuation";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import { buildAllocationData } from "./allocation-utils";
import { getConcentrationWarning } from "./concentration-utils";
import { sortHoldingsByValueDesc } from "./holdings-sort";

const AllocationDonutChart = dynamic(
  () =>
    import("@/features/design-system/components/AllocationDonutChart").then(
      (module) => module.AllocationDonutChart
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[300px] w-full animate-pulse rounded-lg border border-dashed border-border/70 bg-card/40"
        aria-hidden="true"
      />
    ),
  }
);

type Props = Readonly<{
  summary: PortfolioSummary;
  rebuild: SnapshotRebuildStatus;
}>;

type Mode = "ALLOCATION" | "HOLDINGS";
type AllocationPatternId = "solid" | "hatch" | "dots" | "cross" | "grid";

const formatPercent = (value: number, maxFractionDigits = 1) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: maxFractionDigits,
  }).format(value);

const formatAsOf = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatMissingValue = (reason: "MISSING_QUOTE" | "MISSING_FX") =>
  reason === "MISSING_QUOTE" ? "Brak ceny" : "Brak FX";

const clampProgress = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const formatDecimalValue = (value: string) => {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return value;
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asNumber);
};

const getPatternOverlay = (patternId: AllocationPatternId) => {
  if (patternId === "hatch") {
    return "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.2) 0 2px, transparent 2px 6px)";
  }
  if (patternId === "dots") {
    return "radial-gradient(rgb(255 255 255 / 0.2) 1.2px, transparent 1.2px)";
  }
  if (patternId === "cross") {
    return "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.16) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.16) 0 1px, transparent 1px 6px)";
  }
  if (patternId === "grid") {
    return "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.14) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.14) 0 1px, transparent 1px 4px)";
  }
  return "none";
};

export function AllocationHoldingsWidget({ summary, rebuild }: Props) {
  const [mode, setMode] = useState<Mode>("ALLOCATION");
  const formatter = getCurrencyFormatter(summary.baseCurrency);
  const isRebuildBusy = rebuild.status === "queued" || rebuild.status === "running";
  const rebuildProgress = clampProgress(rebuild.progressPercent);
  const rebuildFromDate = rebuild.fromDate ?? rebuild.dirtyFrom;
  const concentrationWarning = getConcentrationWarning(summary);
  const concentrationTone =
    concentrationWarning?.severity === "CRITICAL"
      ? "border-l-loss bg-loss/16 text-loss"
      : concentrationWarning?.severity === "HARD"
        ? "border-l-rose-700 bg-rose-100/70 text-rose-800 dark:border-l-rose-400 dark:bg-rose-500/14 dark:text-rose-200"
        : concentrationWarning
          ? "border-l-amber-700 bg-amber-100/65 text-amber-800 dark:border-l-amber-400 dark:bg-amber-500/10 dark:text-amber-200"
          : "";
  const totalLabel =
    formatter && summary.totalValueBase
      ? formatCurrencyString(summary.totalValueBase, formatter) ?? "—"
      : "—";
  const { amount: totalAmountLabel, currency: totalCurrencyLabel } =
    splitCurrencyLabel(totalLabel);

  const allocationRows = buildAllocationData(summary);
  const holdingsRows = sortHoldingsByValueDesc(summary.holdings);
  const hasAllocation = allocationRows.length > 0;
  const slices = allocationRows.map((row) => {
    const tooltipValue =
      formatter && row.valueBase
        ? formatCurrencyString(row.valueBase, formatter) ??
          `${row.valueBase} ${summary.baseCurrency}`
        : row.valueBase
          ? `${row.valueBase} ${summary.baseCurrency}`
          : "—";

    return {
      id: row.label,
      value: row.share,
      color: row.color,
      patternId: row.patternId,
      tooltipLabel: row.label,
      tooltipValue,
    };
  });

  return (
    <ChartCard
      surface="subtle"
      title={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span>Alokacja i pozycje</span>
          <ToggleGroup
            className="rounded-md border border-border/70 bg-muted/35 p-1"
            onValueChange={(value) => {
              if (value === "ALLOCATION" || value === "HOLDINGS") setMode(value);
            }}
            type="single"
            value={mode}
          >
            <ToggleGroupItem
              className="h-8 px-3 text-sm"
              value="ALLOCATION"
              variant="ledger"
            >
              Koło
            </ToggleGroupItem>
            <ToggleGroupItem
              className="h-8 px-3 text-sm"
              value="HOLDINGS"
              variant="ledger"
            >
              Tabela
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      }
      subtitle={
        mode === "ALLOCATION"
          ? "Udział wartości portfela"
          : "Aktualny skład portfela"
      }
      right={
        summary.asOf ? (
          <div className="hidden text-right text-[12px] text-muted-foreground md:block">
            Opóźniony stan na: {formatAsOf(summary.asOf)}
          </div>
        ) : null
      }
    >
      <div className="h-[420px] lg:h-[500px]">
        {isRebuildBusy ? (
          <div className="grid h-full place-items-center rounded-lg border border-border/70 bg-muted/10 p-6 text-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[12px] font-medium text-primary">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Przebudowa historii snapshotów
              </div>
              <div className="font-mono text-sm tabular-nums text-foreground">
                {rebuildProgress !== null ? `${rebuildProgress}%` : "..."}
              </div>
              <p className="text-[12px] text-muted-foreground">
                Zakres: {rebuildFromDate ?? "dziś"} - {rebuild.toDate ?? "dziś"}
              </p>
            </div>
          </div>
        ) : mode === "ALLOCATION" ? (
          <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-5 lg:grid-cols-[minmax(240px,40%)_minmax(0,1fr)] lg:items-stretch">
              <div className="space-y-2">
                {hasAllocation ? (
                  <AllocationDonutChart data={slices} height={250} />
                ) : (
                  <div className="grid h-[250px] w-full place-items-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground">
                    Brak danych do alokacji
                  </div>
                )}
                <div className="text-center">
                  <div className="text-[12px] font-medium text-muted-foreground">
                    Wartość portfela
                  </div>
                  <div className="mt-1 inline-flex items-baseline gap-1 font-mono text-lg font-semibold tabular-nums text-foreground">
                    <span>{totalAmountLabel}</span>
                    {totalCurrencyLabel ? (
                      <span className="text-[11px] font-medium text-muted-foreground/75">
                        {totalCurrencyLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {hasAllocation ? (
                <div className="min-h-0 divide-y divide-dashed divide-border/55 overflow-y-auto pr-1">
                  {allocationRows.map((row) => {
                    const valueLabel =
                      formatter && row.valueBase
                        ? formatCurrencyString(row.valueBase, formatter) ??
                          `${row.valueBase} ${summary.baseCurrency}`
                        : row.valueBase
                          ? `${row.valueBase} ${summary.baseCurrency}`
                          : "—";
                    const { amount: valueAmount, currency: valueCurrency } =
                      splitCurrencyLabel(valueLabel);

                    return (
                      <div key={row.id} className="py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: row.color }}
                              aria-hidden="true"
                            />
                            <span className="truncate text-[13px] font-medium text-foreground">
                              {row.label}
                            </span>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                              {formatPercent(row.share)}
                            </div>
                            <div className="mt-1 font-mono text-[12px] tabular-nums text-muted-foreground">
                              {valueAmount}
                              {valueCurrency ? (
                                <span className="ml-1 text-[10px] font-medium text-muted-foreground/75">
                                  {valueCurrency}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: row.color,
                              backgroundImage: getPatternOverlay(row.patternId),
                              backgroundSize:
                                row.patternId === "dots" ? "8px 8px" : undefined,
                              width: `${Math.max(0, Math.min(100, row.share * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            {concentrationWarning ? (
              <div
                className={cn(
                  "rounded-sm border-l-[3px] px-3 py-2 text-[13px] leading-5",
                  concentrationTone
                )}
              >
                <p>
                  <span className="font-semibold">Uwaga dot. koncentracji:</span>{" "}
                  {concentrationWarning.symbol} stanowi{" "}
                  {formatPercent(concentrationWarning.weight, 0)} Twojego portfela.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="h-full overflow-y-auto overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow className="bg-muted/25">
                  <TableHead className="px-4">
                    Instrument
                  </TableHead>
                  <TableHead className="px-4" data-align="right">
                    Ilość
                  </TableHead>
                  <TableHead className="px-4" data-align="right">
                    Śr. cena zakupu ({summary.baseCurrency})
                  </TableHead>
                  <TableHead className="px-4" data-align="right">
                    Wartość ({summary.baseCurrency})
                  </TableHead>
                  <TableHead className="px-4" data-align="right">
                    Udział
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdingsRows.map((row) => {
                  const averageBuyPriceLabel = row.averageBuyPriceBase
                    ? formatDecimalValue(row.averageBuyPriceBase)
                    : "—";
                  const valueLabel =
                    row.valueBase
                      ? formatDecimalValue(row.valueBase)
                      : row.missingReason
                        ? formatMissingValue(row.missingReason)
                        : "—";
                  const weightLabel =
                    typeof row.weight === "number" ? formatPercent(row.weight) : "—";

                  return (
                    <TableRow key={row.instrumentId} className="h-[68px]">
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 place-items-center text-sm leading-none">
                            <InstrumentLogoImage
                              alt=""
                              className="size-6"
                              fallbackText={row.symbol}
                              size={24}
                              src={row.logoUrl}
                            />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-foreground">
                                {row.symbol}
                              </span>
                              {row.exchange ? (
                                <Badge
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  variant="outline"
                                >
                                  {row.exchange}
                                </Badge>
                              ) : null}
                            </div>
                            <span className="truncate text-[12px] text-muted-foreground">
                              {row.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className="px-4 font-mono text-[13px] tabular-nums text-foreground"
                        data-align="right"
                      >
                        {row.quantity}
                      </TableCell>
                      <TableCell
                        className="px-4 font-mono text-[13px] tabular-nums text-foreground"
                        data-align="right"
                      >
                        {averageBuyPriceLabel}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "px-4 font-mono text-[13px] tabular-nums",
                          row.missingReason ? "text-muted-foreground" : ""
                        )}
                        data-align="right"
                      >
                        {valueLabel}
                      </TableCell>
                      <TableCell
                        className="px-4 font-mono text-[13px] tabular-nums text-foreground"
                        data-align="right"
                      >
                        {weightLabel}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      {summary.isPartial ? (
        <div className="mt-3 text-[12px] text-muted-foreground">
          Częściowa wycena: brak cen dla {summary.missingQuotes} pozycji, brak FX
          dla {summary.missingFx} pozycji.
        </div>
      ) : null}
    </ChartCard>
  );
}
