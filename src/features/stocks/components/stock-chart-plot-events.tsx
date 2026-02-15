"use client";

import Image from "next/image";

import type { StockChartEventMarker } from "./stock-chart-event-markers";
import {
  formatEps,
  formatLabelDate,
  formatPe,
  formatPrice,
  formatRevenue,
} from "./stock-chart-card-helpers";

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

type TooltipPayloadEntry = Readonly<{
  name?: string | number;
  payload?: StockChartPlotDataPoint | StockChartEventMarkerPoint;
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
  payload?: StockChartEventMarkerPoint;
  isActive?: boolean;
  onHoverChange?: (
    marker: StockChartEventMarkerPoint | null,
    coordinates?: Readonly<{ x: number; y: number }>
  ) => void;
}>;

export type StockChartHoverEventCardProps = Readonly<{
  marker: StockChartEventMarkerPoint;
  x: number;
  y: number;
  currency: string;
}>;

const compactCurrencyFormatterCache = new Map<string, Intl.NumberFormat>();
const signedCompactCurrencyFormatterCache = new Map<string, Intl.NumberFormat>();

const getCompactCurrencyFormatter = (currency: string) => {
  const existing = compactCurrencyFormatterCache.get(currency);
  if (existing) {
    return existing;
  }

  const formatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });
  compactCurrencyFormatterCache.set(currency, formatter);
  return formatter;
};

const getSignedCompactCurrencyFormatter = (currency: string) => {
  const existing = signedCompactCurrencyFormatterCache.get(currency);
  if (existing) {
    return existing;
  }

  const formatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
    signDisplay: "always",
  });
  signedCompactCurrencyFormatterCache.set(currency, formatter);
  return formatter;
};

const formatCompactCurrency = (value: number, currency: string) =>
  getCompactCurrencyFormatter(currency).format(value);

const formatSignedCompactCurrency = (value: number, currency: string) =>
  getSignedCompactCurrencyFormatter(currency).format(value);

const formatSignedPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(value);

const isEventMarkerPoint = (value: unknown): value is StockChartEventMarkerPoint => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<StockChartEventMarkerPoint>;
  return (
    typeof candidate.t === "string" &&
    (candidate.kind === "earnings" ||
      candidate.kind === "news" ||
      candidate.kind === "globalNews" ||
      candidate.kind === "userTrade") &&
    typeof candidate.markerY === "number"
  );
};

const resolveTooltipMetricRow = (
  entry: TooltipPayloadEntry,
  currency: string
): TooltipMetricRow | null => {
  const chartPayload = entry.payload;
  if (!chartPayload || isEventMarkerPoint(chartPayload)) {
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

export function StockChartEventMarkerDot({
  cx,
  cy,
  payload,
  isActive = false,
  onHoverChange,
}: StockChartEventMarkerDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number" || !payload) {
    return null;
  }

  const isUserTrade = payload.kind === "userTrade";
  const isCompanyNews = payload.kind === "news";
  const isGlobalNews = payload.kind === "globalNews";
  const fillColor = isUserTrade
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
  const hoverRingColor = isUserTrade
    ? "var(--foreground)"
    : payload.kind === "earnings"
      ? "var(--ring)"
      : isGlobalNews
        ? "#0b5f55"
        : "var(--muted-foreground)";
  const tradeSizeScale = isUserTrade ? payload.markerSizeScale : 0.6;
  const defaultBaseRadius = isActive ? 12 : 9;
  const defaultHaloRadius = isActive ? 17 : 14;
  const tradeBaseRadius = 8 + tradeSizeScale * 12 + (isActive ? 2.5 : 0);
  const tradeHaloRadius = tradeBaseRadius + 4.2;
  const baseRadius = isUserTrade ? tradeBaseRadius : defaultBaseRadius;
  const haloRadius = isUserTrade ? tradeHaloRadius : defaultHaloRadius;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={22}
        fill="transparent"
        onMouseEnter={() => onHoverChange?.(payload, { x: cx, y: cy })}
        onMouseLeave={() => onHoverChange?.(null)}
      />
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
        style={{ transition: "all 150ms cubic-bezier(0.25, 1, 0.5, 1)" }}
        pointerEvents="none"
      />
      {isUserTrade ? (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--background)"
          fontSize={Math.max(11, baseRadius * 1.18)}
          fontWeight={800}
          pointerEvents="none"
        >
          {payload.side === "BUY" ? "+" : "-"}
        </text>
      ) : null}
    </g>
  );
}

