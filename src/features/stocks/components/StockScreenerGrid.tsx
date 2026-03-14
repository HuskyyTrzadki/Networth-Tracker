"use client";

import Link from "next/link";
import { Loader2, Star } from "lucide-react";

import { ChangePill } from "@/features/design-system/components/ChangePill";
import { Button } from "@/features/design-system/components/ui/button";
import { cardVariants } from "@/features/design-system/components/ui/card";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { resolveInstrumentVisual } from "@/features/transactions/lib/instrument-visual";
import { cn } from "@/lib/cn";
import { splitCurrencyLabel } from "@/lib/format-currency";

import type { StockScreenerMonitoringItem } from "./stock-screener-monitoring";
import { StockScreenerPreviewChartLazy } from "./StockScreenerPreviewChartLazy";

type StockScreenerGridProps = Readonly<{
  title: string;
  description: string;
  items: readonly StockScreenerMonitoringItem[];
  emptyMessage: string;
  className?: string;
  onRemoveFavorite: (providerKey: string) => void;
  isRemovingFavorite: boolean;
}>;

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

function PriceLabel({ label }: Readonly<{ label: string }>) {
  const { amount, currency } = splitCurrencyLabel(label);

  return (
    <span className="inline-flex items-baseline gap-1">
      <span>{amount}</span>
      {currency ? (
        <span className="text-[10px] font-medium text-muted-foreground/75">{currency}</span>
      ) : null}
    </span>
  );
}

function SectionCard({
  item,
  onRemoveFavorite,
  isRemovingFavorite,
}: Readonly<{
  item: StockScreenerMonitoringItem;
  onRemoveFavorite: (providerKey: string) => void;
  isRemovingFavorite: boolean;
}>) {
  const { card } = item;
  const visual = resolveInstrumentVisual({
    symbol: card.symbol,
    name: card.name,
  });
  const isHydrating = card.isHydrating === true;
  const showRemoveStar = card.isFavorite && !card.inPortfolio;

  return (
    <div className="h-60">
      <div
        className={cn(
          cardVariants(),
          "group relative h-full rounded-sm border-border/25 p-3 transition-colors duration-150 hover:border-primary/35 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_3px_rgba(40,30,18,0.12),0_18px_34px_-24px_rgba(40,30,18,0.55)]"
        )}
      >
        {showRemoveStar ? (
          <Button
            className="absolute right-3 top-3 z-20 size-7 border-amber-400/60 bg-background/92 text-amber-500 shadow-none hover:bg-background"
            type="button"
            size="icon"
            variant="outline"
            title="Usuń z obserwowanych"
            aria-label={`Usuń ${card.symbol} z obserwowanych`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemoveFavorite(card.providerKey);
            }}
            disabled={isRemovingFavorite}
          >
            {isRemovingFavorite ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Star className="size-4 fill-current" aria-hidden />
            )}
          </Button>
        ) : null}

        <Link
          href={`/stocks/${encodeURIComponent(card.providerKey)}`}
          className="block h-full"
        >
          <div className="flex h-full flex-col">
            <div className="mb-4 flex min-w-0 items-start gap-3">
              <InstrumentLogoImage
                src={card.logoUrl}
                size={36}
                fallbackText={visual.label}
                ticker={visual.logoTicker}
                alt={card.name}
              />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex rounded-full border border-border/60 bg-background/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/85"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate pr-9 font-mono text-[13px] font-semibold tracking-tight">
                      {card.symbol}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {card.name}
                    </p>
                  </div>
                  <p className="shrink-0 pt-0.5 text-right font-mono text-[13px] font-semibold tabular-nums text-foreground/90">
                    {isHydrating ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" aria-hidden />
                        Ładowanie
                      </span>
                    ) : (
                      <PriceLabel label={formatPrice(card.price, card.currency)} />
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {isHydrating ? (
                    <span className="inline-flex h-4 w-16 animate-pulse rounded bg-muted/70" />
                  ) : (
                    <ChangePill
                      value={item.moveLabel}
                      trend={item.trend}
                      className="rounded-sm px-1.5 py-0 text-[11px]"
                    />
                  )}
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/65">
                    Raport
                  </span>
                </div>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 rounded-sm border border-border/45 bg-muted/12 px-1 py-1">
              {isHydrating ? (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-sm bg-background/55 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span className="text-[11px] font-medium">Ładowanie danych...</span>
                </div>
              ) : (
                <StockScreenerPreviewChartLazy
                  data={item.previewData}
                  currency={card.currency}
                />
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function StockScreenerGrid({
  title,
  description,
  items,
  emptyMessage,
  className,
  onRemoveFavorite,
  isRemovingFavorite,
}: StockScreenerGridProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground/75">
          {items.length} pozycji
        </p>
      </header>

      {items.length === 0 ? (
        <div
          className={cn(
            cardVariants(),
            "rounded-sm border-border/55 px-5 py-6 text-sm text-muted-foreground"
          )}
        >
          {emptyMessage}
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-4"
          )}
        >
          {items.map((item) => (
            <SectionCard
              key={item.card.providerKey}
              item={item}
              onRemoveFavorite={onRemoveFavorite}
              isRemovingFavorite={isRemovingFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}
