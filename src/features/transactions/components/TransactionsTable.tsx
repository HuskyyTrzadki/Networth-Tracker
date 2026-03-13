"use client";

import { useMemo, useOptimistic } from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/features/design-system/components/ui/badge";
import { cn } from "@/lib/cn";
import type { TransactionListItem } from "../server/list-transactions";
import { resolveInstrumentVisual } from "../lib/instrument-visual";
import { InstrumentLogoImage } from "./InstrumentLogoImage";
import { TransactionsRowActions } from "./TransactionsRowActions";
import {
  formatPriceLabel,
  formatQuantityLabel,
  formatValueLabel,
  getInstrumentSubtitle,
  getRowBadgeClassName,
  getTypeLabel,
} from "./transactions-table-formatters";
import {
  groupTransactions,
  toLedgerRows,
  type TransactionGroup,
} from "./transactions-ledger-rows";
import { useNewTransactionRowHighlight } from "./use-new-transaction-row-highlight";

type Props = Readonly<{
  items: readonly TransactionListItem[];
}>;

const EMPTY_HIDDEN_GROUP_IDS: ReadonlySet<string> = new Set<string>();

type GroupCardProps = Readonly<{
  group: TransactionGroup;
  isNew: boolean;
  onDeleteOptimistic: (deletedGroupId: string) => void;
  onDeleteRollback: (deletedGroupId: string) => void;
}>;

function formatSettlementAmount(item: TransactionListItem) {
  return formatValueLabel(item.quantity, item.price, item.instrument.currency);
}

function GroupCard({
  group,
  isNew,
  onDeleteOptimistic,
  onDeleteRollback,
}: GroupCardProps) {
  const primaryItem = group.items.find((item) => item.legRole === "ASSET") ?? group.items[0];
  if (!primaryItem) {
    return null;
  }

  const settlementItems = group.items.filter((item) => item.id !== primaryItem.id);
  const hasSettlementDetails = settlementItems.length > 0;
  const visual = resolveInstrumentVisual({
    symbol: primaryItem.instrument.symbol,
    name: primaryItem.instrument.name,
    instrumentType: primaryItem.instrument.instrumentType,
    customAssetType: primaryItem.instrument.customAssetType,
  });
  const isCashPrimary = primaryItem.legRole === "CASH";
  const quantityLabel = formatQuantityLabel(primaryItem);
  const priceLabel = formatPriceLabel(primaryItem.price, primaryItem.instrument.currency);
  const valueLabel = formatValueLabel(
    primaryItem.quantity,
    primaryItem.price,
    primaryItem.instrument.currency
  );

  return (
    <article
      className={cn(
        "rounded-lg border border-border/60 bg-background/66 p-3.5 transition-colors hover:border-border/80",
        isNew && "animate-ledger-stamp"
      )}
      data-testid="transactions-ledger-row"
      data-row-key={group.groupId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <InstrumentLogoImage
            className="mt-0.5 size-9 shrink-0"
            fallbackText={visual.label}
            customAssetType={visual.customAssetType}
            isCash={visual.isCash}
            size={36}
            ticker={visual.logoTicker}
            src={primaryItem.instrument.logoUrl}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "text-sm font-semibold tracking-tight text-foreground",
                  !isCashPrimary && "font-mono"
                )}
              >
                {visual.label}
              </p>
              <Badge
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                  getRowBadgeClassName(primaryItem)
                )}
                variant="outline"
              >
                {getTypeLabel(primaryItem)}
              </Badge>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {getInstrumentSubtitle(primaryItem)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
              <span>{primaryItem.tradeDate}</span>
              {!isCashPrimary ? <span>Ilość {quantityLabel}</span> : null}
              <span>{isCashPrimary ? "Kurs bazowy" : "Cena"} {priceLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
              {isCashPrimary ? "Kwota zapisu" : "Wartość transakcji"}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
              {valueLabel}
            </p>
          </div>
          <TransactionsRowActions
            transaction={primaryItem}
            onDeleteOptimistic={onDeleteOptimistic}
            onDeleteRollback={onDeleteRollback}
          />
        </div>
      </div>

      {hasSettlementDetails ? (
        <details className="group mt-3 border-t border-dashed border-border/60 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-muted-foreground marker:content-none">
            <span>
              Rozliczenie i ruch gotówki
              <span className="ml-2 text-[11px]">
                ({settlementItems.length} {settlementItems.length === 1 ? "pozycja" : "pozycje"})
              </span>
            </span>
            <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <ul className="mt-3 space-y-2">
            {settlementItems.map((item) => (
              <li
                key={`${item.groupId}:${item.legKey}`}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/[0.08] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {item.instrument.symbol}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {getInstrumentSubtitle(item)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs tabular-nums text-foreground">
                    {formatSettlementAmount(item)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {getTypeLabel(item)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

export function TransactionsTable({ items }: Props) {
  const [optimisticHiddenGroupIds, applyOptimisticHiddenGroups] = useOptimistic(
    EMPTY_HIDDEN_GROUP_IDS,
    (
      current: ReadonlySet<string>,
      action: Readonly<{ type: "hide" | "show"; groupId: string }>
    ) => {
      const next = new Set(current);
      if (action.type === "hide") {
        next.add(action.groupId);
      } else {
        next.delete(action.groupId);
      }
      return next;
    }
  );
  const visibleItems = useMemo(
    () => items.filter((item) => !optimisticHiddenGroupIds.has(item.groupId)),
    [items, optimisticHiddenGroupIds]
  );
  const rows = useMemo(() => toLedgerRows(visibleItems), [visibleItems]);
  const groups = useMemo(() => groupTransactions(visibleItems), [visibleItems]);
  const newRowKeys = useNewTransactionRowHighlight(rows);
  const newGroupIds = useMemo(
    () =>
      new Set(
        Array.from(newRowKeys, (rowKey) => rowKey.split(":")[0] ?? rowKey)
      ),
    [newRowKeys]
  );

  const handleDeleteOptimistic = (deletedGroupId: string) =>
    applyOptimisticHiddenGroups({
      type: "hide",
      groupId: deletedGroupId,
    });
  const handleDeleteRollback = (deletedGroupId: string) =>
    applyOptimisticHiddenGroups({
      type: "show",
      groupId: deletedGroupId,
    });

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <GroupCard
          key={group.groupId}
          group={group}
          isNew={newGroupIds.has(group.groupId)}
          onDeleteOptimistic={handleDeleteOptimistic}
          onDeleteRollback={handleDeleteRollback}
        />
      ))}
    </div>
  );
}
