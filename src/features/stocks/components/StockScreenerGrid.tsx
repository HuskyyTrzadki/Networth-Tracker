"use client";

import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

import { ChangePill } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { cardVariants } from "@/features/design-system/components/ui/card";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { resolveInstrumentVisual } from "@/features/transactions/lib/instrument-visual";
import type { StockScreenerCard } from "@/features/stocks";
import { cn } from "@/lib/cn";
import { splitCurrencyLabel } from "@/lib/format-currency";
import { StockScreenerPreviewChartLazy } from "./StockScreenerPreviewChartLazy";

type StockScreenerGridProps = Readonly<{
  cards: readonly StockScreenerCard[];
  className?: string;
  onRemoveFavorite: (card: StockScreenerCard) => void;
  isRemovingFavorite: boolean;
}>;

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

function ScreenerPriceLabel({ label }: Readonly<{ label: string }>) {
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

export function StockScreenerGrid({
  cards,
  className,
  onRemoveFavorite,
  isRemovingFavorite,
}: StockScreenerGridProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  if (cards.length === 0) {
    return (
      <div className={cn(cardVariants(), "rounded-lg p-8 text-sm text-muted-foreground")}>
        Brak akcji w portfelu. Dodaj transakcje akcji, aby zbudować screener.
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-4",
          className
        )}
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        variants={
          prefersReducedMotion
            ? undefined
            : {
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.06,
                    delayChildren: 0.03,
                  },
                },
              }
        }
      >
        {cards.map((card) => {
          const visual = resolveInstrumentVisual({
            symbol: card.symbol,
            name: card.name,
          });
          const move = toTrend(card.monthChangePercent);
          const moveValue = move.text === "-" ? "-" : `1M ${move.text}`;
          const isHydrating = card.isHydrating === true;
          const showRemoveStar = card.isFavorite && !card.inPortfolio;

          return (
            <m.div
              key={card.providerKey}
              initial={prefersReducedMotion || isHydrating ? false : "hidden"}
              animate={prefersReducedMotion ? undefined : "visible"}
              variants={
                prefersReducedMotion
                  ? undefined
                  : {
                      hidden: { opacity: 0, y: 10 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.18, ease: [0.25, 1, 0.5, 1] },
                      },
                    }
              }
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: -2,
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 3px rgba(40,30,18,0.12), 0 18px 34px -24px rgba(40,30,18,0.55)",
                    }
              }
              transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
              className="h-52"
            >
              <div
                className={cn(
                  cardVariants(),
                  "group relative h-full border-border/20 p-2.5 transition-colors duration-150 hover:border-primary/35"
                )}
              >
                {showRemoveStar ? (
                  <Button
                    className="absolute right-2 top-2 z-20 size-7 border-amber-400/60 bg-background/90 text-amber-500 shadow-none hover:bg-background"
                    type="button"
                    size="icon"
                    variant="outline"
                    title="Usuń z widoku"
                    aria-label={`Usuń ${card.symbol} z widoku`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onRemoveFavorite(card);
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
                    <div className="mb-4 flex min-w-0 items-start gap-2.5">
                      <InstrumentLogoImage
                        src={card.logoUrl}
                        size={36}
                        fallbackText={visual.label}
                        ticker={visual.logoTicker}
                        alt={card.name}
                      />
                      <div className="min-w-0 flex-1">
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
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground",
                                  showRemoveStar && "pr-9"
                                )}
                              >
                                <Loader2 className="size-3 animate-spin" aria-hidden />
                                Ładowanie
                              </span>
                            ) : (
                              <span className={cn(showRemoveStar && "pr-9")}>
                                <ScreenerPriceLabel
                                  label={formatPrice(card.price, card.currency)}
                                />
                              </span>
                            )}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "mt-1.5 flex justify-end",
                            showRemoveStar && "pr-9"
                          )}
                        >
                          {isHydrating ? (
                            <span className="inline-flex h-4 w-16 animate-pulse rounded bg-muted/70" />
                          ) : (
                            <ChangePill
                              value={moveValue}
                              trend={move.trend}
                              className="rounded-sm px-1.5 py-0 text-[11px]"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative min-h-0 flex-1 rounded-sm border border-border/45 bg-muted/12 px-1 py-1">
                      {isHydrating ? (
                        <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-sm bg-background/55 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          <span className="text-[11px] font-medium">
                            Ładowanie danych...
                          </span>
                        </div>
                      ) : (
                        <StockScreenerPreviewChartLazy
                          data={card.monthChart}
                          currency={card.currency}
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            </m.div>
          );
        })}
      </m.div>
    </LazyMotion>
  );
}
