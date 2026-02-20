"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LazyMotion, AnimatePresence, domAnimation, m, useReducedMotion } from "framer-motion";
import { Badge } from "@/features/design-system/components/ui/badge";
import { cn } from "@/lib/cn";

import {
  formatCurrencyString,
  formatCurrencyValue,
  getCurrencyFormatter,
  splitCurrencyLabel,
} from "@/lib/format-currency";
import { multiplyDecimals, parseDecimalString } from "@/lib/decimal";
import type { TransactionListItem } from "../server/list-transactions";
import { cashflowTypeLabels, type CashflowType } from "../lib/cashflow-types";
import { InstrumentLogoImage } from "./InstrumentLogoImage";
import { TransactionsRowActions } from "./TransactionsRowActions";

type Props = Readonly<{
  items: readonly TransactionListItem[];
}>;

const GRID_TEMPLATE =
  "minmax(112px,1fr) minmax(220px,2.6fr) minmax(118px,1.2fr) minmax(96px,0.9fr) minmax(132px,1.1fr) minmax(150px,1.2fr) minmax(84px,0.75fr)";
const HEADER_CELL_CLASS =
  "px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/85";

const getTypeLabel = (item: TransactionListItem) => {
  if (item.cashflowType) {
    return (
      cashflowTypeLabels[item.cashflowType as CashflowType] ?? item.cashflowType
    );
  }
  return item.side === "BUY" ? "Kupno" : "Sprzedaż";
};

const getTypeBadgeClassName = (side: TransactionListItem["side"]) =>
  side === "BUY"
    ? "border-primary/25 bg-primary/10 text-primary"
    : "border-rose-200 bg-rose-50/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";

const getRowBadgeClassName = (item: TransactionListItem) => {
  if (item.legRole !== "CASH") {
    return getTypeBadgeClassName(item.side);
  }

  return "border-border/90 bg-muted/45 text-muted-foreground";
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

const trimTrailingZeros = (value: string) => {
  if (!value.includes(".")) {
    return value;
  }

  return value.replace(/\.?0+$/, "");
};

const formatQuantityLabel = (item: TransactionListItem) => {
  const parsedQuantity = parseDecimalString(item.quantity);
  if (!parsedQuantity) {
    return item.quantity;
  }

  // Cash settlement quantities should be money-like in the table: fixed 2 decimals.
  if (item.legRole === "CASH") {
    return parsedQuantity.toFixed(2).replace(".", ",");
  }

  // Asset quantity keeps fractional precision but avoids noisy trailing zeros.
  return trimTrailingZeros(parsedQuantity.toFixed(8)).replace(".", ",");
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
  item: TransactionListItem;
  isCashLeg: boolean;
  hasGroupDivider: boolean;
}>;

const toLedgerRows = (items: readonly TransactionListItem[]): readonly LedgerRow[] =>
  groupTransactions(items).flatMap((group) =>
    group.items.map((item, index) => ({
      item,
      isCashLeg: item.legRole === "CASH",
      hasGroupDivider: index === group.items.length - 1,
    }))
  );

type TransactionsLedgerRowProps = Readonly<{
  row: LedgerRow;
  index: number;
  isNew: boolean;
  prefersReducedMotion: boolean;
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
  prefersReducedMotion,
}: TransactionsLedgerRowProps) {
  const { item, isCashLeg, hasGroupDivider } = row;
  const priceLabel = formatPriceLabel(item.price, item.instrument.currency);
  const valueLabel = formatValueLabel(item.quantity, item.price, item.instrument.currency);

  return (
    // Primary asset and its cash legs render as one continuous ledger.
    <m.div
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.16,
        ease: [0.25, 1, 0.5, 1],
        delay: prefersReducedMotion ? 0 : Math.min(index, 12) * 0.02,
      }}
      className={cn(
        "grid min-h-[46px] items-center px-2 py-2 sm:px-4",
        hasGroupDivider && "border-b border-dashed border-border/70",
        isCashLeg && "text-muted-foreground",
        isNew && "animate-ledger-stamp"
      )}
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
    >
      <div
        className={cn(
          "px-2 font-mono text-[12px] tabular-nums text-muted-foreground",
          isCashLeg && "pl-8"
        )}
      >
        {item.tradeDate}
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center gap-3 px-2",
          isCashLeg && "pl-8"
        )}
      >
        <div className="grid size-8 place-items-center text-sm leading-none">
          <InstrumentLogoImage
            className="size-6"
            fallbackText={item.instrument.symbol}
            size={24}
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
      <div className="px-2">
        <Badge
          className={cn(
            "rounded-md border px-2.5 py-0.5 font-sans text-[11px] font-medium",
            getRowBadgeClassName(item)
          )}
          variant="outline"
        >
          {getTypeLabel(item)}
        </Badge>
      </div>
      <div className="px-2">
        <div className="w-full text-right font-mono text-sm tabular-nums">
          {formatQuantityLabel(item)}
        </div>
      </div>
      <div className="px-2">
        <div className="w-full text-right font-mono text-sm tabular-nums">
          <LedgerMonetaryValue label={priceLabel} />
        </div>
      </div>
      <div className="px-2">
        <div className="w-full text-right font-mono text-sm font-semibold tabular-nums">
          <LedgerMonetaryValue emphasized label={valueLabel} />
        </div>
      </div>
      <div className="px-2">
        <TransactionsRowActions />
      </div>
    </m.div>
  );
}

export function TransactionsTable({ items }: Props) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const rows = useMemo(() => toLedgerRows(items), [items]);
  const previousRowIdsRef = useRef<ReadonlySet<string>>(new Set());
  const [newRowIds, setNewRowIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const nextIds = new Set(rows.map((row) => row.item.id));
    if (previousRowIdsRef.current.size === 0) {
      previousRowIdsRef.current = nextIds;
      return;
    }

    const added = rows
      .map((row) => row.item.id)
      .filter((id) => !previousRowIdsRef.current.has(id));

    previousRowIdsRef.current = nextIds;

    if (added.length === 0) return;
    const addedSet = new Set(added);
    setNewRowIds(addedSet);

    const timeout = window.setTimeout(() => {
      setNewRowIds(new Set());
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [rows]);

  return (
    <div className="overflow-hidden rounded-lg border border-border/85 bg-card shadow-[var(--surface-shadow)]">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div
            className="grid items-center bg-muted/35 px-2 py-3 font-sans sm:px-4"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <div className={HEADER_CELL_CLASS}>Data</div>
            <div className={HEADER_CELL_CLASS}>
              Instrument
            </div>
            <div className={HEADER_CELL_CLASS}>Typ</div>
            <div className={cn(HEADER_CELL_CLASS, "flex justify-end text-right")}>
              Ilość
            </div>
            <div className={cn(HEADER_CELL_CLASS, "flex justify-end text-right")}>
              Cena
            </div>
            <div className={cn(HEADER_CELL_CLASS, "flex justify-end text-right")}>
              Wartość
            </div>
            <div className={HEADER_CELL_CLASS}>
              Akcje
            </div>
          </div>
          <LazyMotion features={domAnimation}>
            <div>
              <AnimatePresence initial={false}>
                {rows.map((row, index) => (
                  <TransactionsLedgerRow
                    key={row.item.id}
                    row={row}
                    index={index}
                    isNew={newRowIds.has(row.item.id)}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}
              </AnimatePresence>
            </div>
          </LazyMotion>
        </div>
      </div>
    </div>
  );
}
