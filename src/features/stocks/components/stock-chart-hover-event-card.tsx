"use client";

import Image from "next/image";

import { formatEps, formatLabelDate, formatPrice } from "./stock-chart-card-helpers";
import type { StockChartHoverEventCardProps } from "./stock-chart-plot-events";

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
