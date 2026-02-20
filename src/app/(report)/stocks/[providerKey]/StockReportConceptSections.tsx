"use client";

import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { Sparkline } from "@/features/design-system";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import StockReportInfoHint from "./StockReportInfoHint";
import { HOW_THEY_MAKE_MONEY } from "./stock-report-static-data";

type PeriodMode = "lastQuarter" | "lastYear";

const YEAR_COMPARISON_SPARKLINES: Readonly<Record<string, readonly number[]>> = {
  Przychody: [290, 310, 330, 350, 403],
  "Zysk brutto": [150, 168, 184, 204, 240.4],
  "Zysk operacyjny": [74, 86, 101, 112, 129.2],
  "Zysk na akcje": [6.4, 7.1, 8.3, 9.0, 10.91],
};

const getChangeTone = (direction: "up" | "down" | "flat") => {
  if (direction === "up") return "text-profit";
  if (direction === "down") return "text-loss";
  return "text-muted-foreground";
};

function DollarAllocationSection() {
  const [mode, setMode] = useState<PeriodMode>("lastQuarter");
  const dataset = HOW_THEY_MAKE_MONEY[mode];

  const total = dataset.slices.reduce((acc, item) => acc + item.valuePercent, 0);

  return (
    <section className="space-y-4 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-semibold tracking-tight">Gdzie trafia kazda zlotowka przychodu</h3>
          <StockReportInfoHint
            text="Podzial 1 USD przychodu na koszty i zysk. Pomaga ocenic, czy firma buduje marze, czy spala kapital."
            ariaLabel="Wyjasnienie sekcji"
          />
        </div>
        <div className="inline-flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 rounded-sm px-3 text-[11px]"
            variant={mode === "lastQuarter" ? "default" : "outline"}
            onClick={() => setMode("lastQuarter")}
          >
            Ostatni kwartal
          </Button>
          <Button
            size="sm"
            className="h-8 rounded-sm px-3 text-[11px]"
            variant={mode === "lastYear" ? "default" : "outline"}
            onClick={() => setMode("lastYear")}
          >
            Ostatni rok
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{dataset.quickSummary}</p>

      <div className="overflow-hidden rounded-sm border border-dashed border-[color:var(--report-rule)]">
        <div className="flex h-10 w-full">
          {dataset.slices.map((slice) => (
            <div
              key={slice.label}
              className="flex h-full items-center justify-center text-[11px] font-semibold text-white"
              style={{ width: `${(slice.valuePercent / total) * 100}%`, backgroundColor: slice.color }}
            >
              {Math.round(slice.valuePercent)}%
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2">
        {dataset.slices.map((slice) => (
          <div key={slice.label} className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.label}
              <StockReportInfoHint
                text={slice.help}
                ariaLabel={`Wyjasnienie: ${slice.label}`}
              />
            </span>
            <span className="font-semibold font-mono tabular-nums">{slice.valuePercent.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <article className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-4">
        <h4 className="text-lg font-semibold tracking-tight">Co mowia priorytety wydatkow</h4>
        <p className="mt-2 text-sm leading-7 text-foreground/90">{dataset.insight}</p>
        <h5 className="mt-4 text-base font-semibold tracking-tight">Wniosek</h5>
        <p className="mt-2 text-sm leading-7 text-foreground/90">{dataset.implication}</p>
      </article>
    </section>
  );
}

function YearComparisonSection() {
  return (
    <section className="space-y-4 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <div className="flex items-center gap-2">
        <h3 className="text-2xl font-semibold tracking-tight">Ten rok vs ostatni rok</h3>
        <StockReportInfoHint
          text="Szybkie porownanie kluczowych wynikow rok do roku. Dobre do oceny kierunku biznesu."
          ariaLabel="Wyjasnienie sekcji"
        />
      </div>

      <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-4">
        <div className="space-y-3">
          {HOW_THEY_MAKE_MONEY.lastYear.metrics.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 border-b border-dotted border-[color:var(--report-rule)] pb-2 last:border-b-0 last:pb-0"
            >
              <p className="truncate text-foreground/80">{item.label}</p>
              <p className="font-mono text-xl font-semibold tracking-tight tabular-nums">{item.value}</p>
              <p className={`font-mono text-lg font-semibold tabular-nums ${getChangeTone(item.changeDirection)}`}>
                {item.change}
              </p>
              <Sparkline
                values={YEAR_COMPARISON_SPARKLINES[item.label] ?? [0, 0]}
                className="h-7 w-20 text-foreground/70"
                strokeWidth={3}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FreeCashFlowAnalysisSection() {
  return (
    <section className="space-y-4 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <div className="flex items-center gap-2">
        <h3 className="text-2xl font-semibold tracking-tight">Analiza wolnych przeplywow pienieznych</h3>
        <StockReportInfoHint
          text="FCF to gotowka po wydatkach inwestycyjnych. Pokazuje, ile pieniedzy zostaje firmie do dyspozycji."
          ariaLabel="Wyjasnienie sekcji"
        />
      </div>

      <p className="text-sm text-muted-foreground">Gotowka dostepna po utrzymaniu i rozwoju biznesu</p>

      <div className="overflow-hidden rounded-sm border border-dashed border-[color:var(--report-rule)]">
        <div className="flex h-12">
          <div className="flex w-[50.5%] items-center justify-center bg-profit text-xs font-semibold font-mono tabular-nums text-white">FCF</div>
          <div className="flex w-[49.5%] items-center justify-center bg-loss text-xs font-semibold font-mono tabular-nums text-white">CapEx</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-sm">
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 rounded-full bg-profit" />
          Wolne przeplywy <span className="font-semibold font-mono tabular-nums text-foreground">$24.5B (50.5%)</span>
        </p>
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 rounded-full bg-loss" />
          CapEx <span className="font-semibold font-mono tabular-nums text-foreground">-$24.0B (49.5%)</span>
        </p>
      </div>

      <article className="space-y-4 rounded-sm border border-dashed border-[color:var(--report-rule)] p-4 text-sm leading-7 text-foreground/90">
        <div>
          <h4 className="text-lg font-semibold tracking-tight">Czym jest wolny przeplyw pieniezny?</h4>
          <p className="mt-2">
            Wolny przeplyw pieniezny (FCF) to gotowka generowana po odjeciu nakladow inwestycyjnych.
            To pieniadz, ktory firma moze przeznaczyc na dywidendy, redukcje dlugu, skup akcji lub akwizycje.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold tracking-tight">Czy FCF jest wyzszy czy nizszy od zysku?</h4>
          <p className="mt-2">
            W tym ukladzie FCF (<span className="font-semibold font-mono tabular-nums">$24.5B</span>) jest nizszy od zysku netto,
            ale wyzszy niz w poprzednim kwartale, co wspiera teze o poprawie jakosci zysku.
          </p>
        </div>
      </article>
    </section>
  );
}

export default function StockReportConceptSections() {
  return (
    <TooltipProvider>
      <DollarAllocationSection />
      <YearComparisonSection />
      <FreeCashFlowAnalysisSection />
    </TooltipProvider>
  );
}
