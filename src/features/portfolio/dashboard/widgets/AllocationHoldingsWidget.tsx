"use client";

import { useState, useSyncExternalStore } from "react";
import { ChartCard, StatusStrip } from "@/features/design-system";
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
const subscribeNoop = () => () => {};

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
  const [isConcentrationWarningDismissedByUser, setIsConcentrationWarningDismissedByUser] =
    useState(false);
  const isConcentrationWarningDismissedPersisted = useSyncExternalStore(
    subscribeNoop,
    () => window.localStorage.getItem(CONCENTRATION_WARNING_DISMISSED_KEY) === "1",
    () => false
  );
  const isConcentrationWarningDismissed =
    isConcentrationWarningDismissedByUser || isConcentrationWarningDismissedPersisted;
  const formatter = getCurrencyFormatter(summary.baseCurrency);
  const isRebuildBusy = rebuild.status === "queued" || rebuild.status === "running";
  const rebuildProgress = clampProgress(rebuild.progressPercent);
  const rebuildFromDate = rebuild.fromDate ?? rebuild.dirtyFrom;
  const concentrationWarning = getConcentrationWarning(summary);
  const concentrationTone =
    concentrationWarning?.severity === "CRITICAL"
      ? "border-l-[color:var(--loss)] bg-[color:var(--loss)]/16 text-[color:var(--loss)]"
    : concentrationWarning?.severity === "HARD"
        ? "border-l-[color:var(--loss)] bg-destructive/12 text-[color:var(--loss)]"
        : concentrationWarning
          ? "border-l-[color:var(--chart-3)] bg-muted/24 text-[color:var(--chart-3)]"
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
  const expandButtonLabel = "Powiększ";
  const expandButtonAriaLabel =
    effectiveMode === "TREEMAP"
      ? "Powiększ mapę alokacji"
      : effectiveMode === "BARS"
        ? "Powiększ słupki alokacji"
        : "Powiększ tabelę pozycji";
  const expandDialogTitle =
    effectiveMode === "TREEMAP"
      ? "Mapa alokacji"
      : effectiveMode === "BARS"
        ? "Słupki alokacji"
        : "Tabela pozycji";
  const expandDialogDescription =
    effectiveMode === "TREEMAP"
      ? "Widok pełnoekranowy."
      : effectiveMode === "BARS"
        ? "Widok pełnoekranowy."
        : "Widok pełnoekranowy.";

  return (
    <Dialog onOpenChange={setIsExpandedOpen} open={isExpandedOpen}>
      <ChartCard
        className="border-border/75 bg-card/94"
        surface="subtle"
        title="Alokacja i pozycje"
        subtitle={
          shouldForceTable
            ? "Skład portfela"
            : effectiveMode === "TREEMAP"
            ? "Mapa udziałów"
            : effectiveMode === "BARS"
              ? "Ranking udziałów"
              : "Skład portfela"
        }
        right={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ToggleGroup
              className="rounded-md border border-border/65 bg-background/70 p-1"
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
                <ToggleGroupItem className="h-8 px-3 text-[12px]" value="TREEMAP" variant="ledger">
                  Mapa
                </ToggleGroupItem>
              ) : null}
              {!shouldForceTable ? (
                <ToggleGroupItem className="h-8 px-3 text-[12px]" value="BARS" variant="ledger">
                  Słupki
                </ToggleGroupItem>
              ) : null}
              <ToggleGroupItem className="h-8 px-3 text-[12px]" value="HOLDINGS" variant="ledger">
                Tabela
              </ToggleGroupItem>
            </ToggleGroup>
            {summary.asOf ? (
              <StatusStrip
                className="hidden md:inline-flex"
                hint="Stan wyceny z ostatniego odświeżenia notowań."
                label={`Stan: ${formatAsOf(summary.asOf)}`}
              />
            ) : null}
            {canExpandView ? (
              <DialogTrigger asChild>
                <Button
                  aria-label={expandButtonAriaLabel}
                  className="h-8 gap-1.5 rounded-full px-2.5"
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
            <div className="grid h-full place-items-center rounded-lg border border-dashed border-border/70 bg-background/72 p-6 text-center">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[12px] font-medium text-primary">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Przebudowa historii
                </div>
                <div className="font-mono text-sm tabular-nums text-foreground">
                  {rebuildProgress !== null ? `${rebuildProgress}%` : "..."}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  {rebuildFromDate ?? "dziś"} - {rebuild.toDate ?? "dziś"}
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
              "mt-3 flex items-start justify-between gap-3 rounded-sm border border-dashed border-border/70 border-l-[3px] px-3 py-2 text-[12px] leading-5",
              concentrationTone
            )}
          >
            <p className="min-w-0">
              <span className="font-semibold">Koncentracja:</span> {concentrationWarning.symbol}{" "}
              to {formatPercent(concentrationWarning.weight, 0)} portfela.
            </p>
            <button
              aria-label="Zamknij ostrzeżenie o koncentracji"
              className="shrink-0 rounded-sm p-1 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/35"
              onClick={() => {
                setIsConcentrationWarningDismissedByUser(true);
                window.localStorage.setItem(CONCENTRATION_WARNING_DISMISSED_KEY, "1");
              }}
              type="button"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
        {summary.isPartial ? (
          <StatusStrip
            className="mt-3"
            hint={`Braki danych: ceny ${summary.missingQuotes}, FX ${summary.missingFx}.`}
            label="Status: częściowe"
            tone="warning"
          />
        ) : null}
      </ChartCard>
      <DialogContent className="h-[92vh] w-[96vw] max-w-[1800px] gap-0 overflow-hidden border border-border/70 bg-card/96 p-0">
        <DialogHeader className="border-b border-dashed border-border/70 px-5 py-3">
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
