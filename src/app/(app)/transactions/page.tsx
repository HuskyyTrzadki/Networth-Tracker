import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";
import { Button } from "@/features/design-system/components/ui/button";
import { AnimatedReveal } from "@/features/design-system/components/AnimatedReveal";
import { createClient } from "@/lib/supabase/server";
import { TransactionsEmptyState } from "@/features/transactions/components/TransactionsEmptyState";
import { TransactionsSearchToolbar } from "@/features/transactions/components/TransactionsSearchToolbar";
import { TransactionsPagination } from "@/features/transactions/components/TransactionsPagination";
import { TransactionsTable } from "@/features/transactions/components/TransactionsTable";
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

export const metadata: Metadata = {
  title: "Transakcje",
};

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseTransactionsFilters(params);
  const pageData = await getTransactionsPageDataCached(filters);

  if (!pageData.isAuthenticated) {
    return (
      <main className={`mx-auto w-full px-6 py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}>
        <section className="max-w-[720px] rounded-xl border border-border/75 bg-card/94 p-6 shadow-[var(--surface-shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
            Dostęp wymagany
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Transakcje</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Zaloguj się, aby zobaczyć historię transakcji i operacji gotówkowych.
          </p>
          <Button asChild className="mt-5 h-11">
            <Link
              href={{
                pathname: "/login",
                query: { next: "/transactions" },
              }}
            >
              Zaloguj się
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  const transactionCreateHref = filters.portfolioId
    ? `/transactions/new?portfolio=${filters.portfolioId}`
    : "/transactions/new";
  const clearSearchHref = buildClearSearchHref(filters);
  const activeFilterChips = buildActiveFilterChips(filters, pageData.portfolios);
  const sortSummary =
    filters.sort === "date_desc" ? "Najnowsze" : "Najstarsze";

  return (
    <main className={`mx-auto w-full px-5 py-5 sm:px-6 sm:py-7 ${APP_CONTENT_MAX_WIDTH_CLASS}`}>
      <AnimatedReveal>
        <section className="rounded-xl border border-border/75 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
            </div>

            <Button asChild size="lg" className="h-11 md:min-w-44">
              <Link href={transactionCreateHref}>Dodaj transakcję</Link>
            </Button>
          </header>
        </section>
      </AnimatedReveal>

      <AnimatedReveal className="mt-5" delay={0.05}>
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
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/70 bg-card/90 px-3 py-2.5">
            <span className="pr-1 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground/85">
              Filtry
            </span>
            {activeFilterChips.map((chip) => (
              <Button
                asChild
                className="h-7 rounded-full border-border/75 bg-background/72 px-3 text-[11px] font-medium"
                key={chip.key}
                size="sm"
                variant="outline"
              >
                <Link href={chip.href} scroll={false}>
                  {chip.label} ×
                </Link>
              </Button>
            ))}
            <Button
              asChild
              className="h-7 rounded-full px-3 text-[11px]"
              size="sm"
              variant="ghost"
            >
              <Link href="/transactions" scroll={false}>
                Wyczyść
              </Link>
            </Button>
          </div>
        </AnimatedReveal>
      ) : null}

      <AnimatedReveal className="mt-4" delay={0.08}>
        <section className="rounded-xl border border-border/75 bg-card/92 shadow-[var(--surface-shadow)]">
          <div className="flex flex-col gap-2 border-b border-dashed border-border/65 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Historia operacji</p>
            </div>
            <p className="text-xs text-muted-foreground">Sortowanie: {sortSummary}</p>
          </div>

          <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
            {pageData.transactionsPage.items.length > 0 ? (
              <TransactionsTable items={pageData.transactionsPage.items} />
            ) : (
              <TransactionsEmptyState
                addTransactionHref={transactionCreateHref}
                clearSearchHref={clearSearchHref}
                query={filters.query}
              />
            )}

            <TransactionsPagination
              filters={filters}
              hasNextPage={pageData.transactionsPage.hasNextPage}
            />
          </div>
        </section>
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
