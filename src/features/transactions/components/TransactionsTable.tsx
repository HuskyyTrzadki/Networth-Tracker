"use client";

import { useMemo, useOptimistic } from "react";
import { Badge } from "@/features/design-system/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/design-system/components/ui/table";
import { cn } from "@/lib/cn";

import { splitCurrencyLabel } from "@/lib/format-currency";
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
import { type LedgerRow, toLedgerRows } from "./transactions-ledger-rows";
import { useNewTransactionRowHighlight } from "./use-new-transaction-row-highlight";

type Props = Readonly<{
  items: readonly TransactionListItem[];
}>;

const HEADER_CELL_CLASS =
  "px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/88";
const EMPTY_HIDDEN_GROUP_IDS: ReadonlySet<string> = new Set<string>();

type TransactionsLedgerRowProps = Readonly<{
  row: LedgerRow;
  index: number;
  isNew: boolean;
  onDeleteOptimistic: (deletedGroupId: string) => void;
  onDeleteRollback: (deletedGroupId: string) => void;
}>;

function LedgerMonetaryValue({
  label,
  emphasized = false,
}: Readonly<{ label: string; emphasized?: boolean }>) {
  const { amount, currency } = splitCurrencyLabel(label);

  return (
    <span className="inline-flex items-baseline justify-end gap-1">
      <span>{amount}</span>
      {currency ? (
        <span
          className={cn(
            "text-[11px] font-medium text-muted-foreground/75",
            emphasized && "text-muted-foreground/80"
          )}
        >
          {currency}
        </span>
      ) : null}
    </span>
  );
}

function TransactionsLedgerRow({
  row,
  index,
  isNew,
  onDeleteOptimistic,
  onDeleteRollback,
}: TransactionsLedgerRowProps) {
  const { item, isCashLeg, hasGroupDivider } = row;
  const visual = resolveInstrumentVisual({
    symbol: item.instrument.symbol,
    name: item.instrument.name,
    instrumentType: item.instrument.instrumentType,
    customAssetType: item.instrument.customAssetType,
  });
  const priceLabel = formatPriceLabel(item.price, item.instrument.currency);
  const valueLabel = formatValueLabel(item.quantity, item.price, item.instrument.currency);

  return (
    <TableRow
      className={cn(
        "min-h-[46px]",
        index % 2 === 1 && "bg-muted/[0.06]",
        "transition-colors hover:bg-muted/16",
        hasGroupDivider ? "border-border/52" : "border-transparent",
        isCashLeg && "text-muted-foreground",
        isNew && "animate-ledger-stamp"
      )}
      data-testid="transactions-ledger-row"
      data-row-key={row.rowKey}
    >
      <TableCell
        className={cn(
          "px-2 py-2 font-mono text-[12px] tabular-nums text-muted-foreground",
          isCashLeg && "pl-8"
        )}
      >
        {item.tradeDate}
      </TableCell>
      <TableCell
        className={cn(
          "px-2 py-2",
          isCashLeg && "pl-8"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 place-items-center text-sm leading-none">
            <InstrumentLogoImage
              className="size-7"
              fallbackText={visual.label}
              customAssetType={visual.customAssetType}
              isCash={visual.isCash}
              size={28}
              ticker={visual.logoTicker}
              src={item.instrument.logoUrl}
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span
              className={cn(
                "font-sans text-[13px] font-semibold tracking-tight text-foreground",
                isCashLeg && "text-muted-foreground"
              )}
            >
              {visual.label}
            </span>
            <span className="truncate font-sans text-xs text-muted-foreground">
              {getInstrumentSubtitle(item)}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2 py-2">
        <Badge
          className={cn(
            "rounded-md border px-2.5 py-0.5 font-sans text-[11px] font-medium",
            getRowBadgeClassName(item)
          )}
          variant="outline"
        >
          {getTypeLabel(item)}
        </Badge>
      </TableCell>
      <TableCell className="px-2 py-2 text-right font-mono text-sm tabular-nums">
        {formatQuantityLabel(item)}
      </TableCell>
      <TableCell className="px-2 py-2 text-right font-mono text-sm tabular-nums">
        <LedgerMonetaryValue label={priceLabel} />
      </TableCell>
      <TableCell className="px-2 py-2 text-right font-mono text-sm font-semibold tabular-nums">
        <LedgerMonetaryValue emphasized label={valueLabel} />
      </TableCell>
      <TableCell className="px-2 py-2">
        <TransactionsRowActions
          transaction={item}
          onDeleteOptimistic={onDeleteOptimistic}
          onDeleteRollback={onDeleteRollback}
        />
      </TableCell>
    </TableRow>
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
  const newRowKeys = useNewTransactionRowHighlight(rows);
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
    <Table className="min-w-[860px] bg-background/72">
      <TableHeader className="sticky top-0 z-10 bg-muted/24">
        <TableRow className="hover:bg-transparent">
          <TableHead className={HEADER_CELL_CLASS}>Data</TableHead>
          <TableHead className={HEADER_CELL_CLASS}>Instrument</TableHead>
          <TableHead className={HEADER_CELL_CLASS}>Typ</TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-right")} data-align="right">
            Ilość
          </TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-right")} data-align="right">
            Cena
          </TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-right")} data-align="right">
            Wartość
          </TableHead>
          <TableHead className={HEADER_CELL_CLASS}>Akcje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TransactionsLedgerRow
            key={row.rowKey}
            row={row}
            index={index}
            isNew={newRowKeys.has(row.rowKey)}
            onDeleteOptimistic={handleDeleteOptimistic}
            onDeleteRollback={handleDeleteRollback}
          />
        ))}
      </TableBody>
    </Table>
  );
}
