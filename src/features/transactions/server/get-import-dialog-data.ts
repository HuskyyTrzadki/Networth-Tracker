import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

import { resolvePortfolioSelection } from "./resolve-portfolio-selection";

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

type Result =
  | Readonly<{ status: "unauthenticated" }>
  | Readonly<{ status: "empty" }>
  | Readonly<{
      status: "ready";
      portfolios: readonly { id: string; name: string; baseCurrency: string }[];
      initialPortfolioId: string;
      forcedPortfolioId: string | null;
    }>;

export async function getImportDialogData(
  searchParams: SearchParams
): Promise<Result> {
  const pageData = await getUserPortfoliosPrivateCached();
  if (!pageData.isAuthenticated) {
    return { status: "unauthenticated" };
  }

  const portfolios = pageData.portfolios.map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
  }));

  if (portfolios.length === 0) {
    return { status: "empty" };
  }

  const selection = resolvePortfolioSelection({
    searchParams,
    portfolios,
  });

  return {
    status: "ready",
    portfolios,
    initialPortfolioId: selection.initialPortfolioId,
    forcedPortfolioId: selection.forcedPortfolioId,
  };
}
