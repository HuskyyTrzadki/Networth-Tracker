"use client";

import type { ReactNode } from "react";

import { ReferenceDot, ReferenceLine } from "@/lib/recharts-dynamic";

import type { NarrativeLabelLayout } from "./stock-chart-narrative-label-layout";
import type { StockChartEventMarkerPoint, StockChartHoverMarker } from "./stock-chart-plot-events";
import {
  StockChartMarkerDot,
  type StockChartEventMarkerDotProps,
} from "./stock-chart-plot-events";
import type { PositionedTradeMarker } from "./stock-chart-trade-marker-layout";

const isNarrativeEventMarker = (
  marker: StockChartEventMarkerPoint
): marker is Extract<StockChartEventMarkerPoint, Readonly<{ kind: "news" | "globalNews" }>> =>
  (marker.kind === "news" || marker.kind === "globalNews") &&
  typeof marker.annotationLabel === "string" &&
  marker.annotationLabel.length > 0;

export function renderStockChartPlotMarkerLayers({
  eventMarkerPoints,
  positionedTradeMarkers,
  hoveredMarkerId,
  showNarrativeLabels,
  narrativeLabelLayout,
  onMarkerHover,
}: Readonly<{
  eventMarkerPoints: readonly StockChartEventMarkerPoint[];
  positionedTradeMarkers: readonly PositionedTradeMarker[];
  hoveredMarkerId: string | null;
  showNarrativeLabels: boolean;
  narrativeLabelLayout: ReadonlyMap<string, NarrativeLabelLayout>;
  onMarkerHover: (
    marker: StockChartHoverMarker | null,
    coordinates?: Readonly<{ x: number; y: number }>
  ) => void;
}>): ReactNode[] {
  return [
    ...eventMarkerPoints.map((marker) => (
      <ReferenceLine
        key={`event-line-${marker.id}`}
        x={marker.t}
        yAxisId="price"
        stroke={
          marker.kind === "earnings"
            ? "var(--chart-2)"
            : marker.kind === "userTrade"
              ? marker.side === "BUY"
                ? "var(--profit)"
                : "var(--loss)"
              : marker.kind === "globalNews"
                ? "var(--chart-4)"
                : "var(--chart-3)"
        }
        strokeOpacity={hoveredMarkerId === marker.id ? 0.62 : 0.25}
        strokeWidth={hoveredMarkerId === marker.id ? 1.4 : 1}
        strokeDasharray={marker.kind === "userTrade" ? "2 4" : "3 5"}
        ifOverflow="discard"
      />
    )),
    ...eventMarkerPoints.map((marker, markerIndex) => (
      <ReferenceDot
        key={`event-dot-${marker.id}`}
        x={marker.t}
        y={marker.markerY}
        yAxisId="price"
        ifOverflow="discard"
        isFront
        label={
          showNarrativeLabels &&
          isNarrativeEventMarker(marker) &&
          narrativeLabelLayout.get(marker.id)?.show
            ? {
                ...(narrativeLabelLayout.get(marker.id) ?? {
                  show: true,
                  dx: markerIndex % 2 === 0 ? 18 : -18,
                  dy: marker.kind === "globalNews" ? -28 : -24,
                  textAnchor: markerIndex % 2 === 0 ? "start" : "end",
                  text: marker.annotationLabel,
                }),
                value:
                  narrativeLabelLayout.get(marker.id)?.text ?? marker.annotationLabel,
                position: "top",
                fill: "var(--muted-foreground)",
                fontSize: 9,
              }
            : undefined
        }
        shape={(props: unknown) => (
          <StockChartMarkerDot
            {...(props as StockChartEventMarkerDotProps)}
            payload={marker}
            isActive={hoveredMarkerId === marker.id}
            onHoverChange={onMarkerHover}
          />
        )}
      />
    )),
    ...positionedTradeMarkers.map((marker) => (
      <ReferenceLine
        key={`trade-line-${marker.id}`}
        x={marker.t}
        yAxisId="price"
        stroke={marker.side === "BUY" ? "var(--profit)" : "var(--loss)"}
        strokeOpacity={hoveredMarkerId === marker.id ? 0.42 : 0.18}
        strokeWidth={hoveredMarkerId === marker.id ? 1.3 : 1}
        strokeDasharray="2 4"
        ifOverflow="extendDomain"
      />
    )),
    ...positionedTradeMarkers.map((marker) => (
      <ReferenceDot
        key={`trade-dot-${marker.id}`}
        x={marker.t}
        y={marker.markerY}
        yAxisId="price"
        ifOverflow="extendDomain"
        isFront
        shape={(props: unknown) => (
          <StockChartMarkerDot
            {...(props as StockChartEventMarkerDotProps)}
            payload={marker}
            isActive={hoveredMarkerId === marker.id}
            onHoverChange={onMarkerHover}
          />
        )}
      />
    )),
  ];
}
