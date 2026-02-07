"use client";

import { Loader2 } from "lucide-react";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import { Checkbox } from "@/features/design-system/components/ui/checkbox";
import type { ComparisonLineDefinition, ComparisonOptionId } from "../lib/benchmark-config";

import { type ChartMode, type ChartRange, formatRangeLabel, rangeOptions } from "../lib/chart-helpers";

type Props = Readonly<{
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  isRangeDisabled: (range: ChartRange) => boolean;
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
  rebuildStatus: "idle" | "queued" | "running" | "failed";
  rebuildFromDate: string | null;
  rebuildToDate: string | null;
  rebuildProgressPercent: number | null;
  rebuildMessage: string | null;
}>;

export function PortfolioValueOverTimeHeader({
  mode,
  onModeChange,
  range,
  onRangeChange,
  isRangeDisabled,
  comparisonOptions = [],
  selectedComparisons = [],
  loadingComparisons = [],
  onComparisonChange,
  performancePartial,
  valueIsPartial,
  missingQuotes,
  missingFx,
  rebuildStatus,
  rebuildFromDate,
  rebuildToDate,
  rebuildProgressPercent,
  rebuildMessage,
}: Props) {
  const isRebuildBusy = rebuildStatus === "queued" || rebuildStatus === "running";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value === "VALUE" || value === "PERFORMANCE") {
              onModeChange(value);
            }
          }}
          className="flex flex-wrap gap-2"
        >
          <ToggleGroupItem value="PERFORMANCE">Performance</ToggleGroupItem>
          <ToggleGroupItem value="VALUE">Wartość</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(value) => {
            const next = value as ChartRange;
            if (!next) return;
            onRangeChange(next);
          }}
          className="flex flex-wrap gap-2"
        >
          {rangeOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              disabled={isRangeDisabled(option.value)}
            >
              {formatRangeLabel(option.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {mode === "PERFORMANCE" && performancePartial ? (
        <div className="text-xs text-muted-foreground">
          Częściowe dane: performance może być przybliżone.
        </div>
      ) : null}

      {mode === "PERFORMANCE" && range !== "1D" && comparisonOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          {comparisonOptions.map((option) => {
            const checked = selectedComparisons.includes(option.id);
            const isLoading = loadingComparisons.includes(option.id);

            return (
              <label
                key={option.id}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(enabled) =>
                    onComparisonChange(option.id, enabled === true)
                  }
                />
                <span>{option.label}</span>
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : null}
              </label>
            );
          })}
        </div>
      ) : null}

      {mode === "VALUE" && valueIsPartial ? (
        <div className="text-xs text-muted-foreground">
          Częściowa wycena: brak cen dla {missingQuotes} pozycji, brak FX dla{" "}
          {missingFx} pozycji.
        </div>
      ) : null}

      {isRebuildBusy ? (
        <div className="w-full max-w-md space-y-1.5">
          <div className="text-xs text-muted-foreground">
            Trwa przebudowa historii snapshotów
            {rebuildFromDate ? ` od ${rebuildFromDate}` : ""}.
            {rebuildToDate ? ` Zakres do ${rebuildToDate}.` : ""}
            {rebuildProgressPercent !== null
              ? ` (${Math.round(rebuildProgressPercent)}%)`
              : ""}
          </div>
          {rebuildProgressPercent !== null ? (
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(rebuildProgressPercent)}
            >
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${rebuildProgressPercent}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {rebuildStatus === "failed" && rebuildMessage ? (
        <div className="text-xs text-destructive">
          Nie udało się przebudować historii: {rebuildMessage}
        </div>
      ) : null}
    </div>
  );
}
