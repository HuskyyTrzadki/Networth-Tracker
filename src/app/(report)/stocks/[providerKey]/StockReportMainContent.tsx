import { Suspense } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check } from "lucide-react";

import InsightsWidgetsSectionLazy from "./InsightsWidgetsSectionLazy";
import StockChartSection from "./StockChartSection";
import StockReportCollapsible from "./StockReportCollapsible";
import StockReportConceptSectionsLazy from "./StockReportConceptSectionsLazy";
import StockReportFiveYearTrendAnalysisSection from "./StockReportFiveYearTrendAnalysisSection";
import StockReportLeadershipSection from "./StockReportLeadershipSection";
import StockMetricsSection from "./StockMetricsSection";
import StockReportRevenueMixSectionLazy from "./StockReportRevenueMixSectionLazy";
import RenderOnVisible from "./RenderOnVisible";
import {
  EditorsNote,
  InvestorTakeaway,
  ReportCard,
  ReportSection,
  SectionHeader,
} from "./ReportPrimitives";
import {
  BALANCE_SNAPSHOT,
  buildBalanceNarrative,
  formatBillions,
  formatPercent,
  formatRatio,
} from "./stock-report-balance-summary";
import {
  DEEP_DIVE_BLOCKS,
  EARNINGS_CALL_BLOCKS,
} from "./stock-report-static-data";

type MainContentProps = Readonly<{
  providerKey: string;
  metricCurrency: string;
}>;

function StockMetricsSectionSkeleton() {
  return (
    <div
      className="h-[380px] animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]"
      aria-hidden="true"
    />
  );
}

function SummaryStartSection() {
  return (
    <ReportSection
      id="sekcja-snapshot"
      title="Snapshot"
      description="Najkrotsza hipoteza inwestycyjna na start."
    >
      <ReportCard contentClassName="space-y-5 p-6 lg:p-8">
          <div className="border-b border-dashed border-[color:var(--report-rule)]/20 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Teza w 1 zdaniu
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/90">
              To nadal biznes wysokiej jakosci z mocnym cash flow, ale obecna wycena
              wymaga, zeby AI i capex zaczely wracac w realnym wzroscie, nie tylko w
              obietnicy.
            </p>
          </div>

          <div className="grid gap-6 text-sm lg:grid-cols-3">
            <div>
              <h3 className="font-semibold">Mocne strony</h3>
              <ul className="mt-2 space-y-1.5 text-foreground/90">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-700/80" aria-hidden />
                  Core reklamowy dalej daje skale i marze, ktore trudno szybko podrobic.
                </li>
                <li className="flex items-start gap-2">
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-emerald-700/80" aria-hidden />
                  Gotowka z operacji daje komfort inwestowania bez natychmiastowej presji na bilans.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Ryzyka</h3>
              <ul className="mt-2 space-y-1.5 text-foreground/90">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-rose-700/80" aria-hidden />
                  Koszt AI i infrastruktury rośnie szybciej, niz latwo go obronic w jednym czy dwoch raportach.
                </li>
                <li className="flex items-start gap-2">
                  <ArrowDownRight className="mt-0.5 size-3.5 shrink-0 text-rose-700/80" aria-hidden />
                  Przy takiej wycenie nawet lekkie spowolnienie reklam albo slabsza monetyzacja nowych produktow boli mocniej.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Na co patrzec teraz</h3>
              <ul className="mt-2 space-y-1.5 text-foreground/90">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/75" aria-hidden />
                  Czy przychody i EPS dalej rosna mimo wyzszego kosztu infrastruktury.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/75" aria-hidden />
                  Czy nowe inwestycje zaczynaja poprawiac monetyzacje, a nie tylko podbijac capex.
                </li>
              </ul>
            </div>
          </div>

          <EditorsNote title="Uwaga">
            Ta teza ma sens tylko wtedy, gdy marza, bilans i cash flow potwierdzaja,
            ze wzrost nie jest kupowany za kazda cene.
          </EditorsNote>
          <InvestorTakeaway>
            Najpierw odpowiedz sobie, czy firma nadal umie rosnac bez psucia ekonomiki
            biznesu. Jesli tak, wycena jest kolejnym filtrem. Jesli nie, reszta raportu
            to tylko szczegoly.
          </InvestorTakeaway>
      </ReportCard>
    </ReportSection>
  );
}

