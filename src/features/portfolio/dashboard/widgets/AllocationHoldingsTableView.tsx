import { Badge } from "@/features/design-system/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/design-system/components/ui/table";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { cn } from "@/lib/cn";

import type { PortfolioSummary, ValuedHolding } from "../../server/valuation";

type Props = Readonly<{
  summary: PortfolioSummary;
  holdingsRows: readonly ValuedHolding[];
}>;

const formatPercent = (value: number, maxFractionDigits = 1) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: maxFractionDigits,
  }).format(value);

const formatMissingValue = (reason: "MISSING_QUOTE" | "MISSING_FX") =>
  reason === "MISSING_QUOTE" ? "Brak ceny" : "Brak FX";

const formatDecimalValue = (value: string) => {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return value;
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asNumber);
};

export function AllocationHoldingsTableView({ summary, holdingsRows }: Props) {
  return (
    <div className="h-full overflow-y-auto overflow-x-auto">
      <Table className="min-w-[820px]">
        <TableHeader>
          <TableRow className="bg-muted/25">
            <TableHead className="px-4">Instrument</TableHead>
            <TableHead className="px-4" data-align="right">
              Ilość
            </TableHead>
            <TableHead className="px-4" data-align="right">
              Śr. cena zakupu ({summary.baseCurrency})
            </TableHead>
            <TableHead className="px-4" data-align="right">
              Wartość ({summary.baseCurrency})
            </TableHead>
            <TableHead className="px-4" data-align="right">
              Udział
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdingsRows.map((row) => {
            const averageBuyPriceLabel = row.averageBuyPriceBase
              ? formatDecimalValue(row.averageBuyPriceBase)
              : "—";
            const valueLabel =
              row.valueBase
                ? formatDecimalValue(row.valueBase)
                : row.missingReason
                  ? formatMissingValue(row.missingReason)
                  : "—";
            const weightLabel =
              typeof row.weight === "number" ? formatPercent(row.weight) : "—";
            const symbolLabel =
              row.symbol === "CUSTOM" && row.name.trim().length > 0
                ? row.name
                : row.symbol;

            return (
              <TableRow key={row.instrumentId} className="h-[68px]">
                <TableCell className="px-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center text-sm leading-none">
                      <InstrumentLogoImage
                        alt=""
                        className="size-6"
                        fallbackText={symbolLabel}
                        size={24}
                        src={row.logoUrl}
                      />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">
                          {symbolLabel}
                        </span>
                        {row.exchange ? (
                          <Badge
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            variant="outline"
                          >
                            {row.exchange}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="truncate text-[12px] text-muted-foreground">
                        {row.name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className="px-4 font-mono text-[13px] tabular-nums text-foreground"
                  data-align="right"
                >
                  {row.quantity}
                </TableCell>
                <TableCell
                  className="px-4 font-mono text-[13px] tabular-nums text-foreground"
                  data-align="right"
                >
                  {averageBuyPriceLabel}
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 font-mono text-[13px] tabular-nums",
                    row.missingReason ? "text-muted-foreground" : ""
                  )}
                  data-align="right"
                >
                  {valueLabel}
                </TableCell>
                <TableCell
                  className="px-4 font-mono text-[13px] tabular-nums text-foreground"
                  data-align="right"
                >
                  {weightLabel}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
