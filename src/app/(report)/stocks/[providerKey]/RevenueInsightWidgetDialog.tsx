"use client";

import { useState } from "react";

import {
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/features/design-system/components/ui/toggle-group";

import type {
  InsightWidgetPeriod,
  RevenueInsightFrequency,
  RevenueInsightWidget,
} from "./stock-insights-widget-types";
import InsightWidgetChart from "./InsightWidgetChart";
import {
  getRevenueInsightAvailablePeriods,
  resolveDefaultRevenueInsightFrequency,
  resolveDefaultRevenueInsightPeriod,
  resolveVisibleRevenueInsightPoints,
} from "./stock-report-revenue-insight";
import {
  resolveInsightWidgetCardStat,
  shouldRenderInsightWidgetSubtitle,
} from "./stock-insights-widget-view";

function SettingsGroup({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-2 border-b border-dashed border-black/15 pb-4 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      {children}
    </section>
  );
}

export default function RevenueInsightWidgetDialog({
  widget,
  reducedMotion,
}: Readonly<{
  widget: RevenueInsightWidget;
  reducedMotion: boolean;
}>) {
  const [frequency, setFrequency] = useState<RevenueInsightFrequency>(
    resolveDefaultRevenueInsightFrequency(widget)
  );
  const availablePeriods = getRevenueInsightAvailablePeriods(widget, frequency);
  const [period, setPeriod] = useState<InsightWidgetPeriod>(() =>
    resolveDefaultRevenueInsightPeriod(widget, frequency)
  );

  const normalizedPeriod = availablePeriods.includes(period)
    ? period
    : availablePeriods[0] ?? "ALL";
  const visiblePoints = resolveVisibleRevenueInsightPoints(
    widget,
    frequency,
    normalizedPeriod
  );
  const headerStat = resolveInsightWidgetCardStat(widget, visiblePoints);

  return (
    <article className="space-y-4 lg:space-y-5">
      <header className="flex items-start justify-between gap-3 border-b border-dashed border-black/15 pb-3">
        <div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {widget.title}
          </DialogTitle>
          {shouldRenderInsightWidgetSubtitle(widget) ? (
            <DialogDescription className="mt-1 text-[13px] text-muted-foreground">
              {widget.subtitle}
            </DialogDescription>
          ) : null}
          <p className="mt-2 text-[11px] font-medium text-foreground/70">{headerStat}</p>
        </div>
      </header>

      {visiblePoints.length === 0 ? (
        <div className="rounded-sm border border-dashed border-black/15 bg-muted/10 px-4 py-10 text-sm text-muted-foreground">
          {widget.emptyState}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-sm border border-dashed border-black/15 bg-white p-3">
            <InsightWidgetChart
              widget={widget}
              points={visiblePoints}
              expanded
              reducedMotion={reducedMotion}
            />
          </div>

          <aside className="space-y-4 border-t border-dashed border-black/15 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            <div className="space-y-1">
              <h4 className="text-base font-semibold tracking-tight">Chart Options</h4>
              <p className="text-xs text-muted-foreground">{widget.sourceLabel}</p>
            </div>

            <SettingsGroup label="Data Frequency">
              <ToggleGroup
                type="single"
                value={frequency}
                onValueChange={(value) => {
                  if (value !== "quarterly" && value !== "annual") {
                    return;
                  }

                  setFrequency(value);
                  setPeriod(resolveDefaultRevenueInsightPeriod(widget, value));
                }}
                className="grid grid-cols-2 gap-2"
                aria-label="Czestotliwosc danych"
              >
                {(["quarterly", "annual"] as const).map((option) => (
                  <ToggleGroupItem
                    key={option}
                    value={option}
                    variant="outline"
                    className="h-10 cursor-pointer rounded-sm border-black/15 text-xs text-foreground/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:border-black/25 hover:bg-muted/40 hover:text-foreground data-[state=on]:border-foreground/85 data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-none"
                    disabled={!widget.datasets.some((dataset) => dataset.frequency === option && dataset.points.length > 0)}
                  >
                    {option === "quarterly" ? "Quarterly" : "Annual"}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SettingsGroup>

            <SettingsGroup label="Time Period">
              <ToggleGroup
                type="single"
                value={normalizedPeriod}
                onValueChange={(value) => {
                  if (
                    value === "1Y" ||
                    value === "2Y" ||
                    value === "3Y" ||
                    value === "5Y" ||
                    value === "10Y" ||
                    value === "ALL"
                  ) {
                    setPeriod(value);
                  }
                }}
                className="grid grid-cols-3 gap-2"
                aria-label="Zakres czasu"
              >
                {availablePeriods.map((option) => (
                  <ToggleGroupItem
                    key={option}
                    value={option}
                    variant="outline"
                    className="h-10 cursor-pointer rounded-sm border-black/15 font-mono text-[11px] text-foreground/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:border-black/25 hover:bg-muted/40 hover:text-foreground data-[state=on]:border-foreground/85 data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-none"
                  >
                    {option}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SettingsGroup>
          </aside>
        </div>
      )}
    </article>
  );
}
