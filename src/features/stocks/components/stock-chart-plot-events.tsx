"use client";

import { TrendTooltipRow, TrendTooltipShell } from "@/features/design-system/components/chart-tooltip";

import type { StockChartEventMarker } from "./stock-chart-event-markers";
import {
  formatEps,
  formatLabelDate,
  formatPe,
  formatPrice,
  formatRevenue,
} from "./stock-chart-card-helpers";
import type { PositionedTradeMarker } from "./stock-chart-trade-marker-layout";

export type StockChartPlotDataPoint = Readonly<{
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

export type StockChartEventMarkerPoint = StockChartEventMarker &
  Readonly<{
    markerY: number;
    markerSizeScale: number;
  }>;

export type StockChartHoverMarker = StockChartEventMarkerPoint | PositionedTradeMarker;

type TooltipPayloadEntry = Readonly<{
  name?: string | number;
  payload?: StockChartPlotDataPoint | StockChartHoverMarker;
}>;

type TooltipMetricRow = Readonly<{
  label: string;
  value: string;
}>;

export type StockChartTooltipPanelProps = Readonly<{
  active?: boolean;
  payload?: readonly TooltipPayloadEntry[];
  label?: string | number;
  currency: string;
}>;

export type StockChartEventMarkerDotProps = Readonly<{
  cx?: number;
  cy?: number;
  payload?: StockChartHoverMarker;
  isActive?: boolean;
  onHoverChange?: (
    marker: StockChartHoverMarker | null,
    coordinates?: Readonly<{ x: number; y: number }>
  ) => void;
}>;

export type StockChartHoverEventCardProps = Readonly<{
  marker: StockChartHoverMarker;
  x: number;
  y: number;
  currency: string;
}>;
export { StockChartHoverEventCard } from "./stock-chart-hover-event-card";

const isHoverMarker = (value: unknown): value is StockChartHoverMarker => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<StockChartHoverMarker>;
  return (
    typeof candidate.t === "string" &&
    (candidate.kind === "earnings" ||
      candidate.kind === "news" ||
      candidate.kind === "globalNews" ||
      candidate.kind === "userTrade" ||
      candidate.kind === "tradeMarker")
  );
};

const isTradeLikeMarker = (
  marker: StockChartHoverMarker
): marker is Extract<StockChartHoverMarker, Readonly<{ side: "BUY" | "SELL" }>> =>
  marker.kind === "userTrade" || marker.kind === "tradeMarker";

const resolveTooltipMetricRow = (
  entry: TooltipPayloadEntry,
  currency: string
): TooltipMetricRow | null => {
  const chartPayload = entry.payload;
  if (!chartPayload || isHoverMarker(chartPayload)) {
    return null;
  }

  const name = String(entry.name ?? "");

  if (name === "price") {
    return {
      label: "Cena",
      value: formatPrice(chartPayload.price, currency),
    };
  }

  if (name === "peIndex" || name === "peRaw") {
    if (chartPayload.peLabel === "N/M") {
      return { label: "PE", value: "N/M" };
    }
    if (chartPayload.peLabel === "-") {
      return { label: "PE", value: "-" };
    }
    return { label: "PE", value: formatPe(chartPayload.peRaw) };
  }

  if (name === "epsTtmIndex" || name === "epsTtmRaw") {
    return { label: "EPS TTM", value: formatEps(chartPayload.epsTtmRaw) };
  }

  if (name === "revenueTtmIndex" || name === "revenueTtmRaw") {
    return {
      label: "Przychody TTM",
      value: formatRevenue(chartPayload.revenueTtmRaw, currency),
    };
  }

  return null;
};

