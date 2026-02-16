"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { Badge } from "@/features/design-system/components/ui/badge";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import { Checkbox } from "@/features/design-system/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";
import type { ComparisonLineDefinition, ComparisonOptionId } from "../lib/benchmark-config";
import type { SnapshotCurrency } from "../../lib/supported-currencies";

import { type ChartMode, type ChartRange, formatRangeLabel, rangeOptions } from "../lib/chart-helpers";

type Props = Readonly<{
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  isRangeDisabled: (range: ChartRange) => boolean;
  currency: SnapshotCurrency;
  onCurrencyChange: (currency: SnapshotCurrency) => void;
  comparisonOptions: readonly ComparisonLineDefinition[];
  selectedComparisons: readonly ComparisonOptionId[];
  loadingComparisons?: readonly ComparisonOptionId[];
  onComparisonChange: (
    optionId: ComparisonOptionId,
    enabled: boolean
  ) => void;
  performancePartial: boolean;
  valueIsPartial: boolean;
  missingQuotes: number;
  missingFx: number;
  liveAsOf: string | null;
  rebuildStatus: "idle" | "queued" | "running" | "failed";
  rebuildMessage: string | null;
  isAllHistoryLoading?: boolean;
  isAllHistoryTruncated?: boolean;
}>;

export function PortfolioValueOverTimeHeader({
  mode,
  onModeChange,
  range,
  onRangeChange,
  isRangeDisabled,
  currency,
  onCurrencyChange,
  comparisonOptions = [],
  selectedComparisons = [],
  loadingComparisons = [],
  onComparisonChange,
  performancePartial,
  valueIsPartial,
  missingQuotes,
  missingFx,
  liveAsOf,
  rebuildStatus,
  rebuildMessage,
  isAllHistoryLoading = false,
  isAllHistoryTruncated = false,
}: Props) {
  const selectedComparisonsCount = selectedComparisons.length;
  const liveAsOfDate = liveAsOf ? new Date(liveAsOf) : null;
  const quoteAsOfLabel =
    liveAsOfDate && Number.isFinite(liveAsOfDate.getTime())
      ? new Intl.DateTimeFormat("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(liveAsOfDate)
      : null;
  const fxAsOfLabel =
    liveAsOfDate && Number.isFinite(liveAsOfDate.getTime())
      ? new Intl.DateTimeFormat("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(liveAsOfDate)
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-md px-2 py-0.5 text-[11px]" variant="outline">
          Notowania z {quoteAsOfLabel ?? "—"}
        </Badge>
        <Badge className="rounded-md px-2 py-0.5 text-[11px]" variant="outline">
          Kurs FX z dnia {fxAsOfLabel ?? "—"}
        </Badge>
      </div>
      <div className="flex flex-wrap items-end gap-2.5 xl:flex-nowrap">
        <div className="rounded-md border border-border/60 bg-card p-2.5">
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/90">
            Tryb
          </div>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value === "VALUE" || value === "PERFORMANCE") {
                onModeChange(value);
              }
            }}
            className="flex flex-wrap gap-1.5"
          >
            <ToggleGroupItem className="h-8 px-3 text-xs" value="PERFORMANCE">
              Performance
            </ToggleGroupItem>
            <ToggleGroupItem className="h-8 px-3 text-xs" value="VALUE">
              Wartość
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="rounded-md border border-border/60 bg-card p-2.5">
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/90">
            Zakres
          </div>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => {
              const next = value as ChartRange;
              if (!next) return;
              onRangeChange(next);
            }}
            className="flex flex-wrap gap-1.5"
          >
            {rangeOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                className="h-8 px-3 text-xs"
                value={option.value}
                disabled={isRangeDisabled(option.value)}
              >
                {formatRangeLabel(option.label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="rounded-md border border-border/60 bg-card p-2.5">
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/90">
            Waluta
          </div>
          <ToggleGroup
            type="single"
            value={currency}
            onValueChange={(value) => {
              if (value === "PLN" || value === "USD" || value === "EUR") {
                onCurrencyChange(value);
              }
            }}
            className="gap-1"
          >
            <ToggleGroupItem className="h-8 px-2.5 text-xs" value="PLN">
              PLN
            </ToggleGroupItem>
            <ToggleGroupItem className="h-8 px-2.5 text-xs" value="USD">
              USD
            </ToggleGroupItem>
            <ToggleGroupItem className="h-8 px-2.5 text-xs" value="EUR">
              EUR
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {mode === "PERFORMANCE" && range !== "1D" && comparisonOptions.length > 0 ? (
          <div className="rounded-md border border-border/60 bg-card p-2.5">
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/90">
              Porównania
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  type="button"
                  variant="outline"
                >
                  Porównaj z...
                  {selectedComparisonsCount > 0 ? ` (${selectedComparisonsCount})` : ""}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="space-y-1">
                  {comparisonOptions.map((option) => {
                    const checked = selectedComparisons.includes(option.id);
                    const isLoading = loadingComparisons.includes(option.id);

                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50",
                          checked ? "text-foreground" : ""
                        )}
                      >
                        <div className="inline-flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(enabled) =>
                              onComparisonChange(option.id, enabled === true)
                            }
                          />
                          <span>{option.label}</span>
                        </div>
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : checked ? (
                          <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : null}
      </div>

      {mode === "PERFORMANCE" && performancePartial ? (
        <div className="text-xs text-muted-foreground">
          Częściowe dane: performance może być przybliżone.
        </div>
      ) : null}

      {mode === "VALUE" && valueIsPartial ? (
        <div className="text-xs text-muted-foreground">
          Częściowa wycena: brak cen dla {missingQuotes} pozycji, brak FX dla{" "}
          {missingFx} pozycji.
        </div>
      ) : null}

      {rebuildStatus === "failed" && rebuildMessage ? (
        <div className="text-xs text-destructive">
          Nie udało się przebudować historii: {rebuildMessage}
        </div>
      ) : null}

      {isAllHistoryLoading ? (
        <div className="text-xs text-muted-foreground">
          Wczytywanie pełnej historii dla zakresu ALL...
        </div>
      ) : null}
      {isAllHistoryTruncated && !isAllHistoryLoading ? (
        <div className="text-xs text-muted-foreground">
          Pokazano skróconą historię. Przełącz na zakres ALL, aby dociągnąć pełne dane.
        </div>
      ) : null}

    </div>
  );
}
