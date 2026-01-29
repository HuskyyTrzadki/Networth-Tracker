import { cookies } from "next/headers";

import {
  DashboardEmptyState,
  PortfolioDashboard,
} from "@/features/portfolio";
import { getPortfolioSummary } from "@/features/portfolio/server/get-portfolio-summary";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  userId: string;
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  selectedPortfolioId: string | null;
  baseCurrency: string;
}>;

export default async function PortfolioDashboardSection({
  userId,
  portfolios,
  selectedPortfolioId,
  baseCurrency,
}: Props) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const summary = await getPortfolioSummary(supabase, userId, {
    portfolioId: selectedPortfolioId,
    baseCurrency,
  });

  if (summary.holdings.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <DashboardEmptyState
          title="Twój portfel jest pusty."
          subtitle="Dodaj swoje pierwsze aktywo, aby zobaczyć analizę."
          primaryAction={{
            label: "Dodaj transakcję",
            href: selectedPortfolioId
              ? `/transactions/new?portfolio=${selectedPortfolioId}`
              : "/transactions/new",
          }}
          secondaryAction={{
            label: "Importuj CSV",
            href: "/transactions/import",
          }}
        />
      </div>
    );
  }

  return (
    <PortfolioDashboard
      portfolios={portfolios}
      selectedPortfolioId={selectedPortfolioId}
      summary={summary}
    />
  );
}
