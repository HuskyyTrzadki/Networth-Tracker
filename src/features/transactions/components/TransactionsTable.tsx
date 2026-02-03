import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/design-system/components/ui/table";
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
    ? "border-primary/20 bg-primary/5 text-primary"
    : "border-rose-200 bg-rose-50 text-rose-600";

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

  return order.map((groupId) => ({
    groupId,
    items: groups.get(groupId) ?? [],
  }));
};

export function TransactionsTable({ items }: Props) {
  const groups = groupTransactions(items);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="px-4">Data</TableHead>
            <TableHead className="px-4">Instrument</TableHead>
            <TableHead className="px-4">Typ</TableHead>
            <TableHead className="px-4" data-align="right">
              Ilość
            </TableHead>
            <TableHead className="px-4" data-align="right">
              Cena
            </TableHead>
            <TableHead className="px-4" data-align="right">
              Wartość
            </TableHead>
            <TableHead className="px-4" data-align="right">
              Akcje
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.groupId}>
              <TableCell className="p-3" colSpan={7}>
                <div className="overflow-hidden rounded-md border border-border">
                  {group.items.map((item, index) => (
                    <div
                      className={cn(
                        "grid grid-cols-[120px_minmax(0,1fr)_120px_120px_140px_140px_60px] items-center gap-0 px-2 sm:px-4",
                        index > 0 && "border-t border-border",
                        "min-h-[56px]"
                      )}
                      key={item.id}
                    >
                      <div className="font-mono text-xs tabular-nums text-muted-foreground">
                        {item.tradeDate}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 place-items-center text-base leading-none">
                          <InstrumentLogoImage
                            className="size-6"
                            fallbackText={item.instrument.symbol}
                            size={24}
                            src={item.instrument.logoUrl}
                          />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {item.instrument.symbol}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.instrument.name}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Badge
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            getTypeBadgeClassName(item.side)
                          )}
                          variant="outline"
                        >
                          {getTypeLabel(item)}
                        </Badge>
                      </div>
                      <div className="font-mono text-sm tabular-nums text-right">
                        {item.quantity}
                      </div>
                      <div className="font-mono text-sm tabular-nums text-right">
                        {formatPriceLabel(item.price, item.instrument.currency)}
                      </div>
                      <div className="font-mono text-sm font-semibold tabular-nums text-right">
                        {formatValueLabel(
                          item.quantity,
                          item.price,
                          item.instrument.currency
                        )}
                      </div>
                      <div className="text-right">
                        <TransactionsRowActions />
                      </div>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
