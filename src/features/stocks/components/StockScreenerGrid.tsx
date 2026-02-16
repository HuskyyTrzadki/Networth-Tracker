import Link from "next/link";

import { ChangePill } from "@/features/design-system";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import type { StockScreenerCard } from "@/features/stocks";
import { cn } from "@/lib/cn";
import { StockScreenerPreviewChart } from "./StockScreenerPreviewChart";

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const toTrend = (
  value: number | null
): { trend: "up" | "down" | "flat"; text: string } => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { trend: "flat", text: "-" };
  }

  if (value > 0) return { trend: "up", text: percentFormatter.format(value) };
  if (value < 0) return { trend: "down", text: percentFormatter.format(value) };
  return { trend: "flat", text: percentFormatter.format(0) };
};

const formatPrice = (value: string | null, currency: string) => {
  if (!value) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
};

export function StockScreenerGrid({
  cards,
  className,
}: Readonly<{
  cards: readonly StockScreenerCard[];
  className?: string;
}>) {
  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 bg-card p-8 text-sm text-muted-foreground">
        Brak akcji w portfelu. Dodaj transakcje akcji, aby zbudować screener.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5",
        className
      )}
    >
      {cards.map((card) => {
        const move = toTrend(card.monthChangePercent);
        const moveValue = move.text === "-" ? "-" : `1M ${move.text}`;
        return (
          <Link
            key={card.providerKey}
            href={`/stocks/${encodeURIComponent(card.providerKey)}`}
            className={cn(
              "group h-64 rounded-lg border border-border/70 bg-card p-3 md:h-60 transition-colors duration-150",
              "hover:border-primary/35 hover:bg-card/95"
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex min-w-0 items-start gap-3">
                <InstrumentLogoImage
                  src={card.logoUrl}
                  size={36}
                  fallbackText={card.symbol}
                  alt={card.name}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold">
                        {card.symbol}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{card.name}</p>
                    </div>
                    <p className="shrink-0 pt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground/90">
                      {formatPrice(card.price, card.currency)}
                    </p>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <ChangePill value={moveValue} trend={move.trend} />
                  </div>
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 rounded-md border border-border/50 bg-muted/15 px-1.5 py-1.5">
                <StockScreenerPreviewChart data={card.monthChart} currency={card.currency} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
