import { Badge } from "@/features/design-system/components/ui/badge";
import { cn } from "@/lib/cn";

import {
  formatCurrencyString,
  formatCurrencyValue,
  getCurrencyFormatter,
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
  "minmax(110px,1fr) minmax(180px,2fr) minmax(120px,1fr) minmax(110px,1fr) minmax(120px,1fr) minmax(120px,1fr) minmax(90px,0.8fr)";
const GROUP_ACCENT_BASE_CLASS = "border-l-2";
const GROUP_TONE_BY_SIDE = {
  BUY: {
    accentClassName: "border-l-primary/35 dark:border-l-primary/45",
    cashRowClassName: "bg-primary/[0.04] dark:bg-primary/[0.08]",
  },
  SELL: {
    accentClassName: "border-l-rose-300/80 dark:border-l-rose-400/35",
    cashRowClassName: "bg-rose-500/[0.04] dark:bg-rose-500/[0.08]",
  },
} as const;

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
    const primaryItem = sortedItems.find((item) => item.legRole === "ASSET");

    return {
      groupId,
      items: sortedItems,
      primarySide: primaryItem?.side ?? sortedItems[0]?.side ?? "BUY",
    };
  });
};

export function TransactionsTable({ items }: Props) {
  const groups = groupTransactions(items);

  return (
    <div className="overflow-hidden rounded-lg border border-border/85 bg-card">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div
            className="grid items-center bg-muted/35 px-2 py-3 sm:px-4"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/90">Data</div>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/90">
              Instrument
            </div>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/90">Typ</div>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/90">
              Ilość
            </div>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/90">
              Cena
            </div>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/90">
              Wartość
            </div>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/90">
              Akcje
            </div>
          </div>
          <div className="space-y-3 p-3">
            {groups.map((group) => (
              <div
                key={group.groupId}
                className={cn(
                  "overflow-hidden rounded-md border border-border/80 bg-background/45",
                  GROUP_ACCENT_BASE_CLASS,
                  GROUP_TONE_BY_SIDE[group.primarySide].accentClassName
                )}
              >
                {group.items.map((item, index) => (
                  // First row is the primary action (asset leg); cash legs are details.
                  <div
                    className={cn(
                      "grid min-h-[58px] items-center px-2 sm:px-4",
                      index > 0 && "border-t border-border",
                      item.legRole === "CASH" &&
                        GROUP_TONE_BY_SIDE[group.primarySide].cashRowClassName
                    )}
                    key={item.id}
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                  >
                    <div className="px-2 font-mono text-[12px] tabular-nums text-muted-foreground">
                      {item.tradeDate}
                    </div>
                    <div className="flex min-w-0 items-center gap-3 px-2">
                      <div className="grid size-8 place-items-center text-sm leading-none">
                        <InstrumentLogoImage
                          className="size-6"
                          fallbackText={item.instrument.symbol}
                          size={24}
                          src={item.instrument.logoUrl}
                        />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[13px] font-semibold text-foreground">
                          {item.instrument.symbol}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {getInstrumentSubtitle(item)}
                        </span>
                      </div>
                    </div>
                    <div className="px-2">
                      <Badge
                        className={cn(
                          "rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
                          getRowBadgeClassName(item)
                        )}
                        variant="outline"
                      >
                        {getTypeLabel(item)}
                      </Badge>
                    </div>
                    <div className="px-2 font-mono text-sm tabular-nums">
                      {formatQuantityLabel(item)}
                    </div>
                    <div className="px-2 font-mono text-sm tabular-nums">
                      {formatPriceLabel(item.price, item.instrument.currency)}
                    </div>
                    <div className="px-2 font-mono text-sm font-semibold tabular-nums">
                      {formatValueLabel(
                        item.quantity,
                        item.price,
                        item.instrument.currency
                      )}
                    </div>
                    <div className="px-2">
                      <TransactionsRowActions />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
