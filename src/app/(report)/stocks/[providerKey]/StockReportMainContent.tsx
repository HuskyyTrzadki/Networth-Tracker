import { Suspense } from "react";

import { Button } from "@/features/design-system/components/ui/button";

import InsightsWidgetsSection from "./InsightsWidgetsSection";
import StockChartSection from "./StockChartSection";
import StockReportCollapsible from "./StockReportCollapsible";
import StockReportConceptSections from "./StockReportConceptSections";
import StockReportFiveYearTrendAnalysisSection from "./StockReportFiveYearTrendAnalysisSection";
import StockMetricsSection from "./StockMetricsSection";
import StockReportRevenueMixSection from "./StockReportRevenueMixSection";
import {
  DEEP_DIVE_BLOCKS,
  EARNINGS_CALL_BLOCKS,
} from "./stock-report-static-data";

type MainContentProps = Readonly<{
  providerKey: string;
  metricCurrency: string;
}>;

function SummaryStartSection() {
  return (
    <section id="sekcja-podsumowanie" className="space-y-3 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <h2 className="text-3xl font-semibold tracking-tight">Najwazniejsze wnioski</h2>
      <p className="text-sm text-muted-foreground">
        Szybki skrot raportu pod inwestora. Ten blok ma prowadzic czytanie, zanim wejdziesz w szczegoly.
      </p>

      <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold">Mocne strony</h3>
            <ul className="mt-2 space-y-1 text-foreground/90">
              <li>☑ Wysoka rentownosc operacyjna utrzymuje sie mimo skali inwestycji.</li>
              <li>☑ Przeplywy operacyjne pozostaja mocne i stabilne kwartalnie.</li>
              <li>☑ Konwersja przychodow na gotowke wspiera elastycznosc finansowa.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Ryzyka</h3>
            <ul className="mt-2 space-y-1 text-foreground/90">
              <li>☑ Rosnace koszty AI zwiekszaja presje na marze w slabszym cyklu.</li>
              <li>☑ Wyzej ustawiona baza porownawcza utrudnia utrzymanie dynamiki wzrostu.</li>
              <li>☑ Wysoki capex podnosi ryzyko opoznionego zwrotu z inwestycji.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Co zmienilo sie ostatnio</h3>
            <ul className="mt-2 space-y-1 text-foreground/90">
              <li>☑ EPS nadal rosnie szybciej niz przychody.</li>
              <li>☑ Naklady inwestycyjne wyraznie wzrosly kwartal do kwartalu.</li>
              <li>☑ Priorytet strategiczny przesunal sie mocniej w strone AI i infrastruktury.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function BalanceSnapshotSection() {
  return (
    <section id="sekcja-bilans" className="space-y-4 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-3xl font-semibold tracking-tight">Co firma posiada i co jest winna</h3>
        <div className="inline-flex items-center gap-2">
          <Button size="sm" className="h-8 rounded-sm px-3 text-xs">
            Ostatni kwartal
          </Button>
          <Button size="sm" variant="outline" className="h-8 rounded-sm px-3 text-xs">
            Ostatni rok
          </Button>
        </div>
      </div>

      <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Szybkie podsumowanie
        </p>
        <p className="mt-1 text-sm text-foreground/90">
          Bilans pozostaje mocny: wysoka gotowka, kontrolowane zadluzenie i duza baza kapitalu wlasnego.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
          <p className="text-xs text-muted-foreground">Aktywa ogolem</p>
          <p className="mt-1 text-xl font-semibold">$366.0B</p>
          <p className="text-xs text-profit">+20%</p>
        </div>
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
          <p className="text-xs text-muted-foreground">Aktywa plynne</p>
          <p className="mt-1 text-xl font-semibold">$81.6B</p>
          <p className="text-xs text-profit">+83%</p>
        </div>
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
          <p className="text-xs text-muted-foreground">Zadluzenie</p>
          <p className="mt-1 text-xl font-semibold">$83.9B</p>
          <p className="text-xs text-loss">+64%</p>
        </div>
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
          <p className="text-xs text-muted-foreground">Kapital wlasny</p>
          <p className="mt-1 text-xl font-semibold">$217.2B</p>
          <p className="text-xs text-profit">+11%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
          <h4 className="text-base font-semibold tracking-tight">
            Aktywa = Zobowiazania + Kapital wlasny
          </h4>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2">
              <span className="text-muted-foreground">Aktywa razem</span>
              <span className="font-semibold">$366.0B</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2">
              <span className="text-muted-foreground">Zobowiazania razem</span>
              <span className="font-semibold">$148.8B (40.6%)</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2">
              <span className="text-muted-foreground">Kapital akcjonariuszy</span>
              <span className="font-semibold">$217.2B (59.4%)</span>
            </div>
          </div>
        </div>
        <div className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
          <h4 className="text-base font-semibold tracking-tight">Dlug i lewarowanie</h4>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2">
              <span className="text-muted-foreground">Dlug do kapitalu</span>
              <span className="font-semibold">0.39x</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2">
              <span className="text-muted-foreground">Dlug do aktywow</span>
              <span className="font-semibold">22.9%</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2">
              <span className="text-muted-foreground">Dlug netto</span>
              <span className="font-semibold">$2.3B</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EarningsSummarySection() {
  return (
    <section id="sekcja-earnings" className="space-y-3 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <h3 className="text-3xl font-semibold tracking-tight">Podsumowanie konferencji wynikowej Q4 2025</h3>
      <p className="text-sm text-muted-foreground">Skrot konferencji wynikowej META za Q4 2025</p>

      <div className="space-y-3">
        {EARNINGS_CALL_BLOCKS.map((block) => (
          <article key={block.title} className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
            <h4 className="text-base font-semibold tracking-tight">{block.title}</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
              {block.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeepDivesSection() {
  return (
    <section className="space-y-2 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      {DEEP_DIVE_BLOCKS.map((block) => (
        <StockReportCollapsible
          key={block.title}
          title={block.title}
          className="rounded-sm border border-dashed border-[color:var(--report-rule)] px-3 py-2.5"
          contentClassName="space-y-2 border-t border-dashed border-[color:var(--report-rule)] pt-2.5 text-sm text-foreground/90"
        >
          {block.takeaways.map((takeaway) => (
            <p key={takeaway}>• {takeaway}</p>
          ))}
        </StockReportCollapsible>
      ))}
    </section>
  );
}

export default function StockReportMainContent({
  providerKey,
  metricCurrency,
}: MainContentProps) {
  return (
    <section className="flex min-w-0 flex-col gap-6 lg:pl-4 lg:pt-4">
      <section id="sekcja-wykres" className="border-b border-dashed border-[color:var(--report-rule)] pb-6">
        <Suspense
          fallback={
            <div className="h-[460px] animate-pulse rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/50" />
          }
        >
          <StockChartSection providerKey={providerKey} />
        </Suspense>
      </section>

      <SummaryStartSection />

      <section
        id="sekcja-fundamenty"
        className="border-b border-dashed border-[color:var(--report-rule)] pb-6"
      >
        <Suspense
          fallback={
            <div className="h-[380px] animate-pulse rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/50" />
          }
        >
          <StockMetricsSection providerKey={providerKey} metricCurrency={metricCurrency} />
        </Suspense>
      </section>

      <section id="sekcja-jak-zarabia">
        <StockReportRevenueMixSection />
      </section>

      <BalanceSnapshotSection />

      <section id="sekcja-widzety">
        <InsightsWidgetsSection />
      </section>

      <EarningsSummarySection />
      <StockReportFiveYearTrendAnalysisSection />
      <StockReportConceptSections />
      <DeepDivesSection />
    </section>
  );
}
