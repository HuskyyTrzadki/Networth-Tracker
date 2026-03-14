"use client";

import { useState } from "react";
import { useOptimistic, useTransition } from "react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import type { StockScreenerCard } from "@/features/stocks/types";
import { removeStockWatchlistAction } from "@/features/stocks/server/watchlist-actions";
import {
  STOCK_SCREENER_PREVIEW_RANGES,
  type StockScreenerPreviewRange,
} from "@/features/stocks/server/types";
import { cn } from "@/lib/cn";

import { StockScreenerGrid } from "./StockScreenerGrid";
import { StockScreenerLeadCard } from "./StockScreenerLeadCard";
import { StockSearchBar } from "./StockSearchBar";
import { buildStockScreenerMonitoringSections } from "./stock-screener-monitoring";

type Props = Readonly<{
  cards: readonly StockScreenerCard[];
  favoriteProviderKeys: readonly string[];
}>;

type OptimisticAction =
  | Readonly<{ type: "add"; card: StockScreenerCard }>
  | Readonly<{ type: "remove"; providerKey: string }>
  | Readonly<{ type: "restore"; card: StockScreenerCard }>;

const sortCards = (entries: readonly StockScreenerCard[]) =>
  [...entries].sort((left, right) => left.symbol.localeCompare(right.symbol, "pl-PL"));

const reduceOptimisticCards = (
  current: readonly StockScreenerCard[],
  action: OptimisticAction
): readonly StockScreenerCard[] => {
  if (action.type === "remove") {
    const existing = current.find((card) => card.providerKey === action.providerKey);
    if (!existing) return current;
    if (existing.inPortfolio) {
      return current.map((card) =>
        card.providerKey === action.providerKey
          ? { ...card, isFavorite: false, isHydrating: false }
          : card
      );
    }
    return current.filter((card) => card.providerKey !== action.providerKey);
  }

  if (action.type === "restore") {
    const hasExisting = current.some(
      (card) => card.providerKey === action.card.providerKey
    );
    if (!hasExisting) return sortCards([...current, action.card]);
    return sortCards(
      current.map((card) =>
        card.providerKey === action.card.providerKey ? action.card : card
      )
    );
  }

  const existing = current.find(
    (card) => card.providerKey === action.card.providerKey
  );
  if (!existing) return sortCards([...current, action.card]);

  return sortCards(
    current.map((card) =>
      card.providerKey === action.card.providerKey
        ? {
            ...card,
            isFavorite: true,
            isHydrating: action.card.isHydrating ?? card.isHydrating,
            name: card.name || action.card.name,
            symbol: card.symbol || action.card.symbol,
            logoUrl: card.logoUrl ?? action.card.logoUrl,
            currency: card.currency || action.card.currency,
          }
        : card
    )
  );
};

const statCardClassName =
  "rounded-sm border border-border/55 bg-background/78 px-3 py-3";

export function StocksScreenerInteractive({
  cards,
  favoriteProviderKeys,
}: Props) {
  const [selectedRange, setSelectedRange] =
    useState<StockScreenerPreviewRange>("1M");
  const [isRemovingFavorite, startRemoveTransition] = useTransition();
  const [optimisticCards, applyOptimistic] = useOptimistic(
    cards,
    reduceOptimisticCards
  );

  const monitoring = buildStockScreenerMonitoringSections(
    optimisticCards,
    selectedRange
  );

  const onRemoveFavorite = (providerKey: string) => {
    const previousCard =
      optimisticCards.find((card) => card.providerKey === providerKey) ?? null;

    startRemoveTransition(() => {
      applyOptimistic({ type: "remove", providerKey });
      void removeStockWatchlistAction(providerKey).catch((error: unknown) => {
        if (previousCard) {
          applyOptimistic({ type: "restore", card: previousCard });
        }

        dispatchAppToast({
          tone: "destructive",
          title: "Nie udało się usunąć spółki z obserwowanych.",
          description:
            error instanceof Error && error.message.length > 0
              ? error.message
              : "Spróbuj ponownie za chwilę.",
        });
      });
    });
  };

  return (
    <>
      <section className="border-b border-dashed border-black/15 pb-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.82fr)] xl:items-start">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/75">
                Pulpit monitoringu
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.1rem]">
                Akcje
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className={statCardClassName}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  W portfelu
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                  {monitoring.holdingCount}
                </p>
              </div>
              <div className={statCardClassName}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Na dipie
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                  {monitoring.dipCount}
                </p>
              </div>
              <div className={statCardClassName}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Obserwowane
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                  {monitoring.watchlistCount}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-dashed border-black/10 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/75">
                Zakres podglądu
              </p>
              <ToggleGroup
                type="single"
                value={selectedRange}
                onValueChange={(value) => {
                  if (!value) return;
                  setSelectedRange(value as StockScreenerPreviewRange);
                }}
                className="gap-1"
                aria-label="Zakres wykresów akcji"
              >
                {STOCK_SCREENER_PREVIEW_RANGES.map((range) => (
                  <ToggleGroupItem
                    key={range}
                    value={range}
                    variant="ledger"
                    size="sm"
                    className={cn(
                      "rounded-sm px-3 font-mono text-[11px]",
                      range === selectedRange
                        ? "border-border/80 bg-background"
                        : "border-transparent bg-transparent text-muted-foreground hover:border-border/50 hover:bg-background/75"
                    )}
                  >
                    {range}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          <aside className="rounded-sm border border-border/60 bg-card/95 p-4 shadow-[var(--surface-shadow)] xl:mt-0.5">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/75">
                Szukaj spółki
              </p>
              <h2 className="text-lg font-semibold tracking-tight">
                Otwórz raport albo dodaj do obserwowanych
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Szukaj po nazwie lub tickerze. Gwiazdka dodaje do obserwowanych.
              </p>
            </div>

            <div className="mt-3">
              <StockSearchBar
                initialFavoriteProviderKeys={favoriteProviderKeys}
                onOptimisticAdd={(card) => {
                  applyOptimistic({ type: "add", card });
                }}
                onOptimisticRemove={(providerKey) => {
                  applyOptimistic({ type: "remove", providerKey });
                }}
              />
            </div>
          </aside>
        </div>
      </section>

      {monitoring.lead ? <StockScreenerLeadCard item={monitoring.lead} /> : null}

      <div className="mt-7 space-y-8">
        <StockScreenerGrid
          title="W portfelu"
          description={`Twoje aktywne pozycje posortowane według ruchu za ${selectedRange}.`}
          items={monitoring.portfolio}
          emptyMessage="Nie masz jeszcze akcji w portfelach. Dodaj transakcję akcji albo przypnij spółkę do obserwowanych."
          onRemoveFavorite={onRemoveFavorite}
          isRemovingFavorite={isRemovingFavorite}
        />

        <StockScreenerGrid
          title="Obserwowane"
          description={`Spółki poza portfelem, które warto mieć pod ręką w tym samym rytmie przeglądu.`}
          items={monitoring.watchlist}
          emptyMessage="Nie masz jeszcze obserwowanych spółek. Dodaj je z wyszukiwarki u góry, żeby zbudować własny radar."
          onRemoveFavorite={onRemoveFavorite}
          isRemovingFavorite={isRemovingFavorite}
        />
      </div>
    </>
  );
}
