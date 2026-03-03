"use client";

import dynamic from "next/dynamic";

import type { TransactionListItem } from "@/features/transactions/server/list-transactions";

import type { DividendInboxResult } from "../lib/dividend-inbox";
import { RenderWhenVisible } from "./components/RenderWhenVisible";

const PortfolioRecentTransactionsWidget = dynamic(
  () =>
    import("./widgets/PortfolioRecentTransactionsWidget").then(
      (module) => module.PortfolioRecentTransactionsWidget
    ),
  { ssr: false }
);
const DividendInboxWidget = dynamic(
  () => import("./widgets/DividendInboxWidget").then((module) => module.DividendInboxWidget),
  { ssr: false }
);

function DeferredWidgetSkeleton({
  title,
}: Readonly<{
  title: string;
}>) {
  return (
    <section className="rounded-xl border border-border/75 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-muted/50" />
        <div className="h-24 animate-pulse rounded-md border border-dashed border-border/70 bg-background/65" />
      </div>
    </section>
  );
}

type Props = Readonly<{
  selectedPortfolioId: string | null;
  recentTransactions: readonly TransactionListItem[];
  dividendInbox: DividendInboxResult;
}>;

export function PortfolioSecondaryWidgets({
  selectedPortfolioId,
  recentTransactions,
  dividendInbox,
}: Props) {
  return (
    <div className="space-y-5">
      <RenderWhenVisible
        fallback={<DeferredWidgetSkeleton title="Ostatnie transakcje" />}
        rootMargin="320px 0px"
      >
        <PortfolioRecentTransactionsWidget
          selectedPortfolioId={selectedPortfolioId}
          items={recentTransactions}
        />
      </RenderWhenVisible>
      <RenderWhenVisible
        fallback={<DeferredWidgetSkeleton title="Skrzynka dywidend" />}
        rootMargin="360px 0px"
      >
        <DividendInboxWidget data={dividendInbox} selectedPortfolioId={selectedPortfolioId} />
      </RenderWhenVisible>
    </div>
  );
}
