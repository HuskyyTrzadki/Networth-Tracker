"use client";

import { cn } from "@/lib/cn";

type LegendItem = Readonly<{
  key: string;
  label: string;
  color?: string;
  variant?: "solid" | "ring";
}>;

export function StockChartLegend({
  items,
}: Readonly<{
  items: readonly LegendItem[];
}>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-sm border border-black/5 bg-[rgba(250,248,244,0.52)] px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground/88">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              item.variant === "ring" && "border-2 bg-white"
            )}
            style={{
              backgroundColor: item.variant === "ring" ? undefined : item.color,
              borderColor: item.variant === "ring" ? item.color : undefined,
            }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
