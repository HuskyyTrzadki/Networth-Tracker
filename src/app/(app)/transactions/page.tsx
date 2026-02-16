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

type FilterChip = Readonly<{
  key: string;
  label: string;
  href: string;
}>;

const buildTransactionsUrl = (params: URLSearchParams) => {
  const queryString = params.toString();
  return queryString.length > 0 ? `/transactions?${queryString}` : "/transactions";
};

const buildClearSearchHref = (
  filters: ReturnType<typeof parseTransactionsFilters>
) => {
  const params = new URLSearchParams();
  if (filters.type) {
    params.set("type", filters.type);
  }
  if (filters.sort !== "date_desc") {
    params.set("sort", filters.sort);
  }
  if (filters.portfolioId) {
    params.set("portfolio", filters.portfolioId);
  }
  return buildTransactionsUrl(params);
};

const buildActiveFilterChips = (
  filters: ReturnType<typeof parseTransactionsFilters>,
  portfolios: readonly { id: string; name: string; baseCurrency: string }[]
): readonly FilterChip[] => {
  const chips: FilterChip[] = [];
  const withUpdates = (updates: Readonly<Record<string, string | null>>) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.type) params.set("type", filters.type);
    if (filters.sort !== "date_desc") params.set("sort", filters.sort);
    if (filters.portfolioId) params.set("portfolio", filters.portfolioId);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
        return;
      }
      params.set(key, value);
    });

    return buildTransactionsUrl(params);
  };

  if (filters.query) {
    chips.push({
      key: "q",
      label: `Szukaj: ${filters.query}`,
      href: withUpdates({ q: null }),
    });
  }
  if (filters.type) {
    chips.push({
      key: "type",
      label: `Typ: ${filters.type === "BUY" ? "Kupno" : "Sprzedaż"}`,
      href: withUpdates({ type: null }),
    });
  }
  if (filters.sort !== "date_desc") {
    chips.push({
      key: "sort",
      label: "Sortowanie: Najstarsze",
      href: withUpdates({ sort: null }),
    });
  }
  if (filters.portfolioId) {
    const portfolioName =
      portfolios.find((portfolio) => portfolio.id === filters.portfolioId)?.name ??
      filters.portfolioId;
    chips.push({
      key: "portfolio",
      label: `Portfel: ${portfolioName}`,
      href: withUpdates({ portfolio: null }),
    });
  }

  return chips;
};

export const metadata = {
  title: "Transakcje",
};

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseTransactionsFilters(params);
  const pageData = await getTransactionsPageDataCached(filters);

  if (!pageData.isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby zobaczyć historię transakcji.
        </div>
        <Button asChild className="mt-4 h-11">
          <Link
            href={{
              pathname: "/login",
              query: { next: "/transactions" },
            }}
          >
            Zaloguj się
          </Link>
        </Button>
      </main>
    );
  }

  const transactionCreateHref = filters.portfolioId
    ? `/transactions/new?portfolio=${filters.portfolioId}`
    : "/transactions/new";
  const clearSearchHref = buildClearSearchHref(filters);
  const activeFilterChips = buildActiveFilterChips(filters, pageData.portfolios);

  return (
    <main className="mx-auto w-full max-w-[1560px] px-5 py-6 sm:px-6 sm:py-8">
      <AnimatedReveal>
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
              Rejestr
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Historia transakcji
            </h1>
            <p className="text-sm text-muted-foreground">
              Przeglądaj i filtruj swoje operacje w portfelu.
            </p>
          </div>
          <Button asChild size="lg" className="md:min-w-44">
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
      {activeFilterChips.length > 0 ? (
        <AnimatedReveal className="mt-3" delay={0.06}>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2">
            {activeFilterChips.map((chip) => (
              <Button
                asChild
                className="h-8 rounded-md px-2.5 text-xs"
                key={chip.key}
                size="sm"
                variant="outline"
              >
                <Link href={chip.href} scroll={false}>
                  {chip.label} ×
                </Link>
              </Button>
            ))}
            <Button asChild className="h-8 px-2.5 text-xs" size="sm" variant="ghost">
              <Link href="/transactions" scroll={false}>
                Wyczyść wszystko
              </Link>
            </Button>
          </div>
        </AnimatedReveal>
      ) : null}

      <AnimatedReveal className="mt-4" delay={0.08}>
        {pageData.transactionsPage.items.length > 0 ? (
          <TransactionsTable items={pageData.transactionsPage.items} />
        ) : (
          <TransactionsEmptyState
            addTransactionHref={transactionCreateHref}
            clearSearchHref={clearSearchHref}
            query={filters.query}
          />
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
