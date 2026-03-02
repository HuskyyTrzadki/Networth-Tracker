"use client";

import dynamic from "next/dynamic";

import type { StockTradeMarker } from "../server/types";
import type { StockScreenerPreviewPoint } from "./StockScreenerPreviewChart";

const StockScreenerPreviewChart = dynamic(
  () =>
    import("./StockScreenerPreviewChart").then(
      (module) => module.StockScreenerPreviewChart
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full animate-pulse rounded-md border border-dashed border-border/70 bg-card/40"
        aria-hidden="true"
      />
    ),
  }
);

export function StockScreenerPreviewChartLazy({
  data,
  currency,
  tradeMarkers,
  className,
}: Readonly<{
  data: readonly StockScreenerPreviewPoint[];
  currency: string;
  tradeMarkers: readonly StockTradeMarker[];
  className?: string;
}>) {
  return (
    <StockScreenerPreviewChart
      data={data}
      currency={currency}
      tradeMarkers={tradeMarkers}
      className={className}
    />
  );
}
