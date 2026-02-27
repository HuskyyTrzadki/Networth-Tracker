"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

import {
  formatCurrencyString,
  formatCurrencyValue,
  getCurrencyFormatter,
  splitCurrencyLabel,
} from "@/lib/format-currency";
import { multiplyDecimals, parseDecimalString } from "@/lib/decimal";
import { formatGroupedNumber } from "@/lib/format-number";
import type { TransactionListItem } from "../server/list-transactions";
import { cashflowTypeLabels, type CashflowType } from "../lib/cashflow-types";
import { isCashInstrumentLike } from "../lib/system-currencies";
import { InstrumentLogoImage } from "./InstrumentLogoImage";
import { TransactionsRowActions } from "./TransactionsRowActions";

type Props = Readonly<{
  items: readonly TransactionListItem[];
}>;

const HEADER_CELL_CLASS =
  "px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/88";

const getTypeLabel = (item: TransactionListItem) => {
  if (item.cashflowType) {
    return (
      cashflowTypeLabels[item.cashflowType as CashflowType] ?? item.cashflowType
    );
  }
  return item.side === "BUY" ? "Kupno" : "Sprzedaż";
};

const getTypeBadgeClassName = () =>
  "border-border/70 bg-background/92 text-foreground/88";

const getRowBadgeClassName = (item: TransactionListItem) => {
  if (item.legRole !== "CASH") {
    return getTypeBadgeClassName();
  }

  return "border-border/75 bg-muted/28 text-muted-foreground";
};

const getInstrumentSubtitle = (item: TransactionListItem) => {
  if (item.legRole !== "CASH") {
    return item.instrument.name;
  }

  if (item.legKey === "CASH_SETTLEMENT") {
    return "Rozliczenie gotówki";
  }

  if (item.legKey === "CASH_FX_FEE") {
    return "Opłata FX";
  }

  return item.instrument.name;
};

const formatPriceLabel = (price: string, currency: string) => {
  const formatter = getCurrencyFormatter(currency);

  if (!formatter) {
    return `${price} ${currency}`;
  }

  return formatCurrencyString(price, formatter) ?? `${price} ${currency}`;
};

const formatValueLabel = (quantity: string, price: string, currency: string) => {
  const formatter = getCurrencyFormatter(currency);
  const parsedQuantity = parseDecimalString(quantity);
  const parsedPrice = parseDecimalString(price);

  if (!formatter || !parsedQuantity || !parsedPrice) {
    return "—";
  }

  const value = multiplyDecimals(parsedQuantity, parsedPrice);
  return formatCurrencyValue(value, formatter);
};

const formatQuantityLabel = (item: TransactionListItem) => {
  if (!parseDecimalString(item.quantity)) {
    return item.quantity;
  }

  // Cash settlement quantities should be money-like in the table: fixed 2 decimals.
  if (item.legRole === "CASH") {
    return (
      formatGroupedNumber(item.quantity, {
        minFractionDigits: 2,
        maxFractionDigits: 2,
        trimTrailingZeros: false,
      }) ?? item.quantity
    );
  }

  // Asset quantity keeps fractional precision but avoids noisy trailing zeros.
  return (
    formatGroupedNumber(item.quantity, {
      maxFractionDigits: 8,
      trimTrailingZeros: true,
    }) ?? item.quantity
  );
};

const sortGroupItems = (items: readonly TransactionListItem[]) =>
  [...items].sort((a, b) => {
    if (a.legRole === b.legRole) return 0;
    if (a.legRole === "ASSET") return -1;
    return 1;
  });

const groupTransactions = (items: readonly TransactionListItem[]) => {
  const groups = new Map<string, TransactionListItem[]>();
  const order: string[] = [];

  items.forEach((item) => {
    if (!groups.has(item.groupId)) {
      groups.set(item.groupId, []);
      order.push(item.groupId);
    }
    groups.get(item.groupId)?.push(item);
  });

  return order.map((groupId) => {
    const sortedItems = sortGroupItems(groups.get(groupId) ?? []);

    return {
      groupId,
      items: sortedItems,
    };
  });
};

type LedgerRow = Readonly<{
  rowKey: string;
  item: TransactionListItem;
  isCashLeg: boolean;
  hasGroupDivider: boolean;
}>;

const toLedgerRows = (items: readonly TransactionListItem[]): readonly LedgerRow[] =>
  groupTransactions(items).flatMap((group) =>
    group.items.map((item, index) => ({
      rowKey: `${item.groupId}:${item.legKey}`,
      item,
      isCashLeg: item.legRole === "CASH",
      hasGroupDivider: index === group.items.length - 1,
    }))
  );

type TransactionsLedgerRowProps = Readonly<{
  row: LedgerRow;
  index: number;
  isNew: boolean;
  onDeleted: (deletedGroupId: string) => void;
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
  onDeleted,
}: TransactionsLedgerRowProps) {
  const { item, isCashLeg, hasGroupDivider } = row;
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
              fallbackText={item.instrument.symbol}
              customAssetType={
                item.instrument.symbol === "CUSTOM"
                  ? (item.instrument.customAssetType ?? "OTHER")
                  : null
              }
              isCash={isCashInstrumentLike(item.instrument)}
              size={28}
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
              {item.instrument.symbol}
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
        <TransactionsRowActions transaction={item} onDeleted={onDeleted} />
      </TableCell>
    </TableRow>
  );
}

export function TransactionsTable({ items }: Props) {
  const [hiddenGroupIds, setHiddenGroupIds] = useState<ReadonlySet<string>>(
    new Set()
  );
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenGroupIds.has(item.groupId)),
    [items, hiddenGroupIds]
  );
  const rows = useMemo(() => toLedgerRows(visibleItems), [visibleItems]);
  const previousRowKeysRef = useRef<ReadonlySet<string>>(new Set());
  const [newRowKeys, setNewRowKeys] = useState<ReadonlySet<string>>(new Set());
  const handleDeletedGroup = (deletedGroupId: string) => {
    setHiddenGroupIds((previous) => {
      if (previous.has(deletedGroupId)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(deletedGroupId);
      return next;
    });
  };

  useEffect(() => {
    const nextKeys = new Set(rows.map((row) => row.rowKey));
    if (previousRowKeysRef.current.size === 0) {
      previousRowKeysRef.current = nextKeys;
      return;
    }

    const added = rows
      .map((row) => row.rowKey)
      .filter((rowKey) => !previousRowKeysRef.current.has(rowKey));

    previousRowKeysRef.current = nextKeys;

    if (added.length === 0) return;
    const addedSet = new Set(added);
    setNewRowKeys(addedSet);

    const timeout = window.setTimeout(() => {
      setNewRowKeys(new Set());
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [rows]);

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
            onDeleted={handleDeletedGroup}
          />
        ))}
      </TableBody>
    </Table>
  );
}
