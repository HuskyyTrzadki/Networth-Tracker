import Link from "next/link";
import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";

import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system";
import { createClient } from "@/lib/supabase/server";
import {
  TransactionsEmptyState,
  TransactionsSearchToolbar,
  TransactionsPagination,
  TransactionsTable,
} from "@/features/transactions";
import { parseTransactionsFilters } from "@/features/transactions/server/filters";
import { listTransactions } from "@/features/transactions/server/list-transactions";
import { listPortfolios } from "@/features/portfolio/server/list-portfolios";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export const metadata = {
  title: "Transakcje",
};

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseTransactionsFilters(params);
  const pageData = await getTransactionsPageDataCached(filters);

  if (!pageData.isAuthenticated) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby zobaczyć historię transakcji.
        </div>
      </main>
    );
  }

  const transactionCreateHref = filters.portfolioId
    ? `/transactions/new?portfolio=${filters.portfolioId}`
    : "/transactions/new";

  return (
    <main className="px-5 py-6 sm:px-6 sm:py-8">
      <AnimatedReveal>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Historia transakcji
          </h1>
          <p className="text-sm text-muted-foreground">
            Przeglądaj i filtruj swoje operacje w portfelu.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={transactionCreateHref}>Dodaj transakcję</Link>
        </Button>
        </header>
      </AnimatedReveal>

      <AnimatedReveal className="mt-6" delay={0.05}>
        <TransactionsSearchToolbar
          key={`${filters.query ?? ""}:${filters.type ?? "all"}:${
            filters.sort
          }:${filters.portfolioId ?? "all"}`}
          portfolios={pageData.portfolios}
          query={filters.query}
          selectedPortfolioId={filters.portfolioId}
          sort={filters.sort}
          type={filters.type}
        />
      </AnimatedReveal>

      <AnimatedReveal className="mt-4" delay={0.08}>
        {pageData.transactionsPage.items.length > 0 ? (
          <TransactionsTable items={pageData.transactionsPage.items} />
        ) : (
          <TransactionsEmptyState query={filters.query} />
        )}
      </AnimatedReveal>

      <AnimatedReveal delay={0.1}>
        <TransactionsPagination
          filters={filters}
          hasNextPage={pageData.transactionsPage.hasNextPage}
        />
      </AnimatedReveal>
    </main>
  );
}

type TransactionsPageData = Readonly<{
  isAuthenticated: boolean;
  portfolios: Awaited<ReturnType<typeof listPortfolios>>;
  transactionsPage: Awaited<ReturnType<typeof listTransactions>>;
}>;

const getTransactionsPageDataCached = async (
  filters: ReturnType<typeof parseTransactionsFilters>
): Promise<TransactionsPageData> => {
  "use cache: private";

  // Transactions list is frequently revisited with nearby filters.
  cacheLife("minutes");
  cacheTag("transactions:all");
  cacheTag("portfolio:all");
  if (filters.portfolioId) {
    cacheTag(`transactions:portfolio:${filters.portfolioId}`);
    cacheTag(`portfolio:${filters.portfolioId}`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return {
      isAuthenticated: false,
      portfolios: [],
      transactionsPage: {
        items: [],
        page: filters.page,
        pageSize: filters.pageSize,
        hasNextPage: false,
      },
    };
  }

  const [transactionsPage, portfolios] = await Promise.all([
    listTransactions(supabase, filters),
    listPortfolios(supabase),
  ]);

  return {
    isAuthenticated: true,
    portfolios,
    transactionsPage,
  };
};
