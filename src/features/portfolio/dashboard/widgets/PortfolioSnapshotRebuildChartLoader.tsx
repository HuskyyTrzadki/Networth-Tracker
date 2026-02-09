"use client";

import { Loader2 } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/cn";

import { SHARED_PORTFOLIO_CHART_HEIGHT } from "./portfolio-value-over-time-chart-layout";

type Props = Readonly<{
  fromDate: string | null;
  toDate: string | null;
  progressPercent: number | null;
}>;

const clampProgress = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

export function PortfolioSnapshotRebuildChartLoader({
  fromDate,
  toDate,
  progressPercent,
}: Props) {
  const idBase = useId().replace(/:/g, "");
  const areaGradientId = `${idBase}-rebuild-area`;
  const progress = clampProgress(progressPercent);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = progress === null ? 0.12 : progress / 100;
  const dashOffset = circumference * (1 - progressRatio);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-slate-600/5 via-cyan-500/5 to-background p-5",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(2,6,23,0.05)]"
      )}
      style={{ height: SHARED_PORTFOLIO_CHART_HEIGHT }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_10%_0%,rgba(6,182,212,0.14),transparent_62%)] dark:bg-[radial-gradient(120%_80%_at_10%_0%,rgba(103,232,249,0.10),transparent_62%)]" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-600/25 bg-cyan-600/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.01em] text-cyan-800 dark:text-cyan-200">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Przebudowa historii snapshotów
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono tabular-nums">
                od: {fromDate ?? "dziś"}
              </span>
              <span className="rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono tabular-nums">
                do: {toDate ?? "dziś"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <div className="relative grid size-14 place-items-center rounded-full bg-background/85 ring-1 ring-border/70">
              <svg
                viewBox="0 0 56 56"
                className="absolute inset-0 size-full -rotate-90"
                aria-hidden
              >
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  fill="none"
                  stroke="rgba(100,116,139,0.24)"
                  strokeWidth="4"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  fill="none"
                  stroke="rgba(8,145,178,0.9)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                {progress !== null ? `${progress}%` : "..."}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              postęp
            </span>
          </div>
        </div>

        <div className="relative mt-4 flex-1 overflow-hidden rounded-lg border border-border/60 bg-background/70">
          <div className="pointer-events-none absolute inset-x-4 top-5 grid gap-7">
            <div className="h-px bg-border/55" />
            <div className="h-px bg-border/55" />
            <div className="h-px bg-border/55" />
            <div className="h-px bg-border/55" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent animate-[pulse_2.4s_ease-in-out_infinite]" />

          <svg
            viewBox="0 0 340 212"
            className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]"
            aria-hidden
          >
            <defs>
              <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(8,145,178,0.30)" />
                <stop offset="100%" stopColor="rgba(8,145,178,0.03)" />
              </linearGradient>
            </defs>
            <path
              d="M0 182 L42 174 L86 165 L132 144 L176 149 L220 132 L264 121 L308 106 L340 96 L340 212 L0 212 Z"
              fill={`url(#${areaGradientId})`}
            />
            <polyline
              points="0,182 42,174 86,165 132,144 176,149 220,132 264,121 308,106 340,96"
              fill="none"
              stroke="rgba(8,145,178,0.92)"
              strokeWidth="2.5"
              className="animate-[pulse_2.2s_ease-in-out_infinite]"
            />
            <polyline
              points="0,186 42,180 86,174 132,161 176,160 220,154 264,148 308,140 340,134"
              fill="none"
              stroke="rgba(100,116,139,0.72)"
              strokeWidth="1.8"
              strokeDasharray="4 4"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export const __test__ = {
  clampProgress,
};
