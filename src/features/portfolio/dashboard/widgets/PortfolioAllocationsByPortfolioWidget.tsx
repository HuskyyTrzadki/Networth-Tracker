"use client";

import { ChartCard } from "@/features/design-system/components/ChartCard";
import { InfoHint } from "@/features/design-system/components/InfoHint";

import type { PortfolioAllocationDonutCard } from "../../server/get-portfolio-allocation-donut-cards";

type Props = Readonly<{
  items: readonly PortfolioAllocationDonutCard[];
}>;

const formatAsOf = (value: string | null) => {
  if (!value) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

export function PortfolioAllocationsByPortfolioWidget({ items }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ChartCard
      subtitle="Struktura portfeli"
      surface="subtle"
      title="Alokacja per portfel"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => {
          const sortedSlices = [...item.slices].sort((a, b) => b.share - a.share);
          const hasVisibleShare = sortedSlices.some((slice) => slice.share > 0);

          return (
            <article
              key={item.portfolioId}
              className="rounded-md border border-border/70 bg-background/65 p-3"
            >
              <header className="mb-3 border-b border-dashed border-border/65 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold">{item.portfolioName}</h3>
                    <InfoHint
                      text={`Stan na ${formatAsOf(item.asOf)}`}
                      ariaLabel={`Informacja o czasie wyceny portfela ${item.portfolioName}`}
                      className="size-4 shrink-0 border-border/60 bg-background/72"
                    />
                  </div>
                  <p className="font-mono text-sm tabular-nums">{item.totalValueLabel}</p>
                </div>
              </header>

              {sortedSlices.length > 0 && hasVisibleShare ? (
                <>
                  <div
                    aria-label={`Skumulowana alokacja: ${item.portfolioName}`}
                    className="overflow-hidden rounded-sm border border-border/70 bg-background/78"
                    role="img"
                  >
                    <div className="flex h-7 w-full">
                      {sortedSlices.map((slice) => (
                        <div
                          key={`${item.portfolioId}:bar:${slice.id}`}
                          className="h-full border-r border-card/85 last:border-r-0"
                          style={{
                            width: `${slice.share * 100}%`,
                            backgroundColor: slice.color,
                          }}
                          title={`${slice.label}: ${formatPercent(slice.share)}`}
                        />
                      ))}
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {sortedSlices.map((slice) => (
                      <li
                        key={`${item.portfolioId}:${slice.id}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[12px]"
                      >
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span>{slice.label}</span>
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          {formatPercent(slice.share)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="grid h-[120px] place-items-center rounded-md border border-dashed border-border/70 text-sm text-muted-foreground">
                  Brak pozycji do wyświetlenia.
                </div>
              )}

              {item.isPartial ? (
                <p className="mt-3 text-xs text-[color:var(--chart-3)]">
                  Dane częściowe: ceny {item.missingQuotes}, FX {item.missingFx}.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </ChartCard>
  );
}
