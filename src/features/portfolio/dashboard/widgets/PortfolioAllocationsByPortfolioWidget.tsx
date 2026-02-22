"use client";

import { AllocationDonutChart, ChartCard } from "@/features/design-system";
import type { DonutSlice } from "@/features/design-system/components/AllocationDonutChart";

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
      subtitle="Każdy wykres pokazuje strukturę jednego portfela."
      surface="subtle"
      title="Alokacja per portfel"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => {
          const chartData: DonutSlice[] = item.slices.map((slice) => ({
            id: slice.id,
            value: slice.share,
            color: slice.color,
            tooltipLabel: slice.label,
            tooltipValue: slice.tooltipValue,
          }));

          return (
            <article
              key={item.portfolioId}
              className="rounded-md border border-border/70 bg-background/65 p-3"
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{item.portfolioName}</h3>
                  <p className="text-[12px] text-muted-foreground">
                    Opóźniony stan na: {formatAsOf(item.asOf)}
                  </p>
                </div>
                <p className="font-mono text-sm tabular-nums">{item.totalValueLabel}</p>
              </header>

              {chartData.length > 0 ? (
                <>
                  <AllocationDonutChart
                    data={chartData}
                    height={180}
                    innerRadius="60%"
                    outerRadius="86%"
                  />
                  <ul className="mt-2 space-y-1.5">
                    {item.slices.slice(0, 3).map((slice) => (
                      <li
                        key={`${item.portfolioId}:${slice.id}`}
                        className="flex items-center justify-between text-[12px]"
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
                <div className="grid h-[220px] place-items-center rounded-md border border-dashed border-border/70 text-sm text-muted-foreground">
                  Brak pozycji do wyświetlenia.
                </div>
              )}

              {item.isPartial ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Częściowa wycena: brak cen dla {item.missingQuotes}, brak FX dla{" "}
                  {item.missingFx}.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </ChartCard>
  );
}
