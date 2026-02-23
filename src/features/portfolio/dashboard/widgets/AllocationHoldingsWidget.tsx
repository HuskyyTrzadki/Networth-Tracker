"use client";

import { useState } from "react";
import { ChartCard } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/features/design-system/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import { cn } from "@/lib/cn";
import {
  formatCurrencyString,
  getCurrencyFormatter,
  splitCurrencyLabel,
} from "@/lib/format-currency";
import { Loader2, Maximize2, X } from "lucide-react";

import type { PortfolioSummary } from "../../server/valuation";
import type { SnapshotRebuildStatus } from "../hooks/useSnapshotRebuild";
import { getConcentrationWarning } from "./concentration-utils";
import { sortHoldingsByValueDesc } from "./holdings-sort";
import { AllocationBarsView } from "./AllocationBarsView";
import { AllocationHoldingsTableView } from "./AllocationHoldingsTableView";
import { AllocationTreemapView } from "./AllocationTreemapView";
import { buildAllocationViewModel } from "./allocation-view-model";

type Props = Readonly<{
  summary: PortfolioSummary;
  rebuild: SnapshotRebuildStatus;
}>;

type Mode = "TREEMAP" | "BARS" | "HOLDINGS";
const CONCENTRATION_WARNING_DISMISSED_KEY = "portfolio:concentration-warning:dismissed:v1";

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

