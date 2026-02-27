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
      className="border-border/75 bg-card/94"
      title="Ostatnie transakcje"
      subtitle="Najnowsze operacje"
      right={
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-sm border border-dashed border-border/70 bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Status: ostatnie
          </span>
          <Button
            asChild
            className="rounded-full border-dashed bg-background/70"
            size="sm"
            variant="outline"
          >
            <Link href={getTransactionsHref(selectedPortfolioId)}>Zobacz</Link>
          </Button>
        </div>
      }
    >
      {items.length > 0 ? (
        <TransactionsTable items={items} />
      ) : (
        <div className="rounded-md border border-dashed border-border/70 bg-background/68 px-4 py-6">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Brak wpisów
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Brak transakcji dla wybranego portfela.
          </p>
        </div>
      )}
    </ChartCard>
  );
}
