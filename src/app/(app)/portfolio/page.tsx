import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system";
import {
  PortfolioDashboardSkeleton,
  PortfolioMobileHeaderActions,
} from "@/features/portfolio";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";
import { createClient } from "@/lib/supabase/server";
import PortfolioDashboardSection from "./PortfolioDashboardSection";

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

  if (!getFirstParam(params.portfolio)?.trim()) {
    const nextParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "portfolio") return;
      const first = getFirstParam(value);
      if (first && first.trim().length > 0) {
        nextParams.set(key, first);
      }
    });
    nextParams.set("portfolio", "all");
    redirect(`/portfolio?${nextParams.toString()}`);
  }

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
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1560px] flex-col px-5 py-6 sm:px-6 sm:py-8">
      <AnimatedReveal>
        <header className="flex flex-col gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Portfele</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild size="lg" className="w-full md:w-auto md:self-start">
          <Link
            href={
              selectedPortfolioId
                ? `/transactions/new?portfolio=${selectedPortfolioId}`
                : "/transactions/new"
            }
          >
            Dodaj transakcję
          </Link>
        </Button>
        {selectedPortfolioId === null ? (
          <div className="md:hidden">
            <PortfolioMobileHeaderActions
              portfolios={portfolios}
              selectedId={selectedPortfolioId}
            />
          </div>
        ) : null}
        </header>
      </AnimatedReveal>
      <AnimatedReveal className="mt-6" delay={0.05}>
        <Suspense fallback={<PortfolioDashboardSkeleton />}>
          <PortfolioDashboardSection
            baseCurrency={baseCurrency}
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
          />
        </Suspense>
      </AnimatedReveal>
    </main>
  );
}
