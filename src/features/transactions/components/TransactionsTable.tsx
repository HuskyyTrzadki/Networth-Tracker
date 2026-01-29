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
import { InstrumentLogoImage } from "./InstrumentLogoImage";
import { TransactionsRowActions } from "./TransactionsRowActions";

type Props = Readonly<{
  items: readonly TransactionListItem[];
}>;

const getTypeLabel = (side: TransactionListItem["side"]) =>
  side === "BUY" ? "Kupno" : "Sprzedaż";

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

export function TransactionsTable({ items }: Props) {
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
          {items.map((item) => (
            <TableRow key={item.id} className="h-16">
              <TableCell className="px-4 font-mono text-xs tabular-nums text-muted-foreground">
                {item.tradeDate}
              </TableCell>
              <TableCell className="px-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center text-base leading-none">
                    {item.instrument.logoUrl ? (
                      <InstrumentLogoImage
                        className="size-6"
                        size={24}
                        src={item.instrument.logoUrl}
                      />
                    ) : (
                      <span className="block size-5 rounded-full bg-muted" />
                    )}
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
              </TableCell>
              <TableCell className="px-4">
                <Badge
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    getTypeBadgeClassName(item.side)
                  )}
                  variant="outline"
                >
                  {getTypeLabel(item.side)}
                </Badge>
              </TableCell>
              <TableCell
                className="px-4 font-mono text-sm tabular-nums"
                data-align="right"
              >
                {item.quantity}
              </TableCell>
              <TableCell
                className="px-4 font-mono text-sm tabular-nums"
                data-align="right"
              >
                {formatPriceLabel(item.price, item.instrument.currency)}
              </TableCell>
              <TableCell
                className="px-4 font-mono text-sm font-semibold tabular-nums"
                data-align="right"
              >
                {formatValueLabel(
                  item.quantity,
                  item.price,
                  item.instrument.currency
                )}
              </TableCell>
              <TableCell className="px-4" data-align="right">
                <TransactionsRowActions />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
