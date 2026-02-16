"use client";

import Link from "next/link";

import { ChartCard } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { TransactionsTable } from "@/features/transactions";
import type { TransactionListItem } from "@/features/transactions/server/list-transactions";

type Props = Readonly<{
  selectedPortfolioId: string | null;
  items: readonly TransactionListItem[];
}>;

const getTransactionsHref = (selectedPortfolioId: string | null) =>
  selectedPortfolioId
    ? `/transactions?portfolio=${selectedPortfolioId}&sort=date_desc`
    : "/transactions?sort=date_desc";

export function PortfolioRecentTransactionsWidget({
  selectedPortfolioId,
  items,
}: Props) {
  return (
    <ChartCard
      title="Ostatnie transakcje"
      subtitle="Najnowsze operacje, posortowane od najnowszych."
      right={
        <Button asChild size="sm" variant="outline">
          <Link href={getTransactionsHref(selectedPortfolioId)}>Zobacz wszystkie</Link>
        </Button>
      }
    >
      {items.length > 0 ? (
        <TransactionsTable items={items} />
      ) : (
        <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Brak transakcji dla wybranego portfela.
        </div>
      )}
    </ChartCard>
  );
}