export function StockChartMarkerDot({
  cx,
  cy,
  payload,
  isActive = false,
  onHoverChange,
}: StockChartEventMarkerDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number" || !payload) {
    return null;
  }

  const isRealTradeMarker = payload.kind === "tradeMarker";
  const isCompanyNews = payload.kind === "news";
  const isGlobalNews = payload.kind === "globalNews";
  const fillColor = isTradeLikeMarker(payload)
    ? payload.side === "BUY"
      ? "var(--profit)"
      : "var(--loss)"
    : payload.kind === "earnings"
      ? "#2563eb"
      : isCompanyNews
        ? "#d97706"
        : isGlobalNews
          ? "#0f766e"
          : "var(--muted-foreground)";
  const hoverRingColor = isTradeLikeMarker(payload)
    ? "var(--foreground)"
    : payload.kind === "earnings"
      ? "var(--ring)"
      : isGlobalNews
        ? "#0b5f55"
        : "var(--muted-foreground)";
  const tradeSizeScale = isTradeLikeMarker(payload) ? payload.markerSizeScale : 0.6;
  const defaultBaseRadius = isActive ? 12 : 9;
  const defaultHaloRadius = isActive ? 17 : 14;
  const tradeBaseRadius =
    5.6 + tradeSizeScale * 4.2 + (isActive ? (isRealTradeMarker ? 1.2 : 1.4) : 0);
  const tradeHaloRadius = tradeBaseRadius + (isRealTradeMarker ? 3.2 : 3.4);
  const baseRadius = isTradeLikeMarker(payload) ? tradeBaseRadius : defaultBaseRadius;
  const haloRadius = isTradeLikeMarker(payload) ? tradeHaloRadius : defaultHaloRadius;
  const hitAreaRadius = isRealTradeMarker ? 18 : 22;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={hitAreaRadius}
        fill="transparent"
        onMouseEnter={() => onHoverChange?.(payload, { x: cx, y: cy })}
        onMouseLeave={() => onHoverChange?.(null)}
      />
      {isRealTradeMarker ? (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={haloRadius}
            fill={fillColor}
            fillOpacity={isActive ? 0.16 : 0.1}
            stroke="none"
            pointerEvents="none"
          />
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(4.6, baseRadius)}
            fill={fillColor}
            stroke={isActive ? hoverRingColor : "var(--background)"}
            strokeWidth={isActive ? 2.8 : 2.2}
            style={{
              filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.18))",
              transition:
                "fill-opacity 150ms cubic-bezier(0.25, 1, 0.5, 1), stroke 150ms cubic-bezier(0.25, 1, 0.5, 1), stroke-width 150ms cubic-bezier(0.25, 1, 0.5, 1)",
            }}
            pointerEvents="none"
          />
        </>
      ) : (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={haloRadius}
            fill={fillColor}
            fillOpacity={isActive ? 0.28 : 0.18}
            stroke="none"
            pointerEvents="none"
          />
          <circle
            cx={cx}
            cy={cy}
            r={baseRadius}
            fill={fillColor}
            stroke={isActive ? hoverRingColor : "var(--background)"}
            strokeWidth={isActive ? 2.8 : 2.1}
            style={{
              transition:
                "fill-opacity 150ms cubic-bezier(0.25, 1, 0.5, 1), stroke 150ms cubic-bezier(0.25, 1, 0.5, 1), stroke-width 150ms cubic-bezier(0.25, 1, 0.5, 1)",
            }}
            pointerEvents="none"
          />
        </>
      )}
      {isTradeLikeMarker(payload) ? (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isRealTradeMarker ? "var(--background)" : "var(--background)"}
          fontSize={Math.max(
            isRealTradeMarker ? 9 : 11,
            baseRadius * (isRealTradeMarker ? 1.05 : 1.18)
          )}
          fontWeight={800}
          pointerEvents="none"
        >
          {payload.side === "BUY" ? "+" : "-"}
        </text>
      ) : null}
    </g>
  );
}

export function StockChartTooltipPanel({
  active,
  payload,
  label,
  currency,
}: StockChartTooltipPanelProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const eventEntry = payload.find((entry) => isHoverMarker(entry.payload));
  const eventPayload =
    eventEntry && isHoverMarker(eventEntry.payload) ? eventEntry.payload : null;

  if (eventPayload) {
    return null;
  }

  const seenLabels = new Set<string>();
  const rows: TooltipMetricRow[] = [];

  payload.forEach((entry) => {
    const row = resolveTooltipMetricRow(entry, currency);
    if (!row || seenLabels.has(row.label)) {
      return;
    }
    seenLabels.add(row.label);
    rows.push(row);
  });

  if (rows.length === 0) {
    return null;
  }

  return (
    <TrendTooltipShell label={formatLabelDate(String(label ?? ""))}>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <TrendTooltipRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </TrendTooltipShell>
  );
}

export const buildStockChartEventMarkerPoints = (
  chartData: readonly StockChartPlotDataPoint[],
  eventMarkers: readonly StockChartEventMarker[],
  priceAxisDomain: [number, number] | undefined
): readonly StockChartEventMarkerPoint[] => {
  const topDomainPrice = priceAxisDomain?.[1] ?? 0;
  const bottomDomainPrice = priceAxisDomain?.[0] ?? 0;
  const domainSpan = Math.max(topDomainPrice - bottomDomainPrice, 1);
  const markerBandPrice = topDomainPrice - domainSpan * 0.018;
  const priceFallback = markerBandPrice;
  const priceByTimestamp = new Map(
    chartData
      .filter((point) => typeof point.price === "number")
      .map((point) => [point.t, point.price as number])
  );

  const userTradeValues = eventMarkers
    .filter((marker): marker is Extract<StockChartEventMarker, { kind: "userTrade" }> =>
      marker.kind === "userTrade"
    )
    .map((marker) => marker.positionValue)
    .filter((value) => Number.isFinite(value));
  const minUserTradeValue =
    userTradeValues.length > 0 ? Math.min(...userTradeValues) : null;
  const maxUserTradeValue =
    userTradeValues.length > 0 ? Math.max(...userTradeValues) : null;

  let newsLane = 0;
  let globalNewsLane = 0;

  return eventMarkers.map((marker) => {
    const baseOffset =
      marker.kind === "earnings"
        ? 0.026
        : marker.kind === "userTrade"
          ? 0.038
          : marker.kind === "globalNews"
            ? 0.098
            : 0.058;
    const laneOffset =
      marker.kind === "news"
        ? (newsLane++ % 3) * 0.022
        : marker.kind === "globalNews"
          ? (globalNewsLane++ % 3) * 0.028
          : 0;
    const markerY = Math.max(
      bottomDomainPrice + domainSpan * 0.08,
      topDomainPrice - domainSpan * (baseOffset + laneOffset)
    );

    return {
      ...marker,
      markerY:
        typeof priceByTimestamp.get(marker.t) === "number"
          ? markerY
          : Math.max(
              bottomDomainPrice + domainSpan * 0.08,
              priceFallback - domainSpan * (baseOffset + laneOffset)
            ),
      markerSizeScale:
        marker.kind === "userTrade" &&
        minUserTradeValue !== null &&
        maxUserTradeValue !== null &&
        maxUserTradeValue > minUserTradeValue
          ? (marker.positionValue - minUserTradeValue) /
            (maxUserTradeValue - minUserTradeValue)
          : marker.kind === "userTrade"
            ? 0.55
            : 0.6,
    };
  });
};
