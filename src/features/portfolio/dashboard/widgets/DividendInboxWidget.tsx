import { ChartCard, StatusStrip } from "@/features/design-system";
import { Badge } from "@/features/design-system/components/ui/badge";
import type { DividendInboxItem, DividendInboxResult } from "@/features/portfolio/lib/dividend-inbox";
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
}: Readonly<{
  title: string;
  items: readonly DividendInboxItem[];
  isReadOnly: boolean;
  portfolioId: string | null;
}>) => (
  <section className="space-y-2">
    <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
      {title}
    </h4>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.dividendEventKey}
            className="rounded-md border border-dashed border-border/70 bg-background/68 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{item.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{item.name}</p>
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
        ))}
      </ul>
    ) : (
      <div className="rounded-md border border-dashed border-border/70 bg-background/68 px-3 py-4 text-sm text-muted-foreground">
        Brak zdarzeń.
      </div>
    )}
  </section>
);

export function DividendInboxWidget({ selectedPortfolioId, data }: Props) {
  const isReadOnly = data.isReadOnly;
  const statusLabel = isReadOnly ? "Status: podgląd" : "Status: księgowanie";

  return (
    <ChartCard
      className="border-border/75 bg-card/94"
      title="Skrzynka dywidend"
      subtitle={isReadOnly ? "Widok globalny" : undefined}
      right={
        <StatusStrip
          hint={
            isReadOnly
              ? "W widoku zbiorczym nie można księgować zdarzeń."
              : "W tym widoku możesz księgować dywidendy dla wybranego portfela."
          }
          label={statusLabel}
        />
      }
    >
      <div className="space-y-4">
        <Section
          title="60 dni wstecz"
          items={data.pastItems}
          isReadOnly={isReadOnly}
          portfolioId={selectedPortfolioId}
        />
        <Section
          title="60 dni naprzód"
          items={data.upcomingItems}
          isReadOnly={true}
          portfolioId={selectedPortfolioId}
        />
      </div>
    </ChartCard>
  );
}
