"use client";

import type { ReactNode } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/features/design-system/components/ui/toggle-group";
import { cn } from "@/lib/cn";

import type { StockChartMode } from "./stock-chart-card-helpers";
import { STOCK_CHART_RANGES, type StockChartRange } from "../server/types";

type Props = Readonly<{
  range: StockChartRange;
  mode: StockChartMode;
  isLoading: boolean;
  onRangeChange: (value: StockChartRange) => void;
  onModeChange: (value: StockChartMode) => void;
  isRangeDisabledOption: (range: StockChartRange) => boolean;
}>;

function ControlGroup({
  label,
  children,
  className,
}: Readonly<{
  label: string;
  children: ReactNode;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "rounded-sm border border-black/10 bg-[rgba(250,248,244,0.82)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        className
      )}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
        {label}
      </div>
      {children}
    </div>
  );
}

export function StockChartPrimaryControls({
  range,
  mode,
  isLoading,
  onRangeChange,
  onModeChange,
  isRangeDisabledOption,
}: Props) {
  return (
    <div className="grid gap-3 border-b border-dashed border-[color:var(--report-rule)]/20 pb-3.5 xl:grid-cols-[1fr_auto] xl:items-stretch">
      <ControlGroup label="Zakres">
        <div className="inline-flex border border-black/15 bg-white/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => {
              if (!value) return;
              onRangeChange(value as StockChartRange);
            }}
            className="flex flex-wrap gap-1"
            aria-label="Zakres wykresu"
          >
            {STOCK_CHART_RANGES.map((rangeOption) => (
              <ToggleGroupItem
                key={rangeOption}
                value={rangeOption}
                variant="ledger"
                size="sm"
                disabled={isRangeDisabledOption(rangeOption)}
                className={cn("min-w-10 rounded-none px-2.5 font-mono text-[11px]")}
                aria-label={`Zakres ${rangeOption}`}
              >
                {rangeOption}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </ControlGroup>

      <ControlGroup label="Tryb" className="xl:justify-self-end">
        <div className="inline-flex border border-black/15 bg-white/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value === "trend" || value === "raw") {
                onModeChange(value);
              }
            }}
            className="gap-1"
            aria-label="Tryb wykresu"
          >
            <ToggleGroupItem
              value="trend"
              variant="ledger"
              size="sm"
              disabled={isLoading}
              className="rounded-none px-3 text-xs"
            >
              Trend (100)
            </ToggleGroupItem>
            <ToggleGroupItem
              value="raw"
              variant="ledger"
              size="sm"
              disabled={isLoading}
              className="rounded-none px-3 text-xs"
            >
              Surowe
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </ControlGroup>
    </div>
  );
}
