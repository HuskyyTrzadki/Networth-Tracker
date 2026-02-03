import { cookies } from "next/headers";

import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { AddTransactionDialogRoute } from "@/features/transactions";
import { resolvePortfolioSelection } from "@/features/transactions/server/resolve-portfolio-selection";
import { getCashBalancesByPortfolio } from "@/features/transactions/server/get-cash-balances";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function AddTransactionModalPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  const portfolios = await listPortfolios(supabase);
  const portfolioOptions = portfolios.map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
  }));

  if (portfolioOptions.length === 0) {
    return null;
  }

  const selection = resolvePortfolioSelection({
    searchParams: params,
    portfolios: portfolioOptions,
  });

  const cashBalancesByPortfolio = await getCashBalancesByPortfolio(
    supabase,
    portfolioOptions.map((portfolio) => portfolio.id)
  );

  return (
    <AddTransactionDialogRoute
      portfolios={portfolioOptions}
      cashBalancesByPortfolio={cashBalancesByPortfolio}
      initialPortfolioId={selection.initialPortfolioId}
      forcedPortfolioId={selection.forcedPortfolioId}
    />
  );
}
