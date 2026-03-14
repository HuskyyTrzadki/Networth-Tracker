import type { ReactNode } from "react";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check } from "lucide-react";

import StockReportCollapsible from "./StockReportCollapsible";
import StockReportConceptSectionsLazy from "./StockReportConceptSectionsLazy";
import StockReportFiveYearTrendAnalysisSection from "./StockReportFiveYearTrendAnalysisSection";
import StockReportLeadershipSection from "./StockReportLeadershipSection";
import {
  InvestorTakeaway,
  ReportCard,
  ReportSection,
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

function MetricTile({
  label,
  value,
  change,
  changeTone,
}: Readonly<{
  label: string;
  value: string;
  change: string;
  changeTone: "up" | "down";
}>) {
  return (
    <div className="border-b border-dashed border-black/15 pb-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
      <p
        className={
          changeTone === "up"
            ? "text-[11px] font-mono tabular-nums text-profit"
            : "text-[11px] font-mono tabular-nums text-loss"
        }
      >
        {change}
      </p>
    </div>
  );
}

export function BalanceSnapshotSection() {
  const narrative = buildBalanceNarrative(BALANCE_SNAPSHOT);
  const riskTone =
    narrative.risk === "Niskie"
      ? "text-profit bg-profit/10"
      : narrative.risk === "Podwyzszone"
      ? "text-loss bg-loss/10"
        : "text-amber-700 bg-amber-100/60 dark:bg-amber-300/15";

  return (
    <ReportSection id="sekcja-bilans" title="Bilans i odpornosc finansowa">
      <ReportCard contentClassName="space-y-5 p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-[color:var(--report-rule)]/20 pb-4">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">
            {narrative.summary}
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${riskTone}`}
          >
            Ryzyko: {narrative.risk}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <MetricTile
            label="Aktywa ogolem"
            value={formatBillions(BALANCE_SNAPSHOT.assetsTotal)}
            change="+20%"
            changeTone="up"
          />
          <MetricTile
            label="Aktywa plynne"
            value={formatBillions(BALANCE_SNAPSHOT.liquidAssets)}
            change="+83%"
            changeTone="up"
          />
          <MetricTile
            label="Zadluzenie"
            value={formatBillions(BALANCE_SNAPSHOT.debt)}
            change="+64%"
            changeTone="down"
          />
          <MetricTile
            label="Kapital wlasny"
            value={formatBillions(BALANCE_SNAPSHOT.equity)}
            change="+11%"
            changeTone="up"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BalanceList
            title="Struktura bilansu"
            rows={[
              {
                label: "Aktywa razem",
                value: formatBillions(BALANCE_SNAPSHOT.assetsTotal),
              },
              {
                label: "Zobowiazania razem",
                value: "$148.8B (40.6%)",
              },
              {
                label: "Kapital akcjonariuszy",
                value: `${formatBillions(BALANCE_SNAPSHOT.equity)} (59.4%)`,
              },
            ]}
          />
          <BalanceList
            title="Dlug i lewarowanie"
            rows={[
              {
                label: "Dlug do kapitalu",
                value: formatRatio(BALANCE_SNAPSHOT.debtToEquity),
              },
              {
                label: "Dlug do aktywow",
                value: formatPercent(BALANCE_SNAPSHOT.debtToAssets),
              },
              {
                label: "Dlug netto",
                value: formatBillions(BALANCE_SNAPSHOT.netDebt),
              },
            ]}
          />
        </div>

        <InvestorTakeaway>
          Patrz na trzy rzeczy: bufor plynnosci, skale dlugu i to, czy rentownosc
          wystarcza, zeby ten bilans utrzymac bez napiecia.
        </InvestorTakeaway>
      </ReportCard>
    </ReportSection>
  );
}

function BalanceList({
  title,
  rows,
}: Readonly<{
  title: string;
  rows: readonly Readonly<{ label: string; value: string }>[];
}>) {
  return (
    <div className="border-t border-dashed border-black/15 pt-3">
      <h4 className="text-base font-semibold tracking-tight">{title}</h4>
      <div className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-dashed border-black/15 pb-2"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono font-semibold tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SnapshotSignalList({
  title,
  rows,
}: Readonly<{
  title: string;
  rows: readonly ReactNode[];
}>) {
  return (
    <div className="space-y-2 border-t border-dashed border-black/15 pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <div className="space-y-1.5 text-sm text-foreground/90">
        {rows.map((row, index) => (
          <div key={index} className="flex items-start gap-2">
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}

function EarningsSummarySection() {
  return (
    <ReportSection id="sekcja-earnings" title="Konferencja wynikowa Q4 2025">
      <div className="space-y-4">
        {EARNINGS_CALL_BLOCKS.map((block, index) => (
          <article
            key={block.title}
            className="border-b border-dashed border-black/15 pb-3 last:border-b-0 last:pb-0"
          >
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

function SummaryStartSection() {
  return (
    <ReportSection id="sekcja-snapshot" title="Snapshot">
      <ReportCard contentClassName="space-y-5 p-6 lg:p-8">
        <div className="max-w-3xl border-b border-dashed border-[color:var(--report-rule)]/20 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Teza w 1 zdaniu
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/90">
            To nadal biznes wysokiej jakosci z mocnym cash flow, ale obecna wycena
            wymaga, zeby AI i capex zaczely wracac w realnym wzroscie, nie tylko w
            obietnicy.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            <SnapshotSignalList
              title="Mocne strony"
              rows={[
                <>
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-700/80"
                    aria-hidden
                  />
                  <span>
                    Core reklamowy dalej daje skale i marze, ktore trudno szybko
                    podrobic.
                  </span>
                </>,
                <>
                  <ArrowUpRight
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-700/80"
                    aria-hidden
                  />
                  <span>
                    Gotowka z operacji daje komfort inwestowania bez natychmiastowej
                    presji na bilans.
                  </span>
                </>,
              ]}
            />

            <SnapshotSignalList
              title="Ryzyka"
              rows={[
                <>
                  <AlertTriangle
                    className="mt-0.5 size-3.5 shrink-0 text-rose-700/80"
                    aria-hidden
                  />
                  <span>
                    Koszt AI i infrastruktury rosnie szybciej, niz latwo go obronic w
                    jednym czy dwoch raportach.
                  </span>
                </>,
                <>
                  <ArrowDownRight
                    className="mt-0.5 size-3.5 shrink-0 text-rose-700/80"
                    aria-hidden
                  />
                  <span>
                    Przy takiej wycenie nawet lekkie spowolnienie reklam albo slabsza
                    monetyzacja nowych produktow boli mocniej.
                  </span>
                </>,
              ]}
            />
          </div>

          <aside className="space-y-3 rounded-sm border border-black/10 bg-[rgba(250,248,244,0.55)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              Na co patrzec teraz
            </p>
            <div className="space-y-2.5 text-sm text-foreground/90">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/75" aria-hidden />
                <span>
                  Czy przychody i EPS dalej rosna mimo wyzszego kosztu infrastruktury.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/75" aria-hidden />
                <span>
                  Czy nowe inwestycje zaczynaja poprawiac monetyzacje, a nie tylko
                  podbijac capex.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </ReportCard>
    </ReportSection>
  );
}

export function StockReportAdvancedSection() {
  return (
    <ReportSection id="sekcja-zaawansowane" title="Dalsza analiza">
      <ReportCard contentClassName="space-y-8 p-6">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            Zarzad i wyniki
          </p>
          <div className="space-y-6">
            <StockReportLeadershipSection />
            <EarningsSummarySection />
          </div>
        </div>

        <div className="space-y-3 border-t border-dashed border-[color:var(--report-rule)]/20 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            Trend i rozbicia
          </p>
          <div className="space-y-6">
            <StockReportFiveYearTrendAnalysisSection />
            <StockReportConceptSectionsLazy />
            <DeepDivesSection />
          </div>
        </div>
      </ReportCard>
    </ReportSection>
  );
}

export { SummaryStartSection };
