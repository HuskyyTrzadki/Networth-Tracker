"use client";

import { ArrowDown } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "@/lib/recharts-dynamic";

import { Card, CardContent } from "@/features/design-system/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/features/design-system/components/ui/chart";

import StockReportInfoHint from "./StockReportInfoHint";
import {
  PROFIT_CONVERSION_EMPTY_STATE,
  type ProfitConversionViewModel,
} from "./stock-report-profit-conversion";
import { RevenueChartEmptyState } from "./stock-report-revenue-empty-state";
import { clamp, type Slice } from "./stock-report-revenue-mix-helpers";

function MetricCard({
  label,
  value,
  caption,
}: Readonly<{
  label: string;
  value: string;
  caption?: string;
}>) {
  return (
    <Card className="border-black/5 bg-[#faf9f6] [background-image:linear-gradient(140deg,#ffffff_0%,#f3f1eb_100%)]">
      <CardContent className="space-y-1.5 pt-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-xl font-semibold tabular-nums">{value}</p>
        {caption ? (
          <p className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
            {caption}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MarginBar({
  label,
  description,
  valuePercent,
}: Readonly<{
  label: string;
  description: string;
  valuePercent: number;
}>) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[172px_minmax(0,1fr)_auto] sm:gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="h-7 overflow-hidden border border-dashed border-black/15 bg-muted/20">
        <div
          className="relative h-full bg-[#4a705e]"
          style={{ width: `${clamp(valuePercent, 0, 100)}%` }}
        >
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
            {valuePercent.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="hidden font-mono text-xs font-bold tabular-nums text-muted-foreground sm:block">
        {valuePercent.toFixed(1)}%
      </p>
    </div>
  );
}

function MarginDrop({
  label,
  dropPercent,
}: Readonly<{
  label: string;
  dropPercent: number;
}>) {
  if (!Number.isFinite(dropPercent) || dropPercent <= 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[172px_minmax(0,1fr)_auto] sm:gap-3">
      <div />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowDown className="size-3.5 text-loss" aria-hidden />
        <span className="font-semibold text-loss">-{dropPercent.toFixed(1)} pkt</span>
        <span>{label}</span>
      </div>
      <div />
    </div>
  );
}

export function DonutCard({
  title,
  slices,
  emptyState = "Brak danych do wykresu",
}: Readonly<{
  title: string;
  slices: readonly Slice[];
  emptyState?: string;
}>) {
  const chartConfig = slices.reduce<ChartConfig>((acc, slice) => {
    acc[slice.key] = {
      label: slice.label,
      color: slice.color,
    };
    return acc;
  }, {});

  return (
    <article className="border-t border-dashed border-black/15 pt-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold tracking-tight">{title}</h4>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="h-[260px]">
          {slices.length ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[...slices]}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={76}
                    outerRadius={112}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${Number(value).toFixed(1)}%`}
                        indicator="dot"
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <RevenueChartEmptyState message={emptyState} />
          )}
        </div>

        <div className="space-y-2 text-sm">
          {slices.length
            ? slices.map((slice) => (
                <div
                  key={slice.key}
                  className="flex items-center justify-between border-b border-dashed border-black/15 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-foreground/85">{slice.label}</span>
                    <StockReportInfoHint
                      text={slice.help}
                      ariaLabel={`Wyjasnienie: ${slice.label}`}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {slice.value.toFixed(1)}%
                  </span>
                </div>
              ))
            : [0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-dashed border-black/10 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                    <div
                      className="h-2.5 bg-black/[0.06]"
                      style={{
                        width:
                          index === 0
                            ? "7rem"
                            : index === 1
                              ? "6rem"
                              : index === 2
                                ? "5rem"
                                : "4rem",
                      }}
                    />
                  </div>
                  <div className="h-2.5 w-10 bg-black/[0.06]" />
                </div>
              ))}
        </div>
      </div>
    </article>
  );
}

export function ProfitabilitySnapshot({
  viewModel,
  emptyState = PROFIT_CONVERSION_EMPTY_STATE,
}: Readonly<{
  viewModel: ProfitConversionViewModel | null;
  emptyState?: string;
}>) {
  if (!viewModel) {
    return (
      <article className="space-y-3 border-b border-dashed border-black/15 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-base font-semibold tracking-tight">
              Jak firma zamienia przychody na zysk
            </h4>
          </div>
        </div>

        <div className="mt-3 h-[220px]">
          <RevenueChartEmptyState message={emptyState} variant="wide" />
        </div>
      </article>
    );
  }

  return (
    <article className="space-y-3 border-b border-dashed border-black/15 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold tracking-tight">
            Jak firma zamienia przychody na zysk
          </h4>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{viewModel.periodLabel}</p>
      </div>

      <div className="mt-4 border-l border-dashed border-black/20 bg-amber-100/20 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Szybkie podsumowanie
        </p>
        <p className="mt-1 text-sm italic leading-relaxed text-foreground/90">
          {viewModel.quickSummary}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {viewModel.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            caption={metric.caption}
          />
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <h5 className="text-sm font-semibold tracking-tight">Jak kurczy sie marza</h5>
        <MarginBar
          label="Marza brutto"
          description="Po koszcie dostarczenia produktu lub uslugi"
          valuePercent={clamp(viewModel.grossMarginPercent, 0, 100)}
        />
        <MarginDrop
          label="dzialanie i rozwoj firmy"
          dropPercent={clamp(viewModel.operatingDropPercent, 0, 100)}
        />
        <MarginBar
          label="Marza operacyjna"
          description="Po kosztach operacyjnych"
          valuePercent={clamp(viewModel.operatingMarginPercent, 0, 100)}
        />
        <MarginDrop
          label="podatki i inne obciazenia"
          dropPercent={clamp(viewModel.netDropPercent, 0, 100)}
        />
        <MarginBar
          label="Marza netto"
          description="Po pozycjach ponizej wyniku operacyjnego"
          valuePercent={clamp(viewModel.netMarginPercent, 0, 100)}
        />
      </div>

      <div className="mt-5 border-l border-dashed border-black/20 bg-sky-100/20 px-3 py-2 text-sm text-foreground/90">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Wniosek
        </p>
        <p className="mt-1 italic leading-relaxed">{viewModel.explanation}</p>
        <p className="mt-2 italic leading-relaxed">{viewModel.implication}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2">
        {viewModel.slices.map((slice) => (
          <div key={slice.key} className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-foreground/85">{slice.label}</span>
            </span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {slice.valuePercent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
