"use client";

import { cn } from "@/lib/cn";

import { formatChangePercent } from "./stock-chart-card-view-model";

export function StockChartCardHeader({
  direction,
  changePercent,
  rangeLabel,
}: Readonly<{
  direction: "up" | "down" | "flat";
  changePercent: number | null;
  rangeLabel: string;
}>) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
          Notowania
        </p>
        <h2 className="font-serif text-2xl font-bold tracking-tight">Wykres ceny</h2>
      </div>
      <div className="min-w-[120px] space-y-1 text-right">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          Zmiana {rangeLabel}
        </p>
        <p
          className={cn(
            "font-mono text-[1.05rem] font-semibold tabular-nums",
            direction === "up" && "text-[color:var(--profit)]",
            direction === "down" && "text-[color:var(--loss)]",
            direction === "flat" && "text-muted-foreground"
          )}
        >
          {formatChangePercent(changePercent)}
        </p>
      </div>
    </header>
  );
}
