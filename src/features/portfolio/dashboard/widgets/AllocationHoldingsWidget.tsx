"use client";

import { useState } from "react";
import { AllocationDonutChart, ChartCard } from "@/features/design-system";
import { Alert } from "@/features/design-system/components/ui/alert";
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
} from "@/lib/format-currency";
import { AlertTriangle, Loader2 } from "lucide-react";

import type { PortfolioSummary } from "../../server/valuation";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import { buildAllocationData } from "./allocation-utils";
import { getConcentrationWarning } from "./concentration-utils";
import { sortHoldingsByValueDesc } from "./holdings-sort";

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
  const warningTone =
    concentrationWarning?.severity === "CRITICAL"
      ? "text-destructive bg-destructive/10"
      : concentrationWarning?.severity === "HARD"
        ? "text-rose-700 bg-rose-50/80 dark:bg-rose-500/10"
        : concentrationWarning
          ? "text-amber-700 bg-amber-50/85 dark:bg-amber-500/10"
          : "";
  const totalLabel =
    formatter && summary.totalValueBase
      ? formatCurrencyString(summary.totalValueBase, formatter) ?? "—"
      : "—";

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
            className="rounded-lg border border-border/70 bg-muted/45 p-0.5"
            onValueChange={(value) => {
              if (value === "ALLOCATION" || value === "HOLDINGS") setMode(value);
            }}
            type="single"
            value={mode}
          >
            <ToggleGroupItem className="h-8 px-3 text-sm" value="ALLOCATION">
              Koło
            </ToggleGroupItem>
            <ToggleGroupItem className="h-8 px-3 text-sm" value="HOLDINGS">
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
      <div className="h-[460px] lg:h-[560px]">
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
          <div className="flex h-full flex-col gap-5 overflow-y-auto pr-1">
            <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
              <div className="relative w-full">
                {hasAllocation ? (
                  <AllocationDonutChart data={slices} height={300} />
                ) : (
                    <div className="grid h-[300px] w-full place-items-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground">
                      Brak danych do alokacji
                    </div>
                )}
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-[12px] font-medium text-muted-foreground">
                      Wartość portfela
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
                      {totalLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {hasAllocation ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {allocationRows.map((row) => {
                  const valueLabel =
                    formatter && row.valueBase
                      ? formatCurrencyString(row.valueBase, formatter) ??
                        `${row.valueBase} ${summary.baseCurrency}`
                      : row.valueBase
                        ? `${row.valueBase} ${summary.baseCurrency}`
                        : "—";

                  return (
                    <div
                      key={row.id}
                      className="rounded-md border border-border/70 bg-card p-3"
                    >
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
                        <div className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-foreground">
                          {formatPercent(row.share)}
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
                      <div className="mt-2 text-right">
                        <div className="font-mono text-[12px] tabular-nums text-muted-foreground">
                          {valueLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {concentrationWarning ? (
              <Alert className={cn("flex items-start gap-2 border-none px-2 py-1.5 text-[13px] shadow-none", warningTone)}>
                <AlertTriangle className="mt-0.5 size-4" aria-hidden />
                <span className="text-inherit">
                  {concentrationWarning.symbol} stanowi{" "}
                  {formatPercent(concentrationWarning.weight, 0)} portfela.
                </span>
              </Alert>
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
