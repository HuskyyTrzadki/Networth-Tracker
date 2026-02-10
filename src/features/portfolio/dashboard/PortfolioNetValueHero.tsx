import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

type Props = Readonly<{
  portfolioLabel: string;
  baseCurrency: string;
  totalValueBase: string | null;
  isPartial: boolean;
}>;

export function PortfolioNetValueHero({
  portfolioLabel,
  baseCurrency,
  totalValueBase,
  isPartial,
}: Props) {
  const formatter = getCurrencyFormatter(baseCurrency);
  const formattedTotalValue =
    formatter && totalValueBase
      ? formatCurrencyString(totalValueBase, formatter)
      : null;

  const totalValueLabel =
    formattedTotalValue ?? (totalValueBase ? `${totalValueBase} ${baseCurrency}` : "—");

  return (
    <section className="rounded-xl border border-border/85 bg-card px-4 py-4 shadow-[var(--shadow)] sm:px-5 sm:py-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
        {portfolioLabel}
      </div>
      <div className="mt-3 text-[13px] text-muted-foreground">
        Wartość netto ({baseCurrency})
      </div>
      <div className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
        {totalValueLabel}
      </div>
      {isPartial ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          Częściowa wycena: część instrumentów nie ma aktualnych notowań lub FX.
        </p>
      ) : null}
    </section>
  );
}
