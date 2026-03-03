"use client";

import Link from "next/link";

import { ChartCard } from "@/features/design-system/components/ChartCard";
import { StatusStrip } from "@/features/design-system/components/StatusStrip";
import { Button } from "@/features/design-system/components/ui/button";
import { TransactionsTable } from "@/features/transactions/components/TransactionsTable";
import type { TransactionListItem } from "@/features/transactions/server/list-transactions";

type Props = Readonly<{
  selectedPortfolioId: string | null;
  items: readonly TransactionListItem[];
}>;

const getTransactionsHref = (selectedPortfolioId: string | null) =>
  selectedPortfolioId
    ? `/transactions?portfolio=${selectedPortfolioId}&sort=date_desc`
    : "/transactions?sort=date_desc";
const getCreateTransactionHref = (selectedPortfolioId: string | null) =>
  selectedPortfolioId
    ? `/transactions/new?portfolio=${selectedPortfolioId}`
    : "/transactions/new";

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
          <StatusStrip
            hint="Lista pokazuje ostatnie zaksięgowane operacje."
            label="Status: ostatnie"
          />
          <Button
            asChild
            className="rounded-full border-dashed bg-background/70"
            size="sm"
            variant="outline"
          >
            <Link href={getTransactionsHref(selectedPortfolioId)}>Rejestr</Link>
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
          <p className="mt-2 text-sm text-muted-foreground">
            Dodaj pierwszą transakcję, aby zobaczyć historię operacji.
          </p>
          <Button asChild className="mt-4 rounded-full" size="sm">
            <Link href={getCreateTransactionHref(selectedPortfolioId)} scroll={false}>
              Dodaj transakcję
            </Link>
          </Button>
        </div>
      )}
    </ChartCard>
  );
}
