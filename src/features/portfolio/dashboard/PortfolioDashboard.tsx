import { cn } from "@/lib/cn";

import type { SnapshotSeries } from "../server/snapshots/types";
import type { PortfolioSummary } from "../server/valuation";
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
  snapshotSeries: Readonly<{
    hasSnapshots: boolean;
    seriesByCurrency: Readonly<Record<"PLN" | "USD" | "EUR", SnapshotSeries>>;
  }>;
  className?: string;
}>;

export function PortfolioDashboard({
  portfolios,
  selectedPortfolioId,
  summary,
  snapshotSeries,
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
        hasSnapshots={snapshotSeries.hasSnapshots}
        seriesByCurrency={snapshotSeries.seriesByCurrency}
        days={30}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <AllocationWidget summary={summary} />
        <HoldingsWidget summary={summary} />
      </div>
    </div>
  );
}
