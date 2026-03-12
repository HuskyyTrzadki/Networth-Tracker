import { cn } from "@/lib/cn";
import { addDecimals, decimalZero, parseDecimalString } from "@/lib/decimal";
import { AnimatedReveal } from "@/features/design-system/components/AnimatedReveal";

import type { PolishCpiPoint } from "@/features/market-data";
import type { DashboardBenchmarkSeries } from "./lib/benchmark-config";
import type { PortfolioSummary } from "../server/valuation";
import type { LiveTotalsResult } from "../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../server/snapshots/types";
import { PortfolioSwitcher } from "../components/PortfolioSwitcher";
import { PortfolioDashboardClientWidgets } from "./PortfolioDashboardClientWidgets";
import { PortfolioNetValueHero } from "./PortfolioNetValueHero";
import { formatDashboardAsOf } from "./dashboard-formatters";

type Props = Readonly<{
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
    isDemo: boolean;
  }[];
  selectedPortfolioId: string | null;
  addTransactionHref: string;
  summary: PortfolioSummary;
  snapshotRows: Readonly<{
    hasSnapshots: boolean;
    includesFullHistory: boolean;
    rows: readonly SnapshotChartRow[];
  }>;
  liveTotals: LiveTotalsResult;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeries: DashboardBenchmarkSeries;
  allocationsByPortfolioWidget?: React.ReactNode;
  secondaryWidgets?: React.ReactNode;
  className?: string;
}>;

const resolveDailyChangeBase = (
  holdings: readonly { todayChangeBase?: string | null }[]
) => {
  let total = decimalZero();
  let hasChange = false;

  holdings.forEach((holding) => {
    const parsed = parseDecimalString(holding.todayChangeBase);
    if (!parsed) return;
    total = addDecimals(total, parsed);
    hasChange = true;
  });

  return hasChange ? total.toString() : null;
};

export function PortfolioDashboard({
  portfolios,
  selectedPortfolioId,
  addTransactionHref,
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  allocationsByPortfolioWidget,
  secondaryWidgets,
  className,
}: Props) {
  const selectedPortfolioName = selectedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === selectedPortfolioId)?.name ?? "—"
    : "Wszystkie portfele";
  const isDemo =
    selectedPortfolioId === null
      ? false
      : (portfolios.find((portfolio) => portfolio.id === selectedPortfolioId)?.isDemo ?? false);

  const portfolioLabel = selectedPortfolioName;
  const dailyChangeBase = resolveDailyChangeBase(summary.holdings);
  const asOfLabel = summary.asOf ? formatDashboardAsOf(summary.asOf) : null;
  const valuationSummary = summary.isPartial
    ? `Dane częściowe: brak cen dla ${summary.missingQuotes} pozycji i FX dla ${summary.missingFx}.`
    : "Dane kompletne dla bieżącego widoku.";

  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-5", className)}>
      <AnimatedReveal>
        <PortfolioNetValueHero
          addTransactionHref={addTransactionHref}
          asOf={asOfLabel}
          portfolioLabel={portfolioLabel}
          isDemo={isDemo}
          baseCurrency={summary.baseCurrency}
          totalValueBase={summary.totalValueBase}
          dailyChangeBase={dailyChangeBase}
          valuationSummary={valuationSummary}
          valuationTone={summary.isPartial ? "warning" : "positive"}
          portfolioSwitcher={
            selectedPortfolioId === null ? (
              <PortfolioSwitcher
                className="sm:gap-2.5"
                portfolios={portfolios}
                selectedId={selectedPortfolioId}
              />
            ) : null
          }
        />
      </AnimatedReveal>
      <AnimatedReveal delay={0.06}>
        <div className="space-y-6">
          <PortfolioDashboardClientWidgets
            selectedPortfolioId={selectedPortfolioId}
            summary={summary}
            snapshotRows={snapshotRows}
            liveTotals={liveTotals}
            polishCpiSeries={polishCpiSeries}
            benchmarkSeries={benchmarkSeries}
          />
          {allocationsByPortfolioWidget}
          {secondaryWidgets}
        </div>
      </AnimatedReveal>
    </div>
  );
}
