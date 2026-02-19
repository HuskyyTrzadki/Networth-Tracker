"use client";

import dynamic from "next/dynamic";
import type { StockChartPlotProps } from "./StockChartPlotImpl";

const StockChartPlotImpl = dynamic(() => import("./StockChartPlotImpl"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[420px] w-full animate-pulse rounded-lg border border-dashed border-border/70 bg-card/40"
      aria-hidden="true"
    />
  ),
});

export function StockChartPlot(props: StockChartPlotProps) {
  return <StockChartPlotImpl {...props} />;
}
