"use client";

import { useEffect, useState } from "react";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
import { ArrowUpRight, Expand, X } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import { cn } from "@/lib/cn";

import {
  STOCK_INSIGHTS_WIDGETS,
  type InsightChartPoint,
  type InsightSeries,
  type InsightValueFormat,
  type InsightWidget,
} from "./stock-insights-widgets-data";
import { ReportCard, SectionHeader } from "./ReportPrimitives";

const signedPercentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  signDisplay: "always",
  maximumFractionDigits: 1,
});

const ratioFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

const axisDecimalFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

const toSeriesValue = (point: InsightChartPoint, key: InsightSeries["key"]) => {
  if (key === "primary") return point.primary;
  if (key === "secondary") return point.secondary ?? null;
  return point.tertiary ?? null;
};

const formatValue = (value: number | null | undefined, format: InsightValueFormat) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  switch (format) {
    case "usd_billions":
      return `$${decimalFormatter.format(value)}B`;
    case "usd_per_share":
      return `$${decimalFormatter.format(value)}`;
    case "shares_billions":
      return `${decimalFormatter.format(value)}B`;
    case "ratio":
      return `${ratioFormatter.format(value)}x`;
    default:
      return decimalFormatter.format(value);
  }
};

const formatAxisValue = (value: number, format: InsightValueFormat) => {
  switch (format) {
    case "usd_billions":
      return `$${axisDecimalFormatter.format(value)}B`;
    case "usd_per_share":
      return `$${axisDecimalFormatter.format(value)}`;
    case "shares_billions":
      return `${axisDecimalFormatter.format(value)}B`;
    case "ratio":
      return `${axisDecimalFormatter.format(value)}x`;
    default:
      return axisDecimalFormatter.format(value);
  }
};

const truncateQuarter = (value: string) => value.replace(" ", "\n");

const resolveCardStat = (widget: InsightWidget) => {
  const first = widget.points[0];
  const latest = widget.points[widget.points.length - 1];

  if (!first || !latest) {
    return "Brak danych";
  }

  if (widget.series.length === 1) {
    const current = toSeriesValue(latest, widget.series[0].key);
    const previous = toSeriesValue(first, widget.series[0].key);
    const change =
      typeof current === "number" && typeof previous === "number" && previous !== 0
        ? (current - previous) / Math.abs(previous)
        : null;

    return `${formatValue(current, widget.series[0].valueFormat ?? widget.valueFormat)} • ${change === null ? "-" : signedPercentFormatter.format(change)}`;
  }

  if (widget.id === "cash-debt") {
    return `Gotowka ${formatValue(latest.primary, "usd_billions")} • Dlug ${formatValue(latest.secondary, "usd_billions")}`;
  }

  if (widget.id === "expenses") {
    const total = latest.primary + (latest.secondary ?? 0);
    return `Razem ${formatValue(total, "usd_billions")}`;
  }

  if (widget.id === "valuation") {
    return `P/E ${formatValue(latest.primary, "ratio")} • EV/EBITDA ${formatValue(latest.secondary, "ratio")}`;
  }

  return "Trend kwartalny";
};

const shouldRenderSubtitle = (widget: InsightWidget) => {
  const normalizedTitle = widget.title.trim().toLowerCase();
  const normalizedSubtitle = widget.subtitle.trim().toLowerCase();
  if (normalizedSubtitle.length === 0) return false;
  return normalizedTitle !== normalizedSubtitle;
};

