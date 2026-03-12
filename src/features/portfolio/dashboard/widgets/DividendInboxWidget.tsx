import { ChartCard } from "@/features/design-system/components/ChartCard";
import { Badge } from "@/features/design-system/components/ui/badge";
import type { DividendInboxItem, DividendInboxResult } from "@/features/portfolio/lib/dividend-inbox";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { resolveInstrumentVisual } from "@/features/transactions/lib/instrument-visual";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import { DividendInboxBookAction } from "./DividendInboxBookAction";

type Props = Readonly<{
  selectedPortfolioId: string | null;
  data: DividendInboxResult;
}>;

const formatMoney = (value: string | null, currency: string) => {
  if (!value) return "—";
  const formatter = getCurrencyFormatter(currency);
  return formatter ? formatCurrencyString(value, formatter) ?? `${value} ${currency}` : `${value} ${currency}`;
};

const Section = ({
  title,
  items,
  isReadOnly,
  portfolioId,
  emptyState,
}: Readonly<{
  title: string;
  items: readonly DividendInboxItem[];
  isReadOnly: boolean;
  portfolioId: string | null;
  emptyState: string;
}>) => (
  <section className="space-y-2">
    <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
      {title}
    </h4>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.map((item) => {
          const visual = resolveInstrumentVisual({
            symbol: item.symbol,
            name: item.name,
          });

          return (
            <li
              key={item.dividendEventKey}
              className="rounded-md border border-dashed border-border/70 bg-background/68 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <InstrumentLogoImage
                    alt=""
                    className="mt-0.5 size-8 shrink-0"
                    fallbackText={visual.label}
                    size={32}
                    ticker={visual.logoTicker}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.symbol}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.name}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-mono tabular-nums">{item.eventDate}</p>
                  <p className="font-mono tabular-nums">
                    Brutto: {formatMoney(item.estimatedGross, item.payoutCurrency)}
                  </p>
                  <p className="font-mono tabular-nums">
                    Netto: {formatMoney(item.netSuggested, item.payoutCurrency)}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {item.isBooked ? (
                    <Badge className="border-border/70 bg-background/92 text-[color:var(--profit)]">
                      Zaksięgowane
                    </Badge>
                  ) : null}
                  {item.disabledReason ? (
                    <span className="text-xs text-muted-foreground">{item.disabledReason}</span>
                  ) : null}
                </div>

                {!isReadOnly ? (
                  <DividendInboxBookAction
                    item={item}
                    portfolioId={portfolioId}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    ) : (
      <div className="rounded-md border border-dashed border-border/70 bg-background/68 px-3 py-4 text-sm text-muted-foreground">
        {emptyState}
      </div>
    )}
  </section>
);

export function DividendInboxWidget({ selectedPortfolioId, data }: Props) {
  const isReadOnly = data.isReadOnly;

  return (
    <ChartCard
      className="border-border/75 bg-card/94"
      title="Skrzynka dywidend"
      subtitle={
        isReadOnly
          ? "Widok globalny. Księgowanie odblokuje się w konkretnym portfelu."
          : undefined
      }
    >
      <div className="space-y-4">
        <Section
          title="60 dni wstecz"
          emptyState="Brak niezaksięgowanych dywidend z ostatnich 60 dni."
          items={data.pastItems}
          isReadOnly={isReadOnly}
          portfolioId={selectedPortfolioId}
        />
        <Section
          title="60 dni naprzód"
          emptyState="Na razie nic nie wpada w kolejnych 60 dniach."
          items={data.upcomingItems}
          isReadOnly={true}
          portfolioId={selectedPortfolioId}
        />
      </div>
    </ChartCard>
  );
}
