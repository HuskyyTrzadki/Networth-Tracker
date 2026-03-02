"use client";

import { useEffect, useRef, useState } from "react";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
import { LoaderCircle } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/features/design-system/components/ui/chart";

import type {
  StockChartOverlay,
  StockChartResponse,
} from "../server/types";
import {
  OVERLAY_LINE_COLORS,
  formatXAxisTick,
  toOverlayLineDataKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import type { StockChartEventMarker } from "./stock-chart-event-markers";
import type { VisibleTradeMarker } from "./stock-chart-card-view-model";
import { renderStockChartPlotMarkerLayers } from "./StockChartPlotMarkerLayers";
import { buildNarrativeLabelLayout } from "./stock-chart-narrative-label-layout";
import { buildPositionedTradeMarkers } from "./stock-chart-trade-marker-layout";
import {
  buildStockChartEventMarkerPoints,
  StockChartHoverEventCard,
  StockChartTooltipPanel,
  type StockChartHoverMarker,
  type StockChartPlotDataPoint,
} from "./stock-chart-plot-events";

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
  visibleTradeMarkers: readonly VisibleTradeMarker[];
  eventMarkers: readonly StockChartEventMarker[];
  showNarrativeLabels: boolean;
  isLoading: boolean;
}>;

export type StockChartPlotProps = Props;

function StockChartPlotStateOverlays({
  chart,
  isLoading,
  hoveredMarker,
  hoveredMarkerCoordinates,
  chartCurrency,
}: Readonly<{
  chart: StockChartResponse | null;
  isLoading: boolean;
  hoveredMarker: StockChartHoverMarker | null;
  hoveredMarkerCoordinates: Readonly<{ x: number; y: number }> | null;
  chartCurrency: string;
}>) {
  return (
    <>
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

      {hoveredMarker && hoveredMarkerCoordinates ? (
        <StockChartHoverEventCard
          marker={hoveredMarker}
          x={hoveredMarkerCoordinates.x}
          y={hoveredMarkerCoordinates.y}
          currency={chartCurrency}
        />
      ) : null}
    </>
  );
}

export default function StockChartPlotImpl({
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
  showNarrativeLabels,
  isLoading,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState<StockChartHoverMarker | null>(null);
  const [hoveredMarkerCoordinates, setHoveredMarkerCoordinates] = useState<{
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

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setChartWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
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
        ? "rgba(95, 174, 112, 0.28)"
        : "rgba(95, 174, 112, 0.42)"
      : priceTrendDirection === "down"
        ? hasEnabledOverlays
          ? "rgba(208, 116, 109, 0.26)"
          : "rgba(208, 116, 109, 0.38)"
        : hasEnabledOverlays
          ? "rgba(138, 138, 138, 0.18)"
          : "rgba(138, 138, 138, 0.28)";
  const areaBaseValue = priceAxisDomainForChart?.[0] ?? 0;
  const eventMarkerPoints = buildStockChartEventMarkerPoints(
    chartData,
    eventMarkers,
    priceAxisDomainForChart
  );
  const truncateNarrativeLabel = (label: string) =>
    label.length > 26 ? `${label.slice(0, 26)}...` : label;
  const narrativeLabelLayout = buildNarrativeLabelLayout(
    eventMarkerPoints,
    truncateNarrativeLabel
  );
  const overlayAxisLabelValue = overlayAxisLabel ?? undefined;
  const chartCurrency = chart?.currency ?? "USD";
  const hoveredMarkerId = hoveredMarker?.id ?? null;
  const positionedTradeMarkers = buildPositionedTradeMarkers({
    markers: visibleTradeMarkers,
    chartData,
    priceAxisDomain: priceAxisDomainForChart,
    plotWidth: Math.max(chartWidth - 96, 0),
  });
  const mutableChartData = [...chartData];
  const chartConfig = normalizedOverlays.reduce<ChartConfig>(
    (acc, overlay) => {
      acc[overlay] = {
        label: overlay,
        color: OVERLAY_LINE_COLORS[overlay],
      };
      return acc;
    },
    {
      price: {
        label: "Cena",
        color: priceLineColor,
      },
    }
  );

  const handleMarkerHover = (
    marker: StockChartHoverMarker | null,
    coordinates?: Readonly<{ x: number; y: number }>
  ) => {
    if (!marker || !coordinates) {
      setHoveredMarker(null);
      setHoveredMarkerCoordinates(null);
      return;
    }

    setHoveredMarker(marker);
    setHoveredMarkerCoordinates({ x: coordinates.x, y: coordinates.y });
  };

  return (
    <div ref={containerRef} className="relative h-[420px] w-full min-w-0">
      {chart ? (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={mutableChartData}
              margin={{ top: 56, right: 18, left: 6, bottom: 8 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="4 6"
                strokeOpacity={0.38}
                vertical={false}
              />
              <XAxis
                dataKey="t"
                tickFormatter={(value: string | number) =>
                  formatXAxisTick(String(value), chart.resolvedRange)
                }
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                tickLine={false}
                minTickGap={26}
              />
              <YAxis
                yAxisId="price"
                domain={priceAxisDomainForChart}
                tickFormatter={(value: string | number) =>
                  typeof value === "number"
                    ? new Intl.NumberFormat("pl-PL", {
                        maximumFractionDigits: 2,
                      }).format(value)
                    : ""
                }
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
                            fontSize: 10,
                          },
                        }
                      : undefined
                  }
                  tickFormatter={(value: string | number) =>
                    typeof value === "number"
                      ? new Intl.NumberFormat("pl-PL", {
                          maximumFractionDigits: 0,
                        }).format(value)
                      : ""
                  }
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                  tickLine={false}
                  width={58}
                />
              ) : null}
              <ChartTooltip
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
                style={{
                  filter: "drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.22))",
                }}
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
              {renderStockChartPlotMarkerLayers({
                eventMarkerPoints,
                positionedTradeMarkers,
                hoveredMarkerId,
                showNarrativeLabels,
                narrativeLabelLayout,
                onMarkerHover: handleMarkerHover,
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : null}

      <StockChartPlotStateOverlays
        chart={chart}
        isLoading={isLoading}
        hoveredMarker={hoveredMarker}
        hoveredMarkerCoordinates={hoveredMarkerCoordinates}
        chartCurrency={chartCurrency}
      />
    </div>
  );
}
