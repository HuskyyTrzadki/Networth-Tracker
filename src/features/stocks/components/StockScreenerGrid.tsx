import Link from "next/link";

import { ChangePill } from "@/features/design-system";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import type { StockScreenerCard } from "@/features/stocks";
import { cn } from "@/lib/cn";

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
      <div className="rounded-xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">
        Brak akcji w portfelu. Dodaj transakcje akcji, aby zbudować screener.
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {cards.map((card) => {
        const move = toTrend(card.dayChangePercent);
        return (
          <Link
            key={card.providerKey}
            href={`/stocks/${encodeURIComponent(card.providerKey)}`}
            className={cn(
              "group aspect-square rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow)] transition",
              "hover:border-primary/35 hover:bg-card/95"
            )}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <InstrumentLogoImage
                    src={card.logoUrl}
                    size={36}
                    fallbackText={card.symbol}
                    alt={card.name}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold">{card.symbol}</p>
                    <p className="truncate text-xs text-muted-foreground">{card.name}</p>
                  </div>
                </div>
                <ChangePill value={move.text} trend={move.trend} />
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Cena
                </p>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {formatPrice(card.price, card.currency)}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
