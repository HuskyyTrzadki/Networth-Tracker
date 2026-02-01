import { ChartCard } from "@/features/design-system";
import type { SnapshotScope } from "../../server/snapshots/types";
import type { SnapshotSeries } from "../../server/snapshots/types";
import { PortfolioValueOverTimeChart } from "./PortfolioValueOverTimeChart";

type Props = Readonly<{
  selectedPortfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
  seriesByCurrency: Readonly<Record<"PLN" | "USD" | "EUR", SnapshotSeries>>;
  days: number;
}>;

export async function PortfolioValueOverTimeWidget({
  selectedPortfolioId,
  hasHoldings,
  hasSnapshots,
  seriesByCurrency,
  days,
}: Props) {
  const scope: SnapshotScope = selectedPortfolioId ? "PORTFOLIO" : "ALL";

  return (
    <ChartCard
      title="Wartość portfela"
      subtitle={`Ostatnie ${days} dni`}
      className="min-h-[320px]"
    >
      <PortfolioValueOverTimeChart
        scope={scope}
        portfolioId={selectedPortfolioId}
        hasHoldings={hasHoldings}
        hasSnapshots={hasSnapshots}
        seriesByCurrency={seriesByCurrency}
      />
    </ChartCard>
  );
}
