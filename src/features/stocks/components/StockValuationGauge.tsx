"use client";

import type {
  StockValuationMetric,
  StockValuationRangeContext,
} from "@/features/stocks/types";
import { cn } from "@/lib/cn";

type GaugeTone = Readonly<{
  currentTextClassName: string;
  markerClassName: string;
  fillClassName: string;
  badgeClassName: string;
}>;

type MetricGaugePreset = Readonly<{
  shortLabel: "P/E" | "P/S" | "P/B";
  scaleLabel: string;
  surfaceClassName: string;
  markerLabelClassName: string;
  markerLabelDotClassName: string;
}>;

const ratioFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const formatRatio = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? ratioFormatter.format(value)
    : "—";

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getGaugeTone = (
  interpretation: StockValuationRangeContext["interpretation"]
): GaugeTone => {
  if (interpretation === "HISTORY_LOW") {
    return {
      currentTextClassName: "text-[#356347]",
      markerClassName: "bg-[#356347]",
      fillClassName: "from-[#6f9d7f]/20 via-[#6f9d7f]/12 to-transparent",
      badgeClassName: "border-[#356347]/20 bg-[#edf5ef] text-[#234331]",
    };
  }

  if (interpretation === "HISTORY_HIGH") {
    return {
      currentTextClassName: "text-[#8c4f4f]",
      markerClassName: "bg-[#8c4f4f]",
      fillClassName: "from-[#d7b3b3]/24 via-[#d7b3b3]/12 to-transparent",
      badgeClassName: "border-[#8c4f4f]/20 bg-[#faf0f0] text-[#6c3939]",
    };
  }

  return {
    currentTextClassName: "text-foreground",
    markerClassName: "bg-foreground",
    fillClassName: "from-foreground/12 via-foreground/6 to-transparent",
    badgeClassName: "border-black/15 bg-white text-foreground",
  };
};

const getMetricGaugePreset = (metric: StockValuationMetric): MetricGaugePreset => {
  if (metric === "priceToSales") {
    return {
      shortLabel: "P/S",
      scaleLabel: "przychody TTM",
      surfaceClassName:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(238,245,252,0.82))]",
      markerLabelClassName: "border-[#4c6784]/20 bg-[#edf3fa] text-[#2f4962]",
      markerLabelDotClassName: "bg-[#5b7693]",
    };
  }

  if (metric === "priceToBook") {
    return {
      shortLabel: "P/B",
      scaleLabel: "wartosc ksiegowa",
      surfaceClassName:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,243,232,0.88))]",
      markerLabelClassName: "border-[#8d6f45]/20 bg-[#faf3e9] text-[#634c2f]",
      markerLabelDotClassName: "bg-[#8d6f45]",
    };
  }

  return {
    shortLabel: "P/E",
    scaleLabel: "zysk TTM",
    surfaceClassName:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,243,236,0.88))]",
    markerLabelClassName: "border-black/15 bg-white text-foreground",
    markerLabelDotClassName: "bg-foreground/70",
  };
};

