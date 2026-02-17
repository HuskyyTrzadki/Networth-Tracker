import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { AddTransactionDialogStandaloneRoute } from "@/features/transactions";
import { getAssetBalancesByPortfolio } from "@/features/transactions/server/get-asset-balances";
import { resolvePortfolioSelection } from "@/features/transactions/server/resolve-portfolio-selection";
import { getCashBalancesByPortfolio } from "@/features/transactions/server/get-cash-balances";
import { buildCashInstrument, isSupportedCashCurrency } from "@/features/transactions/lib/system-currencies";
import { createClient } from "@/lib/supabase/server";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const resolveDialogPreset = (
  preset: string | null,
  fallbackCurrency: string | null
) => {
  if (preset !== "cash-deposit") {
    return {
      initialInstrument: undefined,
      initialValues: undefined,
    } as const;
  }

  const cashCurrency =
    fallbackCurrency && isSupportedCashCurrency(fallbackCurrency)
      ? fallbackCurrency
      : "PLN";

  return {
    initialInstrument: buildCashInstrument(cashCurrency),
    initialValues: {
      type: "BUY",
      cashflowType: "DEPOSIT",
      quantity: "1",
      price: "1",
      fee: "0",
    },
  } as const;
};

export const metadata: Metadata = {
  title: "Dodaj transakcję",
};

export default async function TransactionNewPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby dodać transakcję.
        </div>
        <Button asChild className="mt-4 h-11">
          <Link
            href={{
              pathname: "/login",
              query: { next: "/transactions/new" },
            }}
          >
            Zaloguj się
          </Link>
        </Button>
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
    redirect("/onboarding");
  }

  const selection = resolvePortfolioSelection({
    searchParams: params,
    portfolios: portfolioOptions,
  });
  const preset = getFirstParam(params.preset)?.trim() ?? null;
  const selectedPortfolio =
    portfolioOptions.find((portfolio) => portfolio.id === selection.initialPortfolioId) ??
    null;
  const dialogPreset = resolveDialogPreset(
    preset,
    selectedPortfolio?.baseCurrency ?? null
  );

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
      initialInstrument={dialogPreset.initialInstrument}
      initialValues={dialogPreset.initialValues}
    />
  );
}
