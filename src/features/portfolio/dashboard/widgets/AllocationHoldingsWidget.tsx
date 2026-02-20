"use client";

import { useState } from "react";
import { ChartCard } from "@/features/design-system";
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
import { Loader2 } from "lucide-react";

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

  return (
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
      {mode !== "HOLDINGS" && concentrationWarning ? (
        <div
          className={cn(
            "mt-3 rounded-sm border-l-[3px] px-3 py-2 text-[13px] leading-5",
            concentrationTone
          )}
        >
          <p>
            <span className="font-semibold">Uwaga dot. koncentracji:</span>{" "}
            {concentrationWarning.symbol} stanowi {formatPercent(concentrationWarning.weight, 0)}
            {" "}Twojego portfela.
          </p>
        </div>
      ) : null}
      {summary.isPartial ? (
        <div className="mt-3 text-[12px] text-muted-foreground">
          Częściowa wycena: brak cen dla {summary.missingQuotes} pozycji, brak FX dla{" "}
          {summary.missingFx} pozycji.
        </div>
      ) : null}
    </ChartCard>
  );
}
