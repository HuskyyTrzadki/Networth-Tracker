"use client";

import StockChartPlotImpl, { type StockChartPlotProps } from "./StockChartPlotImpl";

export function StockChartPlot(props: StockChartPlotProps) {
  return <StockChartPlotImpl {...props} />;
}
