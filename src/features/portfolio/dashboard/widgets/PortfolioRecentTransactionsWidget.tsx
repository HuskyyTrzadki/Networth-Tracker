"use client";

import Link from "next/link";

import { ChartCard } from "@/features/design-system/components/ChartCard";
import { Badge } from "@/features/design-system/components/ui/badge";
import { Button } from "@/features/design-system/components/ui/button";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import {
  formatPriceLabel,
  formatValueLabel,
  getInstrumentSubtitle,
  getRowBadgeClassName,
  getTypeLabel,
} from "@/features/transactions/components/transactions-table-formatters";
import { resolveInstrumentVisual } from "@/features/transactions/lib/instrument-visual";
import { cn } from "@/lib/cn";
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

const getOverviewItems = (items: readonly TransactionListItem[]) => {
  const primaryItems = items.filter(
    (item) => item.legRole === "ASSET" || Boolean(item.cashflowType)
  );

  return (primaryItems.length > 0 ? primaryItems : items).slice(0, 6);
};

export function PortfolioRecentTransactionsWidget({
  selectedPortfolioId,
  items,
}: Props) {
  const overviewItems = getOverviewItems(items);

  return (
    <ChartCard
      className="border-border/75 bg-card/94"
      title="Ostatnie transakcje"
      subtitle="Najświeższe ruchy, które naprawdę zmieniają portfel"
      right={
        <Button
          asChild
          className="rounded-full bg-background/70"
          size="sm"
          variant="outline"
        >
          <Link href={getTransactionsHref(selectedPortfolioId)}>Rejestr</Link>
        </Button>
      }
    >
      {overviewItems.length > 0 ? (
        <ul className="space-y-2">
          {overviewItems.map((item) => {
            const visual = resolveInstrumentVisual({
              symbol: item.instrument.symbol,
              name: item.instrument.name,
              instrumentType: item.instrument.instrumentType,
              customAssetType: item.instrument.customAssetType,
            });
            const valueLabel = formatValueLabel(
              item.quantity,
              item.price,
              item.instrument.currency
            );
            const priceLabel = formatPriceLabel(item.price, item.instrument.currency);

            return (
              <li
                key={item.id}
                className="rounded-md border border-border/60 bg-background/60 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <InstrumentLogoImage
                      className="mt-0.5 size-8 shrink-0"
                      fallbackText={visual.label}
                      customAssetType={visual.customAssetType}
                      isCash={visual.isCash}
                      size={32}
                      ticker={visual.logoTicker}
                      src={item.instrument.logoUrl}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{visual.label}</p>
                        <Badge
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                            getRowBadgeClassName(item)
                          )}
                          variant="outline"
                        >
                          {getTypeLabel(item)}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {getInstrumentSubtitle(item)}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {item.tradeDate} · {priceLabel}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {valueLabel}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {item.legRole === "ASSET" ? "Wpływa na pozycję" : "Ruch gotówki"}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed border-border/70 bg-background/68 px-4 py-6">
          <p className="text-sm font-semibold text-foreground">Jeszcze nic tu nie ma</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Pierwsza transakcja od razu zasili wykres, alokację i wycenę portfela.
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
