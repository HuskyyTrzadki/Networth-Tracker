"use client";

import { cn } from "@/lib/cn";

export type StockScreenerPreviewPoint = Readonly<{
  date: string;
  price: number;
}>;

type ChartPoint = Readonly<{
  x: number;
  y: number;
}>;

const CHART_WIDTH = 240;
const CHART_HEIGHT = 86;

const formatDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const buildPriceLabelFormatter = (currency: string) => {
  if (!currency || currency === "-") {
    return (value: number) =>
      new Intl.NumberFormat("pl-PL", {
        maximumFractionDigits: value >= 100 ? 0 : 2,
      }).format(value);
  }

  const formatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (value: number) => formatter.format(value);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const buildLinePath = (points: readonly ChartPoint[]) =>
  points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

const buildAreaPath = (points: readonly ChartPoint[]) => {
  const first = points[0];
  const last = points.at(-1);

  if (!first || !last) {
    return "";
  }

  return `${buildLinePath(points)} L ${last.x.toFixed(2)} ${CHART_HEIGHT} L ${first.x.toFixed(2)} ${CHART_HEIGHT} Z`;
};

export function StockScreenerPreviewChart({
  data,
  currency,
  className,
}: Readonly<{
  data: readonly StockScreenerPreviewPoint[];
  currency: string;
  className?: string;
}>) {
  const safeData =
    data.length >= 2
      ? data
      : [
          { date: "1970-01-01", price: 0 },
          { date: "1970-01-02", price: 0 },
        ];

  const minPrice = Math.min(...safeData.map((point) => point.price));
  const maxPrice = Math.max(...safeData.map((point) => point.price));
  const spread = maxPrice - minPrice;
  const pad =
    spread === 0 ? Math.max(Math.abs(minPrice) * 0.02, 1) : spread * 0.08;
  const lowerBound = minPrice - pad;
  const upperBound = maxPrice + pad;
  const yRange = Math.max(upperBound - lowerBound, 1);
  const points = safeData.map((point, index) => {
    const x =
      safeData.length === 1
        ? CHART_WIDTH / 2
        : (index / (safeData.length - 1)) * CHART_WIDTH;
    const normalizedY = (point.price - lowerBound) / yRange;

    return {
      x,
      y: clamp(CHART_HEIGHT - normalizedY * CHART_HEIGHT, 4, CHART_HEIGHT - 4),
    } satisfies ChartPoint;
  });
  const linePath = buildLinePath(points);
  const areaPath = buildAreaPath(points);
  const firstPoint = safeData[0];
  const lastPoint = safeData.at(-1) ?? firstPoint;
  const trendTone =
    lastPoint.price > firstPoint.price
      ? "var(--profit)"
      : lastPoint.price < firstPoint.price
        ? "var(--loss)"
        : "var(--chart-1)";
  const formatPriceLabel = buildPriceLabelFormatter(currency);

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      <div className="flex items-center justify-between px-1.5 pb-1 font-mono text-[10px] tabular-nums text-muted-foreground/75">
        <span className="max-w-[46%] truncate">
          {formatPriceLabel(maxPrice)}
        </span>
        <span className="max-w-[46%] truncate text-right">
          {formatPriceLabel(minPrice)}
        </span>
      </div>

      <svg
        aria-hidden="true"
        className="block h-[86px] w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 1}`}
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1={CHART_HEIGHT / 2}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT / 2}
          stroke="var(--border)"
          strokeDasharray="3 4"
          strokeOpacity="0.28"
        />
        <line
          x1="0"
          y1={CHART_HEIGHT}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT}
          stroke="var(--border)"
          strokeOpacity="0.32"
        />
        <path d={areaPath} fill={trendTone} fillOpacity="0.14" />
        <path
          d={linePath}
          fill="none"
          stroke={trendTone}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
      </svg>

      <div className="mt-1 flex items-center justify-between px-1.5 text-[10px] text-muted-foreground/70">
        <span>{formatDateLabel(firstPoint.date)}</span>
        <span>{formatDateLabel(lastPoint.date)}</span>
      </div>
    </div>
  );
}
