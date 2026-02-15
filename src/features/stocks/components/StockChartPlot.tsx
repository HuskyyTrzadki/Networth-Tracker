"use client";

import { useEffect, useState } from "react";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
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
  formatXAxisTick,
  toOverlayLineDataKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import type { StockChartEventMarker } from "./stock-chart-event-markers";
import {
  buildStockChartEventMarkerPoints,
  StockChartHoverEventCard,
  StockChartEventMarkerDot,
  StockChartTooltipPanel,
  type StockChartEventMarkerDotProps,
  type StockChartEventMarkerPoint,
  type StockChartPlotDataPoint,
} from "./stock-chart-plot-events";

type VisibleMarker = Readonly<{
  key: string;
  t: string;
  side: StockTradeMarker["side"];
  portfolioName: string;
  price: number;
}>;

type Props = Readonly<{
  chart: StockChartResponse | null;
  chartData: readonly StockChartPlotDataPoint[];
  normalizedOverlays: readonly StockChartOverlay[];
  mode: StockChartMode;
  priceTrendDirection: "up" | "down" | "flat";
  priceLineColor: string;
  showOverlayAxis: boolean;
  priceAxisDomainForChart: [number, number] | undefined;
  overlayAxisDomainForChart: [number, number] | undefined;
  overlayAxisLabel: string | null;
  visibleTradeMarkers: readonly VisibleMarker[];
  eventMarkers: readonly StockChartEventMarker[];
  isLoading: boolean;
}>;

export function StockChartPlot({
  chart,
  chartData,
  normalizedOverlays,
  mode,
  priceTrendDirection,
  priceLineColor,
  showOverlayAxis,
  priceAxisDomainForChart,
  overlayAxisDomainForChart,
  overlayAxisLabel,
  visibleTradeMarkers,
  eventMarkers,
  isLoading,
}: Props) {
  const mutableChartData = [...chartData];
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hoveredEventMarker, setHoveredEventMarker] =
    useState<StockChartEventMarkerPoint | null>(null);
  const [hoveredEventCoordinates, setHoveredEventCoordinates] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  const animationDisabled = prefersReducedMotion || isLoading;
  const chartAnimationDuration = animationDisabled ? 0 : 180;
  const overlayAnimationDuration = animationDisabled ? 0 : 160;
  const areaAnimationDuration = animationDisabled ? 0 : 160;
  const hasEnabledOverlays = normalizedOverlays.some(
    (overlay) => chart?.hasOverlayData[overlay] === true
  );
  const areaFillColor =
    priceTrendDirection === "up"
      ? hasEnabledOverlays
        ? "rgba(95, 174, 112, 0.36)"
        : "rgba(95, 174, 112, 0.55)"
      : priceTrendDirection === "down"
        ? hasEnabledOverlays
          ? "rgba(208, 116, 109, 0.34)"
          : "rgba(208, 116, 109, 0.5)"
        : hasEnabledOverlays
          ? "rgba(138, 138, 138, 0.24)"
          : "rgba(138, 138, 138, 0.35)";
  const areaBaseValue = priceAxisDomainForChart?.[0] ?? 0;
  const eventMarkerPoints = buildStockChartEventMarkerPoints(
    chartData,
    eventMarkers,
    priceAxisDomainForChart
  );
  const overlayAxisLabelValue = overlayAxisLabel ?? undefined;
  const chartCurrency = chart?.currency ?? "USD";
  const hoveredEventId = hoveredEventMarker?.id ?? null;

  const handleEventMarkerHover = (
    marker: StockChartEventMarkerPoint | null,
    coordinates?: Readonly<{ x: number; y: number }>
  ) => {
    if (!marker || !coordinates) {
      setHoveredEventMarker(null);
      setHoveredEventCoordinates(null);
      return;
    }

    setHoveredEventMarker(marker);
    setHoveredEventCoordinates({ x: coordinates.x, y: coordinates.y });
  };

  return (
    <div className="relative h-[340px] w-full min-w-0">
      {chart ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={mutableChartData}
            margin={{ top: 28, right: 18, left: 6, bottom: 8 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 6"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="t"
              tickFormatter={(value) =>
                formatXAxisTick(String(value), chart.resolvedRange)
              }
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
                  overlayAxisLabelValue
                    ? {
                        value: overlayAxisLabelValue,
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
              content={<StockChartTooltipPanel currency={chartCurrency} />}
            />
            <Area
              yAxisId="price"
              dataKey="price"
              type="linear"
              stroke="none"
              baseValue={areaBaseValue}
              fill={areaFillColor}
              fillOpacity={1}
              isAnimationActive={!animationDisabled}
              animationDuration={areaAnimationDuration}
              animationEasing="ease-out"
            />
            <Line
              yAxisId="price"
              dataKey="price"
              type="linear"
              stroke={priceLineColor}
              strokeOpacity={hasEnabledOverlays ? 0.72 : 1}
              strokeWidth={2.4}
              dot={false}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={!animationDisabled}
              animationDuration={chartAnimationDuration}
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
                  strokeWidth={2.8}
                  strokeOpacity={0.97}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={!animationDisabled}
                  animationDuration={overlayAnimationDuration}
                  animationEasing="ease-out"
                  name={lineDataKey}
                />
              );
            })}
            {eventMarkerPoints.map((marker) => (
              <ReferenceLine
                key={`event-line-${marker.id}`}
                x={marker.t}
                yAxisId="price"
                stroke={
                  marker.kind === "earnings"
                    ? "#2563eb"
                    : marker.kind === "userTrade"
                      ? marker.side === "BUY"
                        ? "var(--profit)"
                        : "var(--loss)"
                      : marker.kind === "globalNews"
                        ? "#0f766e"
                        : "#d97706"
                }
                strokeOpacity={hoveredEventId === marker.id ? 0.62 : 0.25}
                strokeWidth={hoveredEventId === marker.id ? 1.4 : 1}
                strokeDasharray={marker.kind === "userTrade" ? "2 4" : "3 5"}
                ifOverflow="discard"
              />
            ))}
            {eventMarkerPoints.map((marker) => (
              <ReferenceDot
                key={`event-dot-${marker.id}`}
                x={marker.t}
                y={marker.markerY}
                yAxisId="price"
                ifOverflow="discard"
                isFront
                shape={(props: unknown) => (
                  <StockChartEventMarkerDot
                    {...(props as StockChartEventMarkerDotProps)}
                    payload={marker}
                    isActive={hoveredEventId === marker.id}
                    onHoverChange={handleEventMarkerHover}
                  />
                )}
              />
            ))}
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
          </ComposedChart>
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

      {hoveredEventMarker && hoveredEventCoordinates ? (
        <StockChartHoverEventCard
          marker={hoveredEventMarker}
          x={hoveredEventCoordinates.x}
          y={hoveredEventCoordinates.y}
          currency={chartCurrency}
        />
      ) : null}
    </div>
  );
}
