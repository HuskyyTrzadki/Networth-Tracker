"use client";

import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

import {
  OVERLAY_CONTROL_LABELS,
  OVERLAY_KEYS,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import type { StockChartOverlay, StockChartRange } from "../server/types";

function OverlayToggleChip({
  label,
  active,
  disabled,
  onToggle,
}: Readonly<{
  label: string;
  active: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
}>) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "ghost"}
      className={cn(
        "h-auto min-h-7 rounded-none px-2.5 py-1 text-left text-[11px] leading-tight whitespace-normal",
        active
          ? "border border-black/15 bg-foreground text-background hover:bg-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      disabled={disabled}
      onClick={() => onToggle(!active)}
      aria-pressed={active}
    >
      {label}
    </Button>
  );
}

export function StockChartAdvancedOverlays({
  resolvedRange,
  normalizedOverlays,
  mode,
  isLoading,
  isEventRangeEligible,
  showNarration,
  showEarningsEvents,
  showNewsEvents,
  showUserTradeEvents,
  showGlobalNewsEvents,
  onToggleOverlay,
  onToggleNarration,
  onToggleEarnings,
  onToggleNews,
  onToggleUserTrades,
  onToggleGlobalNews,
}: Readonly<{
  resolvedRange: StockChartRange;
  normalizedOverlays: readonly StockChartOverlay[];
  mode: StockChartMode;
  isLoading: boolean;
  isEventRangeEligible: boolean;
  showNarration: boolean;
  showEarningsEvents: boolean;
  showNewsEvents: boolean;
  showUserTradeEvents: boolean;
  showGlobalNewsEvents: boolean;
  onToggleOverlay: (overlay: StockChartOverlay, enabled: boolean) => void;
  onToggleNarration: (enabled: boolean) => void;
  onToggleEarnings: (enabled: boolean) => void;
  onToggleNews: (enabled: boolean) => void;
  onToggleUserTrades: (enabled: boolean) => void;
  onToggleGlobalNews: (enabled: boolean) => void;
}>) {
  const [isOpen, setIsOpen] = useState(false);

  if (resolvedRange === "1D") return null;

  return (
    <div className="border-b border-dashed border-black/15 pb-2">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 rounded-none px-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Zaawansowane nakladki
      </Button>

      {isOpen ? (
        <div className="mt-1 flex flex-wrap items-start gap-2">
          {OVERLAY_KEYS.map((overlay) => (
            <OverlayToggleChip
              key={overlay}
              label={OVERLAY_CONTROL_LABELS[overlay]}
              active={normalizedOverlays.includes(overlay)}
              disabled={isLoading || (mode === "raw" && overlay === "revenueTtm")}
              onToggle={(enabled) => onToggleOverlay(overlay, enabled)}
            />
          ))}
          <span className="hidden h-5 w-px bg-black/15 lg:block" aria-hidden />
          <OverlayToggleChip
            label="Narracja"
            active={isEventRangeEligible ? showNarration : false}
            disabled={!isEventRangeEligible}
            onToggle={onToggleNarration}
          />
          <OverlayToggleChip
            label="Wyniki (konsensus vs raport)"
            active={isEventRangeEligible ? showEarningsEvents : false}
            disabled={!isEventRangeEligible}
            onToggle={onToggleEarnings}
          />
          <OverlayToggleChip
            label="Wazne wydarzenia"
            active={isEventRangeEligible ? showNewsEvents : false}
            disabled={!isEventRangeEligible}
            onToggle={onToggleNews}
          />
          <OverlayToggleChip
            label="BUY/SELL uzytkownika (mock)"
            active={isEventRangeEligible ? showUserTradeEvents : false}
            disabled={!isEventRangeEligible}
            onToggle={onToggleUserTrades}
          />
          <OverlayToggleChip
            label="Wazne wydarzenia globalne"
            active={isEventRangeEligible ? showGlobalNewsEvents : false}
            disabled={!isEventRangeEligible}
            onToggle={onToggleGlobalNews}
          />
        </div>
      ) : null}
    </div>
  );
}
