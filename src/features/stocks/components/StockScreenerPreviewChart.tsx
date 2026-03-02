"use client";

import { useId, useState } from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/features/design-system/components/ui/chart";

import { cn } from "@/lib/cn";

import type { StockTradeMarker } from "../server/types";
import { formatLabelDate, formatPrice } from "./stock-chart-card-helpers";
import { resolveVisibleTradeMarkers } from "./stock-chart-card-view-model";
import { StockChartMarkerDot, type StockChartEventMarkerDotProps } from "./stock-chart-plot-events";
import { buildPositionedTradeMarkers } from "./stock-chart-trade-marker-layout";

export type StockScreenerPreviewPoint = Readonly<{
  date: string;
  price: number;
}>;

type HoveredMarkerState = Readonly<{
  id: string;
  tradeDate: string;
  tradeDateEnd: string | null;
  side: "BUY" | "SELL";
  netQuantity: number;
  weightedPrice: number;
  grossNotional: number;
  tradeCount: number;
  clusteredMarkerCount: number;
  x: number;
  y: number;
}>;

const formatXAxisTick = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const buildPriceFormatter = (currency: string) => {
  if (!currency || currency === "-") {
    return (value: number) => `${value.toFixed(0)}`;
  }

  const formatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  return (value: number) => formatter.format(value);
};

const quantityFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

function ScreenerTradeHoverCard({
  marker,
  currency,
}: Readonly<{
  marker: HoveredMarkerState;
  currency: string;
}>) {
  const tradeAction = marker.side === "BUY" ? "Zakup netto" : "Sprzedaz netto";
  const tradeDateLabel = marker.tradeDateEnd
    ? `${formatLabelDate(marker.tradeDate)} - ${formatLabelDate(marker.tradeDateEnd)}`
    : formatLabelDate(marker.tradeDate);
  const compactSummary =
    marker.clusteredMarkerCount > 1
      ? `${marker.clusteredMarkerCount} znaczniki • ${marker.tradeCount} transakcji`
      : `${marker.tradeCount} transakcji`;

  return (
    <div
      className="pointer-events-none absolute z-20 w-[220px] rounded-sm border border-border/80 bg-popover/98 px-2.5 py-2 text-[11px] text-popover-foreground shadow-[var(--surface-shadow)]"
      style={{
        left: `clamp(112px, ${marker.x}px, calc(100% - 112px))`,
        top: `${Math.max(marker.y, 24)}px`,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {tradeDateLabel}
      </p>
      <p className="mt-1 font-semibold">{tradeAction}</p>
      <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <span className="text-muted-foreground">Netto</span>
        <span className="text-right font-mono tabular-nums">
          {marker.side === "BUY" ? "+" : "-"}
          {quantityFormatter.format(marker.netQuantity)} szt.
        </span>
        <span className="text-muted-foreground">Srednia</span>
        <span className="text-right font-mono tabular-nums">
          {formatPrice(marker.weightedPrice, currency)}
        </span>
        <span className="text-muted-foreground">Wartosc</span>
        <span className="text-right font-mono tabular-nums">
          {formatPrice(marker.grossNotional, currency)}
        </span>
      </div>
      <p className="mt-2 border-t border-border/70 pt-1.5 text-[10px] text-muted-foreground">
        {compactSummary}
      </p>
    </div>
  );
}

export function StockScreenerPreviewChart({
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
  const gradientId = useId().replace(/:/g, "");
  const [hoveredMarker, setHoveredMarker] = useState<HoveredMarkerState | null>(null);
  const safeData =
    data.length >= 2
      ? data
      : [
          { date: "1970-01-01", price: 0 },
          { date: "1970-01-02", price: 0 },
        ];
  const minPrice = Math.min(...safeData.map((point) => point.price));
  const maxPrice = Math.max(...safeData.map((point) => point.price));
  const pad =
    minPrice === maxPrice
      ? Math.max(Math.abs(minPrice) * 0.02, 1)
      : (maxPrice - minPrice) * 0.08;
  const domain: [number, number] = [minPrice - pad, maxPrice + pad];
  const formatPriceTick = buildPriceFormatter(currency);
  const chartData = [...safeData];
  const chartConfig = {
    price: {
      label: "Cena",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;
  const visibleTradeMarkers = resolveVisibleTradeMarkers(
    tradeMarkers,
    chartData.map((point) => ({ t: point.date }))
  );
  const positionedTradeMarkers = buildPositionedTradeMarkers({
    markers: visibleTradeMarkers,
    chartData: chartData.map((point) => ({ t: point.date })),
    priceAxisDomain: domain,
    plotWidth: 220,
  });

  return (
    <ChartContainer config={chartConfig} className={cn("relative h-full w-full", className)}>
      {hoveredMarker ? (
        <ScreenerTradeHoverCard marker={hoveredMarker} currency={currency} />
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 18, right: 8, bottom: 6, left: 8 }}>
          <defs>
            <linearGradient id={`screener-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-price)" stopOpacity={0.18} />
              <stop offset="70%" stopColor="var(--color-price)" stopOpacity={0.06} />
              <stop offset="100%" stopColor="var(--color-price)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity={0.12}
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisTick}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
            minTickGap={18}
          />

          <YAxis
            domain={domain}
            width={56}
            tickFormatter={formatPriceTick}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
          />

          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeDasharray: "3 4", strokeOpacity: 0.45 }}
            content={
              <ChartTooltipContent
                className={cn(
                  hoveredMarker ? "opacity-0" : "opacity-100",
                  "transition-opacity duration-100"
                )}
                indicator="dot"
                labelFormatter={(label) => formatLabelDate(String(label))}
                formatter={(value) => [formatPrice(Number(value), currency), "Cena"]}
              />
            }
          />

          {positionedTradeMarkers.map((marker) => (
            <ReferenceLine
              key={`mini-trade-line-${marker.id}`}
              x={marker.t}
              stroke={marker.side === "BUY" ? "var(--profit)" : "var(--loss)"}
              strokeOpacity={0.18}
              strokeWidth={1}
              strokeDasharray="2 4"
              ifOverflow="extendDomain"
            />
          ))}

          {positionedTradeMarkers.map((marker) => (
            <ReferenceDot
              key={`mini-trade-dot-${marker.id}`}
              x={marker.t}
              y={marker.markerY}
              ifOverflow="extendDomain"
              isFront
              shape={(props: unknown) => (
                <StockChartMarkerDot
                  {...(props as StockChartEventMarkerDotProps)}
                  payload={marker}
                  isActive={hoveredMarker?.id === marker.id}
                  onHoverChange={(nextMarker, coordinates) => {
                    if (
                      nextMarker?.kind === "tradeMarker" &&
                      coordinates
                    ) {
                      setHoveredMarker({
                        id: nextMarker.id,
                        tradeDate: nextMarker.tradeDate,
                        tradeDateEnd: nextMarker.tradeDateEnd,
                        side: nextMarker.side,
                        netQuantity: nextMarker.netQuantity,
                        weightedPrice: nextMarker.weightedPrice,
                        grossNotional: nextMarker.grossNotional,
                        tradeCount: nextMarker.tradeCount,
                        clusteredMarkerCount: nextMarker.clusteredMarkerCount,
                        x: coordinates.x,
                        y: coordinates.y,
                      });
                      return;
                    }

                    setHoveredMarker(null);
                  }}
                />
              )}
            />
          ))}

          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--color-price)"
            strokeWidth={2.5}
            fill={`url(#screener-fill-${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
