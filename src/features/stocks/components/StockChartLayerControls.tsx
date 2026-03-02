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
  isEventRangeEligible: boolean;
  hasTradeMarkers: boolean;
  activeOverlays: readonly StockChartOverlay[];
  showTradeMarkers: boolean;
  showCompanyEvents: boolean;
  showGlobalEvents: boolean;
  showNarration: boolean;
  onToggleTradeMarkers: (enabled: boolean) => void;
  onToggleCompanyEvents: (enabled: boolean) => void;
  onToggleGlobalEvents: (enabled: boolean) => void;
  onToggleNarration: (enabled: boolean) => void;
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
        "rounded-none border transition-[color,background-color,border-color,box-shadow] duration-150",
        compact ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-[12px]",
        active
          ? "border-black/30 bg-black/[0.085] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_1px_2px_rgba(0,0,0,0.06)] hover:bg-black/[0.1]"
          : "border-black/10 bg-white/88 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] hover:border-black/20 hover:bg-black/[0.025] hover:text-foreground",
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
  isEventRangeEligible,
  hasTradeMarkers,
  activeOverlays,
  showTradeMarkers,
  showCompanyEvents,
  showGlobalEvents,
  showNarration,
  onToggleTradeMarkers,
  onToggleCompanyEvents,
  onToggleGlobalEvents,
  onToggleNarration,
  onToggleOverlay,
  onSetFundamentalsEnabled,
}: Props) {
  const hasFundamentals = activeOverlays.length > 0;
  const hasEvents = showCompanyEvents || showGlobalEvents;
  const showSubRow = hasFundamentals || hasEvents;

  return (
    <div className="space-y-2.5 border-b border-dashed border-black/15 pb-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {hasTradeMarkers ? (
          <LayerChip
            label="Transakcje"
            active={showTradeMarkers}
            disabled={isLoading}
            onClick={() => onToggleTradeMarkers(!showTradeMarkers)}
          />
        ) : null}
        <LayerChip
          label="Wydarzenia"
          active={hasEvents}
          disabled={isLoading || !isEventRangeEligible}
          onClick={() => {
            const nextEnabled = !hasEvents;
            onToggleCompanyEvents(nextEnabled);
            onToggleGlobalEvents(false);
            if (!nextEnabled) {
              onToggleNarration(false);
            }
          }}
        />
        <LayerChip
          label="Fundamenty"
          active={hasFundamentals}
          disabled={isLoading}
          onClick={() => onSetFundamentalsEnabled(!hasFundamentals)}
        />
        <LayerChip
          label="Narracja"
          active={showNarration}
          disabled={isLoading || !isEventRangeEligible || !hasEvents}
          onClick={() => onToggleNarration(!showNarration)}
        />
      </div>

      {showSubRow ? (
        <div className="ml-0.5 flex flex-wrap items-center gap-1.5 border-l border-dashed border-black/15 pl-3">
          {hasEvents ? (
            <>
              <LayerChip
                label="Spolka"
                active={showCompanyEvents}
                disabled={isLoading || !isEventRangeEligible}
                compact
                onClick={() => {
                  const nextEnabled = !showCompanyEvents;
                  onToggleCompanyEvents(nextEnabled);
                  if (!nextEnabled && !showGlobalEvents) {
                    onToggleNarration(false);
                  }
                }}
              />
              <LayerChip
                label="Globalne"
                active={showGlobalEvents}
                disabled={isLoading || !isEventRangeEligible}
                compact
                onClick={() => {
                  const nextEnabled = !showGlobalEvents;
                  onToggleGlobalEvents(nextEnabled);
                  if (!showCompanyEvents && !nextEnabled) {
                    onToggleNarration(false);
                  }
                }}
              />
            </>
          ) : null}

          {hasFundamentals ? (
            <>
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
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