function InsightWidgetChart({
  widget,
  expanded,
  reducedMotion,
}: Readonly<{
  widget: InsightWidget;
  expanded: boolean;
  reducedMotion: boolean;
}>) {
  const chartHeight = expanded ? 320 : 152;
  const animationDuration = reducedMotion ? 0 : expanded ? 540 : 360;

  return (
    <div className={cn("w-full", expanded ? "h-[320px]" : "h-[152px]")}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          data={[...widget.points]}
          margin={expanded ? { top: 16, right: 12, bottom: 8, left: 4 } : { top: 10, right: 6, bottom: 8, left: 0 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeOpacity={0.42}
            strokeDasharray="4 6"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            tickFormatter={truncateQuarter}
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 10,
            }}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.55 }}
            tickLine={false}
            interval={expanded ? 0 : "preserveStartEnd"}
            minTickGap={expanded ? 12 : 16}
          />
          <YAxis
            width={expanded ? 62 : 52}
            tickFormatter={(value: string | number) =>
              formatAxisValue(Number(value), widget.valueFormat)
            }
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.55 }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ stroke: "var(--report-rule)", strokeDasharray: "3 3", strokeOpacity: 0.55 }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: "0.2rem" }}
            contentStyle={{
              border: "1px dashed var(--report-rule)",
              borderRadius: "4px",
              background: "var(--popover)",
              color: "var(--foreground)",
              boxShadow: "none",
            }}
            formatter={(value: number, name: string) => {
              const series = widget.series.find((entry) => entry.label === name);
              return [
                formatValue(value, series?.valueFormat ?? widget.valueFormat),
                name,
              ];
            }}
          />

          {widget.series.map((series) => {
            if (series.layer === "bar") {
              return (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  fill={series.color}
                  stackId={series.stackId}
                  barSize={expanded ? 22 : 14}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={!reducedMotion}
                  animationDuration={animationDuration}
                  animationEasing="ease-out"
                />
              );
            }

            if (series.layer === "line") {
              return (
                <Line
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2.1}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={animationDuration}
                  animationEasing="ease-out"
                />
              );
            }

            return (
              <Area
                key={series.key}
                dataKey={series.key}
                name={series.label}
                type="monotone"
                stroke={series.color}
                strokeWidth={2.1}
                fill={series.color}
                fillOpacity={0.18}
                isAnimationActive={!reducedMotion}
                animationDuration={animationDuration}
                animationEasing="ease-out"
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function InsightsWidgetsSection() {
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const activeWidget =
    STOCK_INSIGHTS_WIDGETS.find((widget) => widget.id === activeWidgetId) ?? null;

  return (
    <section className="space-y-4 border-b border-dashed border-black/15 pb-6">
      <SectionHeader
        as="h3"
        title="Szybkie wykresy fundamentalne"
        description="Kliknij widget, aby otworzyc modal z wiekszym wykresem i opisem."
      />

      <ReportCard contentClassName="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(odd)]:border-dashed lg:[&>*:nth-child(odd)]:border-black/15">
            {STOCK_INSIGHTS_WIDGETS.map((widget) => (
              <button
                key={widget.id}
                type="button"
                onClick={() => setActiveWidgetId(widget.id)}
                className="group w-full border-b border-dashed border-black/15 p-3 text-left transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-muted/15 lg:p-3.5 lg:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <div className="flex items-start justify-between gap-2 border-b border-dashed border-black/15 pb-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {widget.badge}
                    </p>
                    <h4 className="mt-1 text-base font-semibold tracking-tight">{widget.title}</h4>
                    {shouldRenderSubtitle(widget) ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">{widget.subtitle}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex h-7 w-7 items-center justify-center border border-black/15 text-muted-foreground transition-colors group-hover:text-foreground">
                    <Expand className="size-3.5" aria-hidden />
                  </span>
                </div>

                <p className="mt-2 text-[11px] font-medium text-foreground/90 lg:text-xs">
                  {resolveCardStat(widget)}
                </p>
                <div className="mt-2 border-t border-dashed border-black/15 pt-2">
                  <InsightWidgetChart
                    widget={widget}
                    expanded={false}
                    reducedMotion={prefersReducedMotion}
                  />
                </div>
              </button>
            ))}
          </div>
      </ReportCard>

      <Dialog open={activeWidget !== null} onOpenChange={(open) => !open && setActiveWidgetId(null)}>
        <DialogContent className="max-h-[86vh] max-w-5xl overflow-y-auto rounded-none border-y border-dashed border-black/15 bg-background p-4 shadow-none sm:p-5 lg:p-6">
          {activeWidget ? (
            <article className="space-y-4 lg:space-y-5">
              <header className="flex items-start justify-between gap-3 border-b border-dashed border-black/15 pb-3">
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    {activeWidget.title}
                  </DialogTitle>
                  {shouldRenderSubtitle(activeWidget) ? (
                    <DialogDescription className="mt-1 text-[13px] text-muted-foreground">
                      {activeWidget.subtitle}
                    </DialogDescription>
                  ) : null}
                  <p className="mt-2 text-[11px] font-medium text-foreground/70">
                    {resolveCardStat(activeWidget)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-none px-2.5 text-[11px]"
                  onClick={() => setActiveWidgetId(null)}
                >
                  <X className="size-3.5" aria-hidden />
                  Zamknij
                </Button>
              </header>

              <InsightWidgetChart
                widget={activeWidget}
                expanded
                reducedMotion={prefersReducedMotion}
              />

              <div className="grid gap-3 border-t border-dashed border-black/15 pt-3 md:grid-cols-3">
                <div className="space-y-1 border-l border-dashed border-black/20 bg-sky-100/20 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Co widzisz
                  </p>
                  <p className="text-sm leading-6 text-foreground/90">{activeWidget.description}</p>
                </div>
                <div className="space-y-1 border-l border-dashed border-black/20 bg-sky-100/20 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Co to znaczy
                  </p>
                  <p className="text-sm leading-6 text-foreground/90">{activeWidget.implication}</p>
                </div>
                <div className="space-y-1 border-l border-dashed border-black/20 bg-sky-100/20 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Na co patrzec dalej
                  </p>
                  <p className="text-sm leading-6 text-foreground/90">{activeWidget.nextFocus}</p>
                </div>
              </div>
              <a
                href="#sekcja-wykres"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-foreground hover:text-muted-foreground"
              >
                Wroc do glownego wykresu
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </article>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
