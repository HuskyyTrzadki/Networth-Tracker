import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";
import { Badge } from "@/features/design-system/components/ui/badge";

type Props = Readonly<{
  portfolioLabel: string;
  baseCurrency: string;
  totalValueBase: string | null;
  isPartial: boolean;
  asOf: string | null;
}>;

export function PortfolioNetValueHero({
  portfolioLabel,
  baseCurrency,
  totalValueBase,
  isPartial,
  asOf,
}: Props) {
  const formatter = getCurrencyFormatter(baseCurrency);
  const formattedTotalValue =
    formatter && totalValueBase
      ? formatCurrencyString(totalValueBase, formatter)
      : null;

  const totalValueLabel =
    formattedTotalValue ?? (totalValueBase ? `${totalValueBase} ${baseCurrency}` : "—");
  const quoteAsOfLabel = asOf
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(asOf))
    : null;
  const fxAsOfLabel = asOf
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(asOf))
    : null;

  return (
    <section className="rounded-lg border border-border/85 bg-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
        {portfolioLabel}
      </div>
      <div className="mt-3 text-[13px] text-muted-foreground">
        Wartość netto ({baseCurrency})
      </div>
      <div className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
        {totalValueLabel}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className="rounded-md px-2 py-0.5 text-[11px]" variant="outline">
          Notowania z {quoteAsOfLabel ?? "—"}
        </Badge>
        <Badge className="rounded-md px-2 py-0.5 text-[11px]" variant="outline">
          Kurs FX z dnia {fxAsOfLabel ?? "—"}
        </Badge>
      </div>
      {isPartial ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          Częściowa wycena: część instrumentów nie ma aktualnych notowań lub FX.
        </p>
      ) : null}
    </section>
  );
}
