"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoaderCircle } from "lucide-react";

import type {
  StockChartOverlay,
  StockChartResponse,
  StockTradeMarker,
} from "../server/types";
import {
  OVERLAY_LINE_COLORS,
  formatEps,
  formatLabelDate,
  formatPe,
  formatPrice,
  formatRevenue,
  formatXAxisTick,
  toOverlayLineDataKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";

type VisibleMarker = Readonly<{
  key: string;
  t: string;
  side: StockTradeMarker["side"];
  portfolioName: string;
  price: number;
}>;

type ChartDataPoint = Readonly<{
  t: string;
  price: number | null;
  peRaw: number | null;
  epsTtmRaw: number | null;
  revenueTtmRaw: number | null;
  peLabel: "N/M" | "-" | null;
  peIndex: number | null;
  epsTtmIndex: number | null;
  revenueTtmIndex: number | null;
}>;

type Props = Readonly<{
  chart: StockChartResponse | null;
  chartData: readonly ChartDataPoint[];
  normalizedOverlays: readonly StockChartOverlay[];
  mode: StockChartMode;
  showOverlayAxis: boolean;
  priceAxisDomainForChart: [number, number] | undefined;
  overlayAxisDomainForChart: [number, number] | undefined;
  overlayAxisLabel: string | null;
  visibleTradeMarkers: readonly VisibleMarker[];
  isLoading: boolean;
}>;

export function StockChartPlot({
  chart,
  chartData,
  normalizedOverlays,
  mode,
  showOverlayAxis,
  priceAxisDomainForChart,
  overlayAxisDomainForChart,
  overlayAxisLabel,
  visibleTradeMarkers,
  isLoading,
}: Props) {
  const mutableChartData = [...chartData];

  return (
    <div className="relative h-[340px] w-full min-w-0">
      {chart ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mutableChartData}
            margin={{ top: 8, right: 18, left: 6, bottom: 8 }}
          >
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(value) => formatXAxisTick(String(value), chart.resolvedRange)}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
              tickLine={false}
              minTickGap={26}
            />
            <YAxis
              yAxisId="price"
              domain={priceAxisDomainForChart}
              tickFormatter={(value) =>
                typeof value === "number"
                  ? new Intl.NumberFormat("pl-PL", {
                      maximumFractionDigits: 2,
                    }).format(value)
                  : ""
              }
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
              tickLine={false}
              width={72}
            />
            {showOverlayAxis ? (
              <YAxis
                yAxisId="overlay"
                orientation="right"
                domain={overlayAxisDomainForChart}
                label={
                  overlayAxisLabel
                    ? {
                        value: overlayAxisLabel,
                        angle: -90,
                        position: "insideRight",
                        style: {
                          fill: "var(--muted-foreground)",
                          fontSize: 11,
                        },
                      }
                    : undefined
                }
                tickFormatter={(value) =>
                  typeof value === "number"
                    ? new Intl.NumberFormat("pl-PL", {
                        maximumFractionDigits: 0,
                      }).format(value)
                    : ""
                }
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                tickLine={false}
                width={58}
              />
            ) : null}
            <Tooltip
              cursor={{ stroke: "var(--ring)", strokeOpacity: 0.4 }}
              labelFormatter={(value) => formatLabelDate(String(value))}
              formatter={(value, name, payload) => {
                const chartPayload = payload?.payload as ChartDataPoint | undefined;

                if (name === "price") {
                  return [formatPrice(value as number | null, chart.currency), "Cena"];
                }

                if (name === "peIndex" || name === "peRaw") {
                  if (chartPayload?.peLabel === "N/M") {
                    return ["N/M", "PE"];
                  }
                  if (chartPayload?.peLabel === "-") {
                    return ["-", "PE"];
                  }
                  return [formatPe(chartPayload?.peRaw ?? null), "PE"];
                }

                if (name === "epsTtmIndex" || name === "epsTtmRaw") {
                  return [formatEps(chartPayload?.epsTtmRaw ?? null), "EPS TTM"];
                }

                return [
                  formatRevenue(chartPayload?.revenueTtmRaw ?? null, chart.currency),
                  "Revenue TTM",
                ];
              }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
              }}
            />
            <Line
              yAxisId="price"
              dataKey="price"
              stroke="var(--chart-1)"
              strokeWidth={2.4}
              dot={false}
              connectNulls={false}
              isAnimationActive
              animationDuration={240}
              animationEasing="ease-out"
              name="price"
            />
            {normalizedOverlays.map((overlay) => {
              const lineDataKey = toOverlayLineDataKey(overlay, mode);
              const hasData = chart.hasOverlayData[overlay];
              if (!hasData) return null;

              return (
                <Line
                  key={overlay}
                  yAxisId={mode === "trend" ? "overlay" : "price"}
                  dataKey={lineDataKey}
                  type={overlay === "epsTtm" ? "stepAfter" : "linear"}
                  stroke={OVERLAY_LINE_COLORS[overlay]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive
                  animationDuration={220}
                  animationEasing="ease-out"
                  name={lineDataKey}
                />
              );
            })}
            {visibleTradeMarkers.map((marker) => (
              <ReferenceDot
                key={marker.key}
                x={marker.t}
                y={marker.price}
                yAxisId="price"
                r={4}
                isFront
                fill={marker.side === "BUY" ? "var(--profit)" : "var(--loss)"}
                stroke="var(--background)"
                strokeWidth={1.2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : null}

      {chart === null ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-border/60 bg-card/60">
          <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Odswiezam wykres
          </div>
        </div>
      ) : null}

      {chart !== null && isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/45 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Odswiezam wykres
          </div>
        </div>
      ) : null}
    </div>
  );
}