const clampProgress = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export function AllocationHoldingsWidget({ summary, rebuild }: Props) {
  const [mode, setMode] = useState<Mode>("TREEMAP");
  const [isExpandedOpen, setIsExpandedOpen] = useState(false);
  const [isConcentrationWarningDismissed, setIsConcentrationWarningDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(CONCENTRATION_WARNING_DISMISSED_KEY) === "1"
  );
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

  const allocation = buildAllocationViewModel(summary);
  const holdingsRows = sortHoldingsByValueDesc(summary.holdings);
  const allocationItemsCount = allocation.assets.length;
  const shouldForceTable = allocationItemsCount <= 1;
  const isTreemapEligible = allocationItemsCount > 4;
  const effectiveMode: Mode = shouldForceTable
    ? "HOLDINGS"
    : !isTreemapEligible && mode === "TREEMAP"
      ? "BARS"
      : mode;
  const canExpandView = !isRebuildBusy;
  const expandButtonLabel =
    effectiveMode === "TREEMAP"
      ? "Powiększ mapę"
      : effectiveMode === "BARS"
        ? "Powiększ słupki"
        : "Powiększ tabelę";
  const expandButtonAriaLabel =
    effectiveMode === "TREEMAP"
      ? "Powiększ mapę alokacji"
      : effectiveMode === "BARS"
        ? "Powiększ słupki alokacji"
        : "Powiększ tabelę pozycji";
  const expandDialogTitle =
    effectiveMode === "TREEMAP"
      ? "Mapa alokacji - widok powiększony"
      : effectiveMode === "BARS"
        ? "Słupki alokacji - widok powiększony"
        : "Tabela pozycji - widok powiększony";
  const expandDialogDescription =
    effectiveMode === "TREEMAP"
      ? "Pełny widok mapy bez ograniczeń wysokości widgetu."
      : effectiveMode === "BARS"
        ? "Pełny widok słupków bez ograniczeń wysokości widgetu."
        : "Pełny widok tabeli bez ograniczeń wysokości widgetu.";

  return (
    <Dialog onOpenChange={setIsExpandedOpen} open={isExpandedOpen}>
      <ChartCard
        surface="subtle"
        title={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span>Alokacja i pozycje</span>
            <ToggleGroup
              className="rounded-md border border-border/70 bg-muted/35 p-1"
              onValueChange={(value) => {
                if (shouldForceTable) return;
                if (!isTreemapEligible && value === "TREEMAP") return;
                if (value === "TREEMAP" || value === "BARS" || value === "HOLDINGS") {
                  setMode(value);
                }
              }}
              type="single"
              value={effectiveMode}
            >
              {!shouldForceTable && isTreemapEligible ? (
                <ToggleGroupItem className="h-8 px-3 text-sm" value="TREEMAP" variant="ledger">
                  Mapa
                </ToggleGroupItem>
              ) : null}
              {!shouldForceTable ? (
                <ToggleGroupItem className="h-8 px-3 text-sm" value="BARS" variant="ledger">
                  Słupki
                </ToggleGroupItem>
              ) : null}
              <ToggleGroupItem className="h-8 px-3 text-sm" value="HOLDINGS" variant="ledger">
                Tabela
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        }
        subtitle={
          shouldForceTable
            ? "Aktualny skład portfela"
            : effectiveMode === "TREEMAP"
            ? "Mapa udziału wartości portfela"
            : effectiveMode === "BARS"
              ? "Ranking udziałów pozycji"
              : "Aktualny skład portfela"
        }
        right={
          <div className="flex items-center gap-2">
            {summary.asOf ? (
              <div className="hidden text-right text-[12px] text-muted-foreground md:block">
                Opóźniony stan na: {formatAsOf(summary.asOf)}
              </div>
            ) : null}
            {canExpandView ? (
              <DialogTrigger asChild>
                <Button
                  aria-label={expandButtonAriaLabel}
                  className="h-8 gap-1.5 px-2.5"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Maximize2 className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">{expandButtonLabel}</span>
                </Button>
              </DialogTrigger>
            ) : null}
          </div>
        }
      >
        <div className="h-[500px] lg:h-[650px]">
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
          ) : effectiveMode === "HOLDINGS" ? (
            <AllocationHoldingsTableView holdingsRows={holdingsRows} summary={summary} />
          ) : effectiveMode === "TREEMAP" ? (
            <AllocationTreemapView
              baseCurrency={summary.baseCurrency}
              categories={allocation.categories}
              totalAmountLabel={totalAmountLabel}
              totalCurrencyLabel={totalCurrencyLabel}
            />
          ) : effectiveMode === "BARS" ? (
            <AllocationBarsView assets={allocation.assets} baseCurrency={summary.baseCurrency} />
          ) : (
            <AllocationHoldingsTableView holdingsRows={holdingsRows} summary={summary} />
          )}
        </div>
        {effectiveMode !== "HOLDINGS" &&
        concentrationWarning &&
        !isConcentrationWarningDismissed ? (
          <div
            className={cn(
              "mt-3 flex items-start justify-between gap-3 rounded-sm border-l-[3px] px-3 py-2 text-[13px] leading-5",
              concentrationTone
            )}
          >
            <p className="min-w-0">
              <span className="font-semibold">Uwaga dot. koncentracji:</span>{" "}
              {concentrationWarning.symbol} stanowi {formatPercent(concentrationWarning.weight, 0)}
              {" "}Twojego portfela.
            </p>
            <button
              aria-label="Zamknij ostrzeżenie o koncentracji"
              className="shrink-0 rounded-sm p-1 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/35"
              onClick={() => {
                setIsConcentrationWarningDismissed(true);
                window.localStorage.setItem(CONCENTRATION_WARNING_DISMISSED_KEY, "1");
              }}
              type="button"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
        {summary.isPartial ? (
          <div className="mt-3 text-[12px] text-muted-foreground">
            Częściowa wycena: brak cen dla {summary.missingQuotes} pozycji, brak FX dla{" "}
            {summary.missingFx} pozycji.
          </div>
        ) : null}
      </ChartCard>
      <DialogContent className="h-[92vh] w-[96vw] max-w-[1800px] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-5 py-3">
          <DialogTitle>{expandDialogTitle}</DialogTitle>
          <DialogDescription>{expandDialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="h-[calc(92vh-84px)] p-4">
          {effectiveMode === "HOLDINGS" ? (
            <AllocationHoldingsTableView holdingsRows={holdingsRows} summary={summary} />
          ) : effectiveMode === "TREEMAP" ? (
            <AllocationTreemapView
              baseCurrency={summary.baseCurrency}
              categories={allocation.categories}
              totalAmountLabel={totalAmountLabel}
              totalCurrencyLabel={totalCurrencyLabel}
            />
          ) : (
            <AllocationBarsView assets={allocation.assets} baseCurrency={summary.baseCurrency} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
