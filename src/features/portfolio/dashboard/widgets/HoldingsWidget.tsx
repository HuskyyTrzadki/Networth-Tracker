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
  getCurrencyFormatter,
} from "@/lib/format-currency";
import { parseDecimalString } from "@/lib/decimal";

import type { PortfolioSummary } from "../../server/valuation";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";

type Props = Readonly<{
  summary: PortfolioSummary;
}>;

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);

const formatMissingValue = (reason: "MISSING_QUOTE" | "MISSING_FX") =>
  reason === "MISSING_QUOTE" ? "Brak ceny" : "Brak FX";

export function HoldingsWidget({ summary }: Props) {
  const formatter = getCurrencyFormatter(summary.baseCurrency);

  const rows = [...summary.holdings].sort((a, b) => {
    if (a.valueBase && b.valueBase) {
      const aValue = parseDecimalString(a.valueBase);
      const bValue = parseDecimalString(b.valueBase);
      if (!aValue || !bValue) return 0;
      return bValue.cmp(aValue);
    }
    if (a.valueBase) return -1;
    if (b.valueBase) return 1;
    return a.symbol.localeCompare(b.symbol);
  });

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold">Pozycje</div>
      </header>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="px-4">Instrument</TableHead>
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
              Udział
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const priceFormatter = getCurrencyFormatter(row.currency);
            const priceLabel =
              row.price && priceFormatter
                ? formatCurrencyString(row.price, priceFormatter) ??
                  `${row.price} ${row.currency}`
                : row.missingReason
                  ? formatMissingValue(row.missingReason)
                  : row.price
                    ? `${row.price} ${row.currency}`
                    : "—";

            const valueLabel =
              row.valueBase && formatter
                ? formatCurrencyString(row.valueBase, formatter) ??
                  `${row.valueBase} ${summary.baseCurrency}`
                : row.missingReason
                  ? formatMissingValue(row.missingReason)
                  : row.valueBase
                    ? `${row.valueBase} ${summary.baseCurrency}`
                    : "—";

            const weightLabel =
              typeof row.weight === "number" ? formatPercent(row.weight) : "—";

            return (
              <TableRow key={row.instrumentId} className="h-16">
                <TableCell className="px-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center text-base leading-none">
                      {row.logoUrl ? (
                        <InstrumentLogoImage
                          alt=""
                          className="size-6"
                          size={24}
                          src={row.logoUrl}
                        />
                      ) : (
                        <span className="block size-5 rounded-full bg-muted" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {row.symbol}
                        </span>
                        {row.exchange ? (
                          <Badge
                            className="rounded-full px-2 py-0.5 text-[10px]"
                            variant="outline"
                          >
                            {row.exchange}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {row.name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className="px-4 font-mono text-sm tabular-nums"
                  data-align="right"
                >
                  {row.quantity}
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 font-mono text-sm tabular-nums",
                    row.missingReason ? "text-muted-foreground" : ""
                  )}
                  data-align="right"
                >
                  {priceLabel}
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 font-mono text-sm tabular-nums",
                    row.missingReason ? "text-muted-foreground" : ""
                  )}
                  data-align="right"
                >
                  {valueLabel}
                </TableCell>
                <TableCell className="px-4 text-sm" data-align="right">
                  {weightLabel}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
