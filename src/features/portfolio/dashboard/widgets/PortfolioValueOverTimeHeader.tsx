"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";

import { StatusStrip } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
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
  rebuildStatus: "idle" | "queued" | "running" | "failed";
  rebuildMessage: string | null;
  isAllHistoryLoading?: boolean;
  isAllHistoryTruncated?: boolean;
}>;

const EMPTY_COMPARISON_OPTIONS: readonly ComparisonLineDefinition[] = [];
const EMPTY_SELECTED_COMPARISONS: readonly ComparisonOptionId[] = [];
const EMPTY_LOADING_COMPARISONS: readonly ComparisonOptionId[] = [];
const PRIMARY_BOARD_CLASS =
  "flex flex-wrap items-end gap-2 rounded-md border border-dashed border-border/65 bg-background/68 p-2";
const PRIMARY_PANEL_CLASS = "space-y-1 rounded-md border border-border/60 bg-background/80 p-1.5";
const SECONDARY_BOARD_CLASS = "flex flex-wrap items-center gap-2";
const SECONDARY_PANEL_CLASS = "space-y-1";
const CONTROL_LABEL_CLASS =
  "px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85";
const LEDGER_TOGGLE_GROUP_CLASS =
  "inline-flex flex-wrap items-center gap-1 rounded-md border border-border/65 bg-background/72 p-0.5";
const LEDGER_TOGGLE_ITEM_CLASS = "h-7 px-2.5 font-sans text-[11px]";

export function PortfolioValueOverTimeHeader({
  mode,
  onModeChange,
  range,
  onRangeChange,
  isRangeDisabled,
  currency,
  onCurrencyChange,
  comparisonOptions = EMPTY_COMPARISON_OPTIONS,
  selectedComparisons = EMPTY_SELECTED_COMPARISONS,
  loadingComparisons = EMPTY_LOADING_COMPARISONS,
  onComparisonChange,
  rebuildStatus,
  rebuildMessage,
  isAllHistoryLoading = false,
  isAllHistoryTruncated = false,
}: Props) {
  const selectedComparisonsCount = selectedComparisons.length;

  return (
    <div className="space-y-3">
      <div className={PRIMARY_BOARD_CLASS}>
        <div className={PRIMARY_PANEL_CLASS}>
          <div className={CONTROL_LABEL_CLASS}>Tryb</div>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value === "VALUE" || value === "PERFORMANCE") {
                onModeChange(value);
              }
            }}
            className={LEDGER_TOGGLE_GROUP_CLASS}
          >
            <ToggleGroupItem
              className="h-8 px-3 font-sans text-[12px]"
              value="PERFORMANCE"
              variant="ledger"
            >
              Performance
            </ToggleGroupItem>
            <ToggleGroupItem
              className="h-8 px-3 font-sans text-[12px]"
              value="VALUE"
              variant="ledger"
            >
              Wartość
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className={PRIMARY_PANEL_CLASS}>
          <div className={CONTROL_LABEL_CLASS}>Zakres</div>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => {
              const next = value as ChartRange;
              if (!next) return;
              onRangeChange(next);
            }}
            className={LEDGER_TOGGLE_GROUP_CLASS}
          >
            {rangeOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                className={LEDGER_TOGGLE_ITEM_CLASS}
                value={option.value}
                disabled={isRangeDisabled(option.value)}
                variant="ledger"
              >
                {formatRangeLabel(option.label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <div className={SECONDARY_BOARD_CLASS}>
        <div className={SECONDARY_PANEL_CLASS}>
          <div className={CONTROL_LABEL_CLASS}>Waluta</div>
          <ToggleGroup
            type="single"
            value={currency}
            onValueChange={(value) => {
              if (value === "PLN" || value === "USD" || value === "EUR") {
                onCurrencyChange(value);
              }
            }}
            className={LEDGER_TOGGLE_GROUP_CLASS}
          >
            <ToggleGroupItem
              className={LEDGER_TOGGLE_ITEM_CLASS}
              value="PLN"
              variant="ledger"
            >
              PLN
            </ToggleGroupItem>
            <ToggleGroupItem
              className={LEDGER_TOGGLE_ITEM_CLASS}
              value="USD"
              variant="ledger"
            >
              USD
            </ToggleGroupItem>
            <ToggleGroupItem
              className={LEDGER_TOGGLE_ITEM_CLASS}
              value="EUR"
              variant="ledger"
            >
              EUR
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {mode === "PERFORMANCE" && comparisonOptions.length > 0 ? (
          <div className={SECONDARY_PANEL_CLASS}>
            <div className={CONTROL_LABEL_CLASS}>Porównania</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="h-7 gap-1.5 rounded-full border-dashed px-2.5 text-[11px]"
                  type="button"
                  variant="outline"
                >
                  Porównaj
                  {selectedComparisonsCount > 0 ? ` (${selectedComparisonsCount})` : ""}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-56 border border-border/70 bg-card/96 p-2 shadow-[var(--surface-shadow)]"
              >
                <div className="space-y-1">
                  {comparisonOptions.map((option) => {
                    const checked = selectedComparisons.includes(option.id);
                    const isLoading = loadingComparisons.includes(option.id);

                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs text-muted-foreground hover:border-border/55 hover:bg-background/72",
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

      {rebuildStatus === "failed" && rebuildMessage ? (
        <div className="rounded-sm border border-[color:var(--loss)]/35 bg-[color:var(--loss)]/10 px-2.5 py-1.5 text-xs text-destructive">
          Błąd przebudowy: {rebuildMessage}
        </div>
      ) : null}

      {isAllHistoryLoading ? (
        <StatusStrip label="Status: wczytywanie ALL" />
      ) : null}
      {isAllHistoryTruncated && !isAllHistoryLoading ? (
        <StatusStrip
          hint="Przełącz zakres na ALL, aby pobrać pełną historię."
          label="Status: skrócona historia"
        />
      ) : null}
    </div>
  );
}
