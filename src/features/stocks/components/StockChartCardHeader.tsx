"use client";

import { cn } from "@/lib/cn";

import { formatChangePercent } from "./stock-chart-card-view-model";

export function StockChartCardHeader({
  direction,
  changePercent,
}: Readonly<{
  direction: "up" | "down" | "flat";
  changePercent: number | null;
}>) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-2">
      <h2 className="font-serif text-2xl font-bold tracking-tight">Wykres ceny</h2>
      <p
        className={cn(
          "font-mono text-[11px] font-semibold tabular-nums",
          direction === "up" && "text-[color:var(--profit)]",
          direction === "down" && "text-[color:var(--loss)]",
          direction === "flat" && "text-muted-foreground"
        )}
      >
        Zmiana zakresu: {formatChangePercent(changePercent)}
      </p>
    </header>
  );
}
