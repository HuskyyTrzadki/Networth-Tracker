import { cn } from "@/lib/cn";
import { addDecimals, decimalZero, parseDecimalString } from "@/lib/decimal";
import { AnimatedReveal } from "@/features/design-system";
import { Alert } from "@/features/design-system/components/ui/alert";
import { AlertTriangle } from "lucide-react";

import type { PolishCpiPoint } from "@/features/market-data";
import type { DashboardBenchmarkSeries } from "./lib/benchmark-config";
import type { PortfolioSummary } from "../server/valuation";
import type { LiveTotalsResult } from "../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../server/snapshots/types";
import type { TransactionListItem } from "@/features/transactions/server/list-transactions";
import { PortfolioSwitcher } from "../components/PortfolioSwitcher";
import { PortfolioDashboardClientWidgets } from "./PortfolioDashboardClientWidgets";
import { PortfolioNetValueHero } from "./PortfolioNetValueHero";
import type { PortfolioAllocationDonutCard } from "../server/get-portfolio-allocation-donut-cards";
import type { DividendInboxResult } from "../lib/dividend-inbox";
import { DividendInboxWidget } from "./widgets/DividendInboxWidget";
import { PortfolioRecentTransactionsWidget } from "./widgets/PortfolioRecentTransactionsWidget";

type Props = Readonly<{
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
  }[];
  selectedPortfolioId: string | null;
  summary: PortfolioSummary;
  snapshotRows: Readonly<{
    hasSnapshots: boolean;
    includesFullHistory: boolean;
    rows: readonly SnapshotChartRow[];
  }>;
  liveTotals: LiveTotalsResult;
  polishCpiSeries: readonly PolishCpiPoint[];
  benchmarkSeries: DashboardBenchmarkSeries;
  recentTransactions: readonly TransactionListItem[];
  portfolioAllocationDonutCards: readonly PortfolioAllocationDonutCard[];
  dividendInbox: DividendInboxResult;
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
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  recentTransactions,
  portfolioAllocationDonutCards,
  dividendInbox,
  className,
}: Props) {
  const selectedPortfolioName = selectedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === selectedPortfolioId)?.name ?? "—"
    : "Wszystkie portfele";

  const portfolioLabel = selectedPortfolioId
    ? `Portfel: ${selectedPortfolioName}`
    : "Portfel: Wszystkie portfele";
  const dailyChangeBase = resolveDailyChangeBase(summary.holdings);

  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-6", className)}>
      <AnimatedReveal>
        <PortfolioNetValueHero
          portfolioLabel={portfolioLabel}
          baseCurrency={summary.baseCurrency}
          totalValueBase={summary.totalValueBase}
          dailyChangeBase={dailyChangeBase}
          isPartial={summary.isPartial}
        />
      </AnimatedReveal>
      {summary.isPartial ? (
        <AnimatedReveal delay={0.03}>
          <Alert className="flex items-start gap-2 rounded-sm border border-border/70 border-l-[3px] border-l-[color:var(--chart-3)] bg-muted/18 px-3 py-2 text-foreground shadow-sm">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-[color:var(--chart-3)]"
              aria-hidden
            />
            <p className="text-sm text-foreground/90">
              Dane wyceny są częściowe: brak cen dla {summary.missingQuotes} pozycji
              i brak FX dla {summary.missingFx}. Wyniki mogą być zaniżone.
            </p>
          </Alert>
        </AnimatedReveal>
      ) : null}
      {selectedPortfolioId === null ? (
        <AnimatedReveal className="hidden md:block" delay={0.04}>
          <div className="inline-flex rounded-lg border border-border/85 bg-card px-2.5 py-3">
            <PortfolioSwitcher
              className="sm:gap-2.5"
              portfolios={portfolios}
              selectedId={selectedPortfolioId}
            />
          </div>
        </AnimatedReveal>
      ) : null}
      <AnimatedReveal delay={0.06}>
        <div className="space-y-6">
          <PortfolioDashboardClientWidgets
            selectedPortfolioId={selectedPortfolioId}
            summary={summary}
            snapshotRows={snapshotRows}
            liveTotals={liveTotals}
            polishCpiSeries={polishCpiSeries}
            benchmarkSeries={benchmarkSeries}
            portfolioAllocationDonutCards={portfolioAllocationDonutCards}
          />
          <PortfolioRecentTransactionsWidget
            selectedPortfolioId={selectedPortfolioId}
            items={recentTransactions}
          />
          <DividendInboxWidget data={dividendInbox} selectedPortfolioId={selectedPortfolioId} />
        </div>
      </AnimatedReveal>
    </div>
  );
}
