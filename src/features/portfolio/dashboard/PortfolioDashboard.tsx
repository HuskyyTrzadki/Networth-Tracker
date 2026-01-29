import { cn } from "@/lib/cn";

import type { PortfolioSummary } from "../server/valuation";
import { PortfolioSwitcher } from "../components/PortfolioSwitcher";
import { HoldingsWidget } from "./widgets/HoldingsWidget";
import { TotalValueWidget } from "./widgets/TotalValueWidget";

type Props = Readonly<{
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
  }[];
  selectedPortfolioId: string | null;
  summary: PortfolioSummary;
  className?: string;
}>;

export function PortfolioDashboard({
  portfolios,
  selectedPortfolioId,
  summary,
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
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <TotalValueWidget summary={summary} />
        <HoldingsWidget summary={summary} />
      </div>
    </div>
  );
}