function BalanceSnapshotSection() {
  const narrative = buildBalanceNarrative(BALANCE_SNAPSHOT);
  const riskTone =
    narrative.risk === "Niskie"
      ? "text-profit bg-profit/10"
      : narrative.risk === "Podwyzszone"
        ? "text-loss bg-loss/10"
        : "text-amber-700 bg-amber-100/60 dark:bg-amber-300/15";

  return (
    <section id="sekcja-bilans" className="space-y-4 border-b border-dashed border-black/15 pb-6">
      <SectionHeader
        as="h3"
        title="Co firma posiada i co jest winna"
        titleClassName="font-semibold"
        description="Bilans w skrocie na bazie ostatniego dostepnego okresu."
      />

      <div className="border-t border-dashed border-black/15 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Bilans w skrocie
          </p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskTone}`}>
            Ryzyko: {narrative.risk}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground/90">{narrative.summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="border-b border-dashed border-black/15 pb-2">
          <p className="text-[11px] text-muted-foreground">Aktywa ogolem</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {formatBillions(BALANCE_SNAPSHOT.assetsTotal)}
          </p>
          <p className="text-[11px] font-mono tabular-nums text-profit">+20%</p>
        </div>
        <div className="border-b border-dashed border-black/15 pb-2">
          <p className="text-[11px] text-muted-foreground">Aktywa plynne</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {formatBillions(BALANCE_SNAPSHOT.liquidAssets)}
          </p>
          <p className="text-[11px] font-mono tabular-nums text-profit">+83%</p>
        </div>
        <div className="border-b border-dashed border-black/15 pb-2">
          <p className="text-[11px] text-muted-foreground">Zadluzenie</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {formatBillions(BALANCE_SNAPSHOT.debt)}
          </p>
          <p className="text-[11px] font-mono tabular-nums text-loss">+64%</p>
        </div>
        <div className="border-b border-dashed border-black/15 pb-2">
          <p className="text-[11px] text-muted-foreground">Kapital wlasny</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {formatBillions(BALANCE_SNAPSHOT.equity)}
          </p>
          <p className="text-[11px] font-mono tabular-nums text-profit">+11%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border-t border-dashed border-black/15 pt-3">
          <h4 className="text-base font-semibold tracking-tight">
            Aktywa = Zobowiazania + Kapital wlasny
          </h4>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-dashed border-black/15 pb-2">
              <span className="text-muted-foreground">Aktywa razem</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatBillions(BALANCE_SNAPSHOT.assetsTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-black/15 pb-2">
              <span className="text-muted-foreground">Zobowiazania razem</span>
              <span className="font-mono font-semibold tabular-nums">
                $148.8B (40.6%)
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-black/15 pb-2">
              <span className="text-muted-foreground">Kapital akcjonariuszy</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatBillions(BALANCE_SNAPSHOT.equity)} (59.4%)
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-dashed border-black/15 pt-3">
          <h4 className="text-base font-semibold tracking-tight">Dlug i lewarowanie</h4>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-dashed border-black/15 pb-2">
              <span className="text-muted-foreground">Dlug do kapitalu</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatRatio(BALANCE_SNAPSHOT.debtToEquity)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-black/15 pb-2">
              <span className="text-muted-foreground">Dlug do aktywow</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatPercent(BALANCE_SNAPSHOT.debtToAssets)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-black/15 pb-2">
              <span className="text-muted-foreground">Dlug netto</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatBillions(BALANCE_SNAPSHOT.netDebt)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <InvestorTakeaway>
        Patrz na trzy rzeczy: bufor plynnosci, skale dlugu i to, czy rentownosc wystarcza,
        zeby ten bilans utrzymac bez napiecia.
      </InvestorTakeaway>
    </section>
  );
}

function EarningsSummarySection() {
  return (
    <ReportSection
      id="sekcja-earnings"
      title="Konferencja wynikowa Q4 2025"
    >
      <div className="space-y-4">
        {EARNINGS_CALL_BLOCKS.map((block, index) => (
          <article key={block.title} className="border-b border-dashed border-black/15 pb-3 last:border-b-0 last:pb-0">
            <h4 className="text-base font-semibold tracking-tight">
              <span className="mr-2 font-mono tabular-nums">{index + 1}.</span>
              {block.title}
            </h4>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/90">
              {block.items.map((item, itemIndex) => (
                <li key={item}>
                  <span className="mr-2 font-mono text-[12px] font-semibold tabular-nums text-muted-foreground">
                    {itemIndex + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <InvestorTakeaway>
        Traktuj to jako komentarz do liczb, nie zamiennik liczb. Najpierw marze, cash
        flow i wycena, dopiero potem narracja zarzadu.
      </InvestorTakeaway>
    </ReportSection>
  );
}

function DeepDivesSection() {
  return (
    <section className="space-y-2 border-b border-dashed border-black/15 pb-6">
      {DEEP_DIVE_BLOCKS.map((block) => (
        <StockReportCollapsible
          key={block.title}
          title={block.title}
          className="border-b border-dashed border-black/15 px-3 py-2.5"
          contentClassName="space-y-2 border-t border-dashed border-black/15 pt-2.5 text-sm text-foreground/90"
        >
          {block.takeaways.map((takeaway) => (
            <p key={takeaway}>• {takeaway}</p>
          ))}
        </StockReportCollapsible>
      ))}
    </section>
  );
}

function AdvancedSection() {
  const sectionGroups = [
    "Bilans i odpornosc finansowa",
    "Zarzad, insiderzy i sygnaly z wynikow",
    "Trend 5Y i dodatkowe rozbicia",
  ] as const;

  return (
    <ReportSection
      id="sekcja-zaawansowane"
      title="Zaawansowane"
      description="Bilans, zarzad, wyniki i dluzszy kontekst w jednym miejscu."
    >
      <ReportCard contentClassName="space-y-4 p-6">
        <div className="grid gap-2 text-sm text-foreground/90 lg:grid-cols-3">
          {sectionGroups.map((label) => (
            <div
              key={label}
              className="border-b border-dashed border-[color:var(--report-rule)]/20 pb-2 lg:border-b-0 lg:border-l lg:pl-3 first:lg:border-l-0 first:lg:pl-0"
            >
              {label}
            </div>
          ))}
        </div>
        <StockReportCollapsible
          title="Rozwin analize dodatkowa"
          className="border-b border-dashed border-[color:var(--report-rule)]/20 px-0 py-0"
          contentClassName="space-y-6 border-t border-dashed border-[color:var(--report-rule)]/20 pt-4"
        >
          <BalanceSnapshotSection />
          <StockReportLeadershipSection />
          <section id="sekcja-widzety">
            <InsightsWidgetsSectionLazy />
          </section>
          <EarningsSummarySection />
          <StockReportFiveYearTrendAnalysisSection />
          <StockReportConceptSectionsLazy />
          <DeepDivesSection />
        </StockReportCollapsible>
      </ReportCard>
    </ReportSection>
  );
}

export default function StockReportMainContent({
  providerKey,
  metricCurrency,
}: MainContentProps) {
  return (
    <section className="flex min-w-0 w-full max-w-screen-xl flex-1 flex-col gap-6 lg:pl-4 lg:pt-4">
      <SummaryStartSection />

      <section id="sekcja-wykres" className="border-b border-dashed border-black/15 pb-6">
        <Suspense
          fallback={
            <div className="h-[460px] animate-pulse rounded-md border border-black/5 bg-white/85 shadow-[var(--surface-shadow)]" />
          }
        >
          <StockChartSection providerKey={providerKey} />
        </Suspense>
      </section>

      <section
        id="sekcja-fundamenty"
        className="border-b border-dashed border-black/15 pb-6"
      >
        <RenderOnVisible rootMargin="220px 0px" fallback={<StockMetricsSectionSkeleton />}>
          <Suspense fallback={<StockMetricsSectionSkeleton />}>
            <StockMetricsSection providerKey={providerKey} metricCurrency={metricCurrency} />
          </Suspense>
        </RenderOnVisible>
      </section>

      <section id="sekcja-jak-zarabia">
        <StockReportRevenueMixSectionLazy />
      </section>
      <AdvancedSection />
    </section>
  );
}
