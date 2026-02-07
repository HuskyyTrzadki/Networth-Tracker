import { cookies } from "next/headers";
import { Suspense } from "react";

import { PortfolioMobileHeaderActions } from "@/features/portfolio";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { createClient } from "@/lib/supabase/server";
import PortfolioDashboardSection from "./PortfolioDashboardSection";
import { PortfolioDashboardSkeleton } from "./PortfolioDashboardSkeleton";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parsePortfolioId = (
  searchParams: Readonly<Record<string, string | string[] | undefined>>
) => {
  const raw = getFirstParam(searchParams.portfolio)?.trim();
  if (!raw || raw === "all") return null;
  return raw;
};

export const metadata = {
  title: "Portfele",
};

export default async function PortfolioPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedPortfolioId = parsePortfolioId(params);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Server-side: resolve the user from cookies so RLS filters portfolios correctly.
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Portfele</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby zobaczyć portfel.
        </div>
      </main>
    );
  }

  const portfolios = await listPortfolios(supabase);
  const selectedPortfolio = selectedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null
    : null;

  const baseCurrency = selectedPortfolio?.baseCurrency ?? "PLN";
  const subtitle = selectedPortfolio
    ? `Portfel: ${selectedPortfolio.name}`
    : "Wszystkie portfele";

  return (
    <main className="flex min-h-[calc(100vh-120px)] flex-col px-6 py-8">
      <header className="flex flex-col gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Portfele</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {selectedPortfolioId === null ? (
          <div className="md:hidden">
            <PortfolioMobileHeaderActions
              portfolios={portfolios}
              selectedId={selectedPortfolioId}
            />
          </div>
        ) : null}
      </header>
      <section className="mt-6">
        <Suspense fallback={<PortfolioDashboardSkeleton />}>
          <PortfolioDashboardSection
            baseCurrency={baseCurrency}
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
          />
        </Suspense>
      </section>
    </main>
  );
}
