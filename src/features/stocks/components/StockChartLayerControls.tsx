"use client";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

import {
  OVERLAY_KEYS,
  OVERLAY_LABELS,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import type { StockChartOverlay } from "../server/types";

type Props = Readonly<{
  mode: StockChartMode;
  isLoading: boolean;
  hasTradeMarkers: boolean;
  activeOverlays: readonly StockChartOverlay[];
  showTradeMarkers: boolean;
  onToggleTradeMarkers: (enabled: boolean) => void;
  onToggleOverlay: (overlay: StockChartOverlay, enabled: boolean) => void;
  onSetFundamentalsEnabled: (enabled: boolean) => void;
}>;

function LayerChip({
  label,
  active,
  disabled,
  compact = false,
  onClick,
}: Readonly<{
  label: string;
  active: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick: () => void;
}>) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-sm border transition-[color,background-color,border-color,box-shadow] duration-150",
        compact ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-[12px]",
        active
          ? "border-black/25 bg-black/[0.06] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_1px_2px_rgba(0,0,0,0.04)] hover:bg-black/[0.08]"
          : "border-black/10 bg-[rgba(250,248,244,0.6)] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] hover:border-black/15 hover:bg-black/[0.02] hover:text-foreground",
        disabled && "cursor-not-allowed"
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span
          className={cn(
            "rounded-full border transition-[background-color,border-color,box-shadow] duration-150",
            compact ? "size-2.5" : "size-3",
            active
              ? "border-black/70 bg-foreground shadow-[0_0_0_2px_rgba(0,0,0,0.08)]"
              : "border-black/20 bg-white"
          )}
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
    </Button>
  );
}

const FUNDAMENTAL_OPTIONS = OVERLAY_KEYS;

export function StockChartLayerControls({
  mode,
  isLoading,
  hasTradeMarkers,
  activeOverlays,
  showTradeMarkers,
  onToggleTradeMarkers,
  onToggleOverlay,
  onSetFundamentalsEnabled,
}: Props) {
  const hasFundamentals = activeOverlays.length > 0;
  const showSubRow = hasFundamentals;

  return (
    <div className="space-y-2 border-t border-dashed border-[color:var(--report-rule)]/20 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
          Nakladki
        </span>
        {hasTradeMarkers ? (
          <LayerChip
            label="Transakcje"
            active={showTradeMarkers}
            disabled={isLoading}
            onClick={() => onToggleTradeMarkers(!showTradeMarkers)}
          />
        ) : null}
        <LayerChip
          label="Fundamenty"
          active={hasFundamentals}
          disabled={isLoading}
          onClick={() => onSetFundamentalsEnabled(!hasFundamentals)}
        />
      </div>

      {showSubRow ? (
        <div className="ml-0.5 flex flex-wrap items-center gap-1.5 pl-0.5">
          {FUNDAMENTAL_OPTIONS.map((overlay) => (
            <LayerChip
              key={overlay}
              label={OVERLAY_LABELS[overlay]}
              active={activeOverlays.includes(overlay)}
              disabled={isLoading || (mode === "raw" && overlay === "revenueTtm")}
              compact
              onClick={() =>
                onToggleOverlay(overlay, !activeOverlays.includes(overlay))
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
