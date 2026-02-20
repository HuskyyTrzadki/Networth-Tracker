import { cn } from "@/lib/cn";
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
  className?: string;
}>;

export function PortfolioDashboard({
  portfolios,
  selectedPortfolioId,
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  benchmarkSeries,
  recentTransactions,
  className,
}: Props) {
  const selectedPortfolioName = selectedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === selectedPortfolioId)?.name ?? "—"
    : "Wszystkie portfele";

  const portfolioLabel = selectedPortfolioId
    ? `Portfel: ${selectedPortfolioName}`
    : "Portfel: Wszystkie portfele";

  return (
    <div className={cn("space-y-6", className)}>
      <AnimatedReveal>
        <PortfolioNetValueHero
          portfolioLabel={portfolioLabel}
          baseCurrency={summary.baseCurrency}
          totalValueBase={summary.totalValueBase}
          isPartial={summary.isPartial}
          asOf={summary.asOf}
        />
      </AnimatedReveal>
      {summary.isPartial ? (
        <AnimatedReveal delay={0.03}>
          <Alert className="flex items-start gap-2 rounded-sm border-0 border-l-4 border-l-amber-500 bg-amber-50 px-3 py-2 text-amber-900 shadow-sm dark:border-l-amber-400 dark:bg-amber-500/12 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="text-sm">
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
        <PortfolioDashboardClientWidgets
          selectedPortfolioId={selectedPortfolioId}
          summary={summary}
          snapshotRows={snapshotRows}
          liveTotals={liveTotals}
          polishCpiSeries={polishCpiSeries}
          benchmarkSeries={benchmarkSeries}
          recentTransactions={recentTransactions}
        />
      </AnimatedReveal>
    </div>
  );
}
