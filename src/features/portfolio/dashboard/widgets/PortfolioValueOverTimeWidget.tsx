import { ChartCard } from "@/features/design-system";
import type { PolishCpiPoint } from "@/features/market-data";
import type { SnapshotScope } from "../../server/snapshots/types";
import type { LiveTotalsResult } from "../../server/get-portfolio-live-totals";
import type { SnapshotChartRow } from "../../server/snapshots/types";
import { PortfolioValueOverTimeChart } from "./PortfolioValueOverTimeChart";

type Props = Readonly<{
  selectedPortfolioId: string | null;
  hasHoldings: boolean;
  hasSnapshots: boolean;
  rows: readonly SnapshotChartRow[];
  liveTotals: LiveTotalsResult;
  polishCpiSeries: readonly PolishCpiPoint[];
}>;

export async function PortfolioValueOverTimeWidget({
  selectedPortfolioId,
  hasHoldings,
  hasSnapshots,
  rows,
  liveTotals,
  polishCpiSeries,
}: Props) {
  const scope: SnapshotScope = selectedPortfolioId ? "PORTFOLIO" : "ALL";

  return (
    <ChartCard
      title="Wartość i performance"
      subtitle="Na podstawie dziennych snapshotów"
      className="min-h-[320px]"
    >
      <PortfolioValueOverTimeChart
        scope={scope}
        portfolioId={selectedPortfolioId}
        hasHoldings={hasHoldings}
        hasSnapshots={hasSnapshots}
        rows={rows}
        todayBucketDate={liveTotals.todayBucketDate}
        liveTotalsByCurrency={liveTotals.totalsByCurrency}
        polishCpiSeries={polishCpiSeries}
      />
    </ChartCard>
  );
}
