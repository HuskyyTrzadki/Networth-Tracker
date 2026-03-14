"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Expand, X } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";

import HistoricalInsightWidgetDialog from "./HistoricalInsightWidgetDialog";
import InsightWidgetChart from "./InsightWidgetChart";
import { ReportCard, SectionHeader } from "./ReportPrimitives";
import { STATIC_STOCK_INSIGHT_WIDGETS } from "./stock-insights-widgets-data";
import {
  resolveDefaultHistoricalInsightFrequency,
  resolveDefaultHistoricalInsightPeriod,
  resolveVisibleHistoricalInsightPoints,
} from "./stock-report-historical-insight";
import type {
  HistoricalInsightWidget,
  InsightWidget,
  StaticInsightWidget,
} from "./stock-insights-widget-types";
import {
  resolveInsightWidgetCardStat,
  shouldRenderInsightWidgetSubtitle,
} from "./stock-insights-widget-view";

function LegacyInsightWidgetDialog({
  widget,
  reducedMotion,
}: Readonly<{
  widget: StaticInsightWidget;
  reducedMotion: boolean;
}>) {
  const headerStat = resolveInsightWidgetCardStat(widget, widget.points);

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
          <p className="mt-2 text-[11px] font-medium text-foreground/70">
            {headerStat}
          </p>
        </div>
      </header>

      <InsightWidgetChart
        widget={widget}
        points={widget.points}
        expanded
        reducedMotion={reducedMotion}
      />

      <div className="grid gap-3 border-t border-dashed border-black/15 pt-3 md:grid-cols-3">
        <div className="space-y-1 border-l border-dashed border-black/20 bg-sky-100/20 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Obraz
          </p>
          <p className="text-sm leading-6 text-foreground/90">{widget.description}</p>
        </div>
        <div className="space-y-1 border-l border-dashed border-black/20 bg-sky-100/20 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Wniosek
          </p>
          <p className="text-sm leading-6 text-foreground/90">{widget.implication}</p>
        </div>
        <div className="space-y-1 border-l border-dashed border-black/20 bg-sky-100/20 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Dalej
          </p>
          <p className="text-sm leading-6 text-foreground/90">{widget.nextFocus}</p>
        </div>
      </div>
      <a
        href="#sekcja-wykres"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-foreground hover:text-muted-foreground"
      >
        Wroc do wykresu
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </article>
  );
}

export default function InsightsWidgetsSection({
  dynamicWidgets,
}: Readonly<{
  dynamicWidgets: readonly HistoricalInsightWidget[];
}>) {
  const hasDynamicValuationWidget = dynamicWidgets.some(
    (widget) => widget.id === "pe-ratio" || widget.id === "ps-ratio"
  );
  const widgets: readonly InsightWidget[] = [
    ...dynamicWidgets,
    ...STATIC_STOCK_INSIGHT_WIDGETS.filter((widget) =>
      hasDynamicValuationWidget ? widget.id !== "valuation" : true
    ),
  ];
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const activeWidget = widgets.find((widget) => widget.id === activeWidgetId) ?? null;

  return (
    <section className="space-y-4 border-b border-dashed border-black/15 pb-6">
      <SectionHeader as="h3" title="Wybrane trendy finansowe" />

      <ReportCard contentClassName="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(odd)]:border-dashed lg:[&>*:nth-child(odd)]:border-black/15">
          {widgets.map((widget) => {
            const defaultFrequency =
              widget.kind === "historical" && widget.frequencyMode !== "best-available"
                ? resolveDefaultHistoricalInsightFrequency(widget)
                : undefined;
            const cardPoints =
              widget.kind === "historical"
                ? resolveVisibleHistoricalInsightPoints(
                    widget,
                    defaultFrequency,
                    resolveDefaultHistoricalInsightPeriod(widget, defaultFrequency)
                  )
                : widget.points;
            const cardStat = resolveInsightWidgetCardStat(widget, cardPoints);

            return (
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
                    <h4 className="mt-1 text-base font-semibold tracking-tight">
                      {widget.title}
                    </h4>
                    {shouldRenderInsightWidgetSubtitle(widget) ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {widget.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex h-7 w-7 items-center justify-center border border-black/15 text-muted-foreground transition-colors group-hover:text-foreground">
                    <Expand className="size-3.5" aria-hidden />
                  </span>
                </div>

                <p className="mt-2 text-[11px] font-medium text-foreground/90 lg:text-xs">
                  {cardStat}
                </p>
                <div className="mt-2 border-t border-dashed border-black/15 pt-2">
                  <InsightWidgetChart
                    widget={widget}
                    points={cardPoints}
                    expanded={false}
                    reducedMotion={prefersReducedMotion}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </ReportCard>

      <Dialog
        open={activeWidget !== null}
        onOpenChange={(open) => !open && setActiveWidgetId(null)}
      >
        <DialogContent className="max-h-[86vh] max-w-6xl overflow-y-auto rounded-none border-y border-dashed border-black/15 bg-background p-4 shadow-none sm:p-5 lg:p-6">
          {activeWidget ? (
            <>
              <div className="mb-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-none px-2.5 text-[11px]"
                  onClick={() => setActiveWidgetId(null)}
                >
                  <X className="size-3.5" aria-hidden />
                  Zamknij
                </Button>
              </div>

              {activeWidget.kind === "historical" ? (
                <HistoricalInsightWidgetDialog
                  widget={activeWidget}
                  reducedMotion={prefersReducedMotion}
                />
              ) : (
                <LegacyInsightWidgetDialog
                  widget={activeWidget}
                  reducedMotion={prefersReducedMotion}
                />
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
