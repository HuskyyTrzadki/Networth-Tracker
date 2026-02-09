import { cookies } from "next/headers";

import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { AddTransactionDialogStandaloneRoute } from "@/features/transactions";
import { getAssetBalancesByPortfolio } from "@/features/transactions/server/get-asset-balances";
import { resolvePortfolioSelection } from "@/features/transactions/server/resolve-portfolio-selection";
import { getCashBalancesByPortfolio } from "@/features/transactions/server/get-cash-balances";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export const metadata = {
  title: "Dodaj transakcję",
};

export default async function TransactionNewPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby dodać transakcję.
        </div>
      </main>
    );
  }

  const portfolios = await listPortfolios(supabase);
  const portfolioOptions = portfolios.map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
  }));

  if (portfolioOptions.length === 0) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Brak portfeli do przypisania transakcji.
        </div>
      </main>
    );
  }

  const selection = resolvePortfolioSelection({
    searchParams: params,
    portfolios: portfolioOptions,
  });

  const portfolioIds = portfolioOptions.map((portfolio) => portfolio.id);
  const [cashBalancesByPortfolio, assetBalancesByPortfolio] = await Promise.all([
    getCashBalancesByPortfolio(supabase, portfolioIds),
    getAssetBalancesByPortfolio(supabase, portfolioIds),
  ]);

  return (
    <AddTransactionDialogStandaloneRoute
      portfolios={portfolioOptions}
      cashBalancesByPortfolio={cashBalancesByPortfolio}
      assetBalancesByPortfolio={assetBalancesByPortfolio}
      initialPortfolioId={selection.initialPortfolioId}
      forcedPortfolioId={selection.forcedPortfolioId}
    />
  );
}