export function StockValuationGauge({
  context,
  metric,
}: Readonly<{
  context: StockValuationRangeContext;
  metric: StockValuationMetric;
}>) {
  const hasBoundaries =
    typeof context.min === "number" &&
    typeof context.max === "number" &&
    Number.isFinite(context.min) &&
    Number.isFinite(context.max);
  const hasMarker =
    hasBoundaries &&
    typeof context.current === "number" &&
    Number.isFinite(context.current);
  const hasMedian =
    hasBoundaries &&
    typeof context.median === "number" &&
    Number.isFinite(context.median);
  const denominator =
    hasBoundaries && context.max !== context.min ? context.max - context.min : 1;
  const currentRatio =
    hasMarker && context.min !== null && context.max !== null
      ? clamp((context.current - context.min) / denominator)
      : 0.5;
  const medianRatio =
    hasMedian && context.min !== null && context.max !== null
      ? clamp((context.median - context.min) / denominator)
      : 0.5;
  const coverageText =
    context.coverageStart && context.coverageEnd
      ? `${formatDate(context.coverageStart)} - ${formatDate(context.coverageEnd)}`
      : "Brak zakresu";
  const tone = getGaugeTone(context.interpretation);
  const metricPreset = getMetricGaugePreset(metric);

  return (
    <div
      className={cn(
        "space-y-3 rounded-sm border border-dashed border-black/15 p-4",
        metricPreset.surfaceClassName
      )}
    >
      <div className="flex items-center justify-between border-b border-dashed border-black/10 pb-2 text-[10px]">
        <p className="text-foreground/65">
          Skala: <span className="font-medium text-foreground/80">{metricPreset.scaleLabel}</span>
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold tracking-[0.08em]",
            metricPreset.markerLabelClassName
          )}
        >
          <span className={cn("size-1.5 rounded-full", metricPreset.markerLabelDotClassName)} />
          {metricPreset.shortLabel}
        </span>
      </div>
      <div className="pt-7">
        <div
          className="relative h-12 overflow-visible rounded-[2px] border border-dashed border-black/15 bg-card"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgb(73 132 95 / 0.24) 0%, rgb(125 119 107 / 0.14) 50%, rgb(168 86 86 / 0.24) 100%), repeating-linear-gradient(90deg, transparent 0 14px, rgb(57 57 57 / 0.06) 14px 15px)",
          }}
        >
          {hasMarker ? (
            <span
              className={cn(
                "absolute inset-y-[3px] left-0 rounded-[2px] bg-gradient-to-r",
                tone.fillClassName
              )}
              style={{ width: `${currentRatio * 100}%` }}
              aria-hidden
            />
          ) : null}
          {hasMedian ? (
            <span
              className="absolute inset-y-0 w-px bg-foreground/30"
              style={{ left: `${medianRatio * 100}%` }}
              aria-hidden
            />
          ) : null}
          {hasMarker ? (
            <>
              <div
                className="absolute -top-7 z-10"
                style={{
                  left: `${currentRatio * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] shadow-sm",
                    metricPreset.markerLabelClassName
                  )}
                >
                  Aktualnie {metricPreset.shortLabel}
                </span>
              </div>
              <span
                className={cn(
                  "absolute inset-y-1.5 z-10 w-[3px] rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.72)]",
                  tone.markerClassName
                )}
                style={{ left: `${currentRatio * 100}%`, transform: "translateX(-50%)" }}
                aria-hidden
              />
              <span
                className={cn(
                  "absolute top-1/2 z-10 size-2.5 rounded-full border border-white/80 shadow-sm",
                  tone.markerClassName
                )}
                style={{ left: `${currentRatio * 100}%`, transform: "translate(-50%, -50%)" }}
                aria-hidden
              />
            </>
          ) : null}
        </div>
        <div className="relative mt-3 h-10">
          {hasMarker ? (
            <div
              className="absolute"
              style={{ left: `${currentRatio * 100}%`, transform: "translateX(-50%)" }}
            >
              <span
                className={cn(
                  "inline-flex min-w-16 flex-col items-center rounded-sm border px-2.5 py-1 shadow-[0_1px_0_rgba(15,23,42,0.04)]",
                  tone.badgeClassName
                )}
              >
                <span
                  className={cn(
                    "font-mono text-base font-semibold leading-none tabular-nums",
                    tone.currentTextClassName
                  )}
                >
                  {formatRatio(context.current)}
                </span>
              </span>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
          <div className="space-y-0.5">
            <p className="uppercase tracking-[0.08em] text-foreground/45">Min</p>
            <p className="font-mono font-semibold tabular-nums text-foreground/80">
              {formatRatio(context.min)}
            </p>
          </div>
          <div className="space-y-0.5 text-center">
            <p className="uppercase tracking-[0.08em] text-foreground/45">Srednia</p>
            <p className="font-mono font-semibold tabular-nums text-foreground/80">
              {formatRatio(context.median)}
            </p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="uppercase tracking-[0.08em] text-foreground/45">Max</p>
            <p className="font-mono font-semibold tabular-nums text-foreground/80">
              {formatRatio(context.max)}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-dashed border-black/10 pt-2 text-[10px]">
          <span className="font-medium uppercase tracking-[0.08em] text-[#4a7f5e]">
            Niska wycena
          </span>
          <span className="font-medium uppercase tracking-[0.08em] text-[#9a5757]">
            Wysoka wycena
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Zakres: <span className="font-mono tabular-nums">{coverageText}</span>
        {context.isTruncated ? " (skrocony zakres)" : ""}
      </p>
    </div>
  );
}

export function MissingValuationHistoryPanel({
  currentValue,
}: Readonly<{
  currentValue: number | null;
}>) {
  return (
    <div className="rounded-sm border border-dashed border-black/15 bg-card/70 p-4">
      <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
        {formatRatio(currentValue)}
      </p>
      <p className="mt-2 text-sm font-semibold tracking-tight">Historia 5Y w przygotowaniu</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Dla tego mnoznika mamy dzis tylko aktualny odczyt. Historyczny zakres, percentyl i
        ocena niska/wysoka pojawia sie dopiero, gdy bedziemy mieli wiarygodna serie czasowa.
      </p>
    </div>
  );
}