export function StockChartHoverEventCard({
  marker,
  x,
  y,
  currency,
}: StockChartHoverEventCardProps) {
  const safeTop = Math.max(y, 30);
  const cardStyle = {
    left: `clamp(170px, ${x}px, calc(100% - 170px))`,
    top: `${safeTop}px`,
    transform: "translate(-50%, calc(-100% - 12px))",
  };

  if (marker.kind === "earnings") {
    const revenueDelta = marker.actualRevenue - marker.expectedRevenue;
    const epsDelta = marker.actualEps - marker.expectedEps;
    const revenueBeatRatio =
      marker.expectedRevenue > 0 ? revenueDelta / marker.expectedRevenue : 0;
    const epsBeatRatio = marker.expectedEps > 0 ? epsDelta / marker.expectedEps : 0;

    return (
      <div
        className="pointer-events-none absolute z-20 w-[270px] rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm"
        style={cardStyle}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {formatLabelDate(marker.t)}
        </p>
        <p className="mt-1 text-xs font-semibold">Wyniki {marker.quarterLabel}</p>
        <div className="mt-2 space-y-2 text-xs">
          <div className="rounded-sm border border-border/70 px-2 py-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Przychody
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Konsensus</span>
              <span className="font-mono tabular-nums">
                {formatCompactCurrency(marker.expectedRevenue, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Raport</span>
              <span className="font-mono tabular-nums">
                {formatCompactCurrency(marker.actualRevenue, currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-border/70 pt-1">
              <span className="text-muted-foreground">Odchylenie</span>
              <span className="font-mono tabular-nums">
                {formatSignedCompactCurrency(revenueDelta, currency)} (
                {formatSignedPercent(revenueBeatRatio)})
              </span>
            </div>
          </div>

          <div className="rounded-sm border border-border/70 px-2 py-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              EPS
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Konsensus</span>
              <span className="font-mono tabular-nums">
                {formatEps(marker.expectedEps)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Raport</span>
              <span className="font-mono tabular-nums">
                {formatEps(marker.actualEps)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-border/70 pt-1">
              <span className="text-muted-foreground">Odchylenie</span>
              <span className="font-mono tabular-nums">
                {formatEps(epsDelta)} ({formatSignedPercent(epsBeatRatio)})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (marker.kind === "userTrade") {
    const tradeAction = marker.side === "BUY" ? "Kupno" : "Sprzedaz";
    const tradeDescription = `${tradeAction} ${new Intl.NumberFormat("pl-PL").format(marker.quantity)} akcji po cenie ${formatPrice(marker.executionPrice, currency)}.`;

    return (
      <div
        className="pointer-events-none absolute z-20 w-[286px] rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm"
        style={cardStyle}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {formatLabelDate(marker.t)}
        </p>
        <p className="mt-1 text-xs font-semibold">
          {marker.side === "BUY" ? "Mock BUY uzytkownika" : "Mock SELL uzytkownika"}
        </p>
        <div className="mt-2 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Wartosc pozycji</span>
            <span className="font-mono tabular-nums">
              {formatCompactCurrency(marker.positionValue, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Wolumen</span>
            <span className="font-mono tabular-nums">
              {new Intl.NumberFormat("pl-PL").format(marker.quantity)} szt.
            </span>
          </div>
          <p className="border-t border-border/70 pt-1.5 text-xs text-muted-foreground">
            {tradeDescription}
          </p>
          <p className="text-xs text-muted-foreground">
            Data: {formatLabelDate(marker.t)}
          </p>
        </div>
      </div>
    );
  }

  const eventHeaderLabel =
    marker.kind === "globalNews" ? "Wydarzenie globalne" : "Wazne wydarzenie";

  return (
    <div
      className="pointer-events-none absolute z-20 w-[300px] rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm"
      style={cardStyle}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {formatLabelDate(marker.t)}
      </p>
      <p className="mt-1 text-xs font-semibold">{eventHeaderLabel}</p>
      <div className="mt-2 flex items-start gap-2">
        <Image
          src={marker.imageUrl}
          alt={marker.title}
          width={92}
          height={56}
          className="h-14 w-[92px] rounded-[4px] border border-border/70 object-cover"
        />
        <div className="space-y-1">
          <p className="text-xs font-semibold leading-snug">{marker.title}</p>
          <p className="text-xs leading-snug text-muted-foreground">{marker.summary}</p>
        </div>
      </div>
    </div>
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

  const eventEntry = payload.find((entry) => isEventMarkerPoint(entry.payload));
  const eventPayload =
    eventEntry && isEventMarkerPoint(eventEntry.payload) ? eventEntry.payload : null;

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
    <div className="min-w-[170px] rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {formatLabelDate(String(label ?? ""))}
      </p>
      <div className="mt-1.5 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="font-mono text-xs tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
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
  const markerBandPrice = topDomainPrice - domainSpan * 0.015;
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

  return eventMarkers.map((marker) => ({
    ...marker,
    markerY:
      typeof priceByTimestamp.get(marker.t) === "number"
        ? markerBandPrice
        : priceFallback,
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
  }));
};
