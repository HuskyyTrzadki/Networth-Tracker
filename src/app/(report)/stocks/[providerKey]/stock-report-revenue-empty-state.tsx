"use client";

import { Clock3, Database } from "lucide-react";

type RevenueChartEmptyStateProps = Readonly<{
  message: string;
  variant?: "card" | "wide";
}>;

export function RevenueChartEmptyState({
  message,
  variant = "card",
}: RevenueChartEmptyStateProps) {
  if (variant === "wide") {
    return (
      <div className="flex h-full flex-col justify-between border-y border-dashed border-black/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(244,241,235,0.72)_100%)] px-8 py-7">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 border border-dashed border-black/10 bg-white/80 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Database className="size-3.5" aria-hidden />
              Oczekuje na import
            </span>
            <div className="max-w-md space-y-1.5">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Wykres pojawi sie po kolejnym odswiezeniu danych z TradingView.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
            </div>
          </div>

          <div className="hidden min-w-[168px] border border-dashed border-black/10 bg-white/75 px-4 py-3 md:block">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </p>
            <div className="mt-3 space-y-2">
              {[56, 72, 48].map((width) => (
                <div key={width} className="h-2.5 bg-black/[0.04]">
                  <div className="h-full bg-black/[0.09]" style={{ width: `${width}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" aria-hidden />
          <span>Dane uzupelnia zadanie w tle, bez blokowania raportu.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full border-y border-dashed border-black/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(244,241,235,0.72)_100%)]">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[116px_minmax(0,1fr)]">
        <div className="flex items-center justify-center border-b border-dashed border-black/10 px-6 py-5 md:border-b-0 md:border-r">
          <div className="relative flex size-[108px] items-center justify-center rounded-full border border-dashed border-black/15 bg-white/80">
            <div className="absolute inset-[15px] rounded-full border border-dashed border-black/10" />
            <div className="absolute inset-[31px] rounded-full border border-black/5 bg-[#f5f1e8]" />
            <Database className="relative z-10 size-4 text-muted-foreground" aria-hidden />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 px-6 py-5">
          <div className="space-y-2">
            <span className="inline-flex w-fit items-center gap-2 border border-dashed border-black/10 bg-white/80 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Clock3 className="size-3.5" aria-hidden />
              Dane w przygotowaniu
            </span>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Czekamy na kolejny import danych.
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {message}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[68, 52, 44].map((width) => (
              <div
                key={width}
                className="h-2 border border-dashed border-black/[0.08] bg-white/55"
              >
                <div className="h-full bg-black/[0.08]" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
