"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";

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
import type {
  ComparisonLineDefinition,
  ComparisonOptionId,
} from "../lib/benchmark-config";
import type { SnapshotCurrency } from "../../lib/supported-currencies";

import {
  type ChartMode,
  type ChartRange,
  formatRangeLabel,
  rangeOptions,
} from "../lib/chart-helpers";

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
const CONTROLS_ROW_CLASS = "flex flex-wrap items-center gap-x-5 gap-y-2";
const CONTROL_GROUP_CLASS = "flex flex-wrap items-center gap-2.5";
const CONTROL_LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/82";
const LEDGER_TOGGLE_GROUP_CLASS =
  "inline-flex flex-wrap items-center gap-1 rounded-md bg-background/72 p-0.5";
const LEDGER_TOGGLE_ITEM_CLASS = "h-7 px-2.5 font-sans text-[11px]";

function ControlGroup({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div className={CONTROL_GROUP_CLASS}>
      <span className={CONTROL_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  );
}

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
      <div className={CONTROLS_ROW_CLASS}>
        <ControlGroup label="Tryb">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value === "VALUE" || value === "PERFORMANCE") {
                onModeChange(value);
              }
            }}
            className={LEDGER_TOGGLE_GROUP_CLASS}
            data-testid="portfolio-chart-mode-toggle"
          >
            <ToggleGroupItem
              className="h-8 px-3 font-sans text-[12px]"
              value="PERFORMANCE"
              variant="ledger"
              data-testid="portfolio-chart-mode-performance"
            >
              Performance
            </ToggleGroupItem>
            <ToggleGroupItem
              className="h-8 px-3 font-sans text-[12px]"
              value="VALUE"
              variant="ledger"
              data-testid="portfolio-chart-mode-value"
            >
              Wartość
            </ToggleGroupItem>
          </ToggleGroup>
        </ControlGroup>

        <ControlGroup label="Zakres">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => {
              const next = value as ChartRange;
              if (!next) return;
              onRangeChange(next);
            }}
            className={LEDGER_TOGGLE_GROUP_CLASS}
            data-testid="portfolio-chart-range-toggle"
          >
            {rangeOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                className={LEDGER_TOGGLE_ITEM_CLASS}
                value={option.value}
                disabled={isRangeDisabled(option.value)}
                variant="ledger"
                data-testid={`portfolio-chart-range-${option.value.toLowerCase()}`}
              >
                {formatRangeLabel(option.label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ControlGroup>
      </div>

      <div className={CONTROLS_ROW_CLASS}>
        <ControlGroup label="Waluta">
          <ToggleGroup
            type="single"
            value={currency}
            onValueChange={(value) => {
              if (value === "PLN" || value === "USD" || value === "EUR") {
                onCurrencyChange(value);
              }
            }}
            className={LEDGER_TOGGLE_GROUP_CLASS}
            data-testid="portfolio-chart-currency-toggle"
          >
            <ToggleGroupItem
              className={LEDGER_TOGGLE_ITEM_CLASS}
              value="PLN"
              variant="ledger"
              data-testid="portfolio-chart-currency-pln"
            >
              PLN
            </ToggleGroupItem>
            <ToggleGroupItem
              className={LEDGER_TOGGLE_ITEM_CLASS}
              value="USD"
              variant="ledger"
              data-testid="portfolio-chart-currency-usd"
            >
              USD
            </ToggleGroupItem>
            <ToggleGroupItem
              className={LEDGER_TOGGLE_ITEM_CLASS}
              value="EUR"
              variant="ledger"
              data-testid="portfolio-chart-currency-eur"
            >
              EUR
            </ToggleGroupItem>
          </ToggleGroup>
        </ControlGroup>

        {mode === "PERFORMANCE" && comparisonOptions.length > 0 ? (
          <ControlGroup label="Porównania">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="h-7 gap-1.5 rounded-full px-2.5 text-[11px]"
                  type="button"
                  variant="outline"
                >
                  Dodaj linię
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
          </ControlGroup>
        ) : null}
      </div>

      {rebuildStatus === "failed" || isAllHistoryLoading || isAllHistoryTruncated ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {rebuildStatus === "failed" && rebuildMessage ? (
            <span className="text-destructive">Błąd przebudowy: {rebuildMessage}</span>
          ) : null}
          {isAllHistoryLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Pobieram pełną historię dla zakresu ALL.
            </span>
          ) : null}
          {isAllHistoryTruncated && !isAllHistoryLoading ? (
            <span>Zakres ALL pobiera pełną historię dopiero po wybraniu tego widoku.</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
