import Link from "next/link";
import { cookies } from "next/headers";

import { Button } from "@/features/design-system/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  TransactionsEmptyState,
  TransactionsSearchToolbar,
  TransactionsPagination,
  TransactionsTable,
} from "@/features/transactions";
import { parseTransactionsFilters } from "@/features/transactions/server/filters";
import { listTransactions } from "@/features/transactions/server/list-transactions";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export const metadata = {
  title: "Transakcje",
};

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseTransactionsFilters(params);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transakcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby zobaczyć historię transakcji.
        </div>
      </main>
    );
  }

  const transactionsPage = await listTransactions(
    supabase,
    data.user.id,
    filters
  );

  return (
    <main className="px-6 py-8">
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
          <Link href="/transactions/new">Dodaj transakcję</Link>
        </Button>
      </header>

      <section className="mt-6">
        <TransactionsSearchToolbar
          key={`${filters.query ?? ""}:${filters.type ?? "all"}:${filters.sort}`}
          query={filters.query}
          sort={filters.sort}
          type={filters.type}
        />
      </section>

      <section className="mt-4">
        {transactionsPage.items.length > 0 ? (
          <TransactionsTable items={transactionsPage.items} />
        ) : (
          <TransactionsEmptyState query={filters.query} />
        )}
      </section>

      <TransactionsPagination
        filters={filters}
        hasNextPage={transactionsPage.hasNextPage}
      />
    </main>
  );
}
