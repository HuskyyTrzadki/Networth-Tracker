import { cn } from "@/lib/cn";

import type { PolishCpiPoint } from "@/features/market-data";
import type { PortfolioSummary } from "../server/valuation";
import type { LiveTotalsResult } from "../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../server/snapshots/types";
import { PortfolioSwitcher } from "../components/PortfolioSwitcher";
import { AllocationWidget } from "./widgets/AllocationWidget";
import { HoldingsWidget } from "./widgets/HoldingsWidget";
import { PortfolioValueOverTimeWidget } from "./widgets/PortfolioValueOverTimeWidget";

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
    rows: readonly SnapshotChartRow[];
  }>;
  liveTotals: LiveTotalsResult;
  polishCpiSeries: readonly PolishCpiPoint[];
  className?: string;
}>;

export function PortfolioDashboard({
  portfolios,
  selectedPortfolioId,
  summary,
  snapshotRows,
  liveTotals,
  polishCpiSeries,
  className,
}: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="hidden md:block">
        <PortfolioSwitcher
          portfolios={portfolios}
          selectedId={selectedPortfolioId}
        />
      </div>
      <PortfolioValueOverTimeWidget
        selectedPortfolioId={selectedPortfolioId}
        hasHoldings={summary.holdings.length > 0}
        hasSnapshots={snapshotRows.hasSnapshots}
        rows={snapshotRows.rows}
        liveTotals={liveTotals}
        polishCpiSeries={polishCpiSeries}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <AllocationWidget summary={summary} />
        <HoldingsWidget summary={summary} />
      </div>
    </div>
  );
}
