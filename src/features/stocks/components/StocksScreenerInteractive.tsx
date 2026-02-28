"use client";

import { useOptimistic, useTransition } from "react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import type { StockScreenerCard } from "@/features/stocks";
import { removeStockWatchlistAction } from "@/features/stocks/server/watchlist-actions";

import { StockScreenerGrid } from "./StockScreenerGrid";
import { StockSearchBar } from "./StockSearchBar";

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
    if (!hasExisting) {
      return sortCards([...current, action.card]);
    }
    return sortCards(
      current.map((card) =>
        card.providerKey === action.card.providerKey ? action.card : card
      )
    );
  }

  const existing = current.find(
    (card) => card.providerKey === action.card.providerKey
  );
  if (!existing) {
    return sortCards([...current, action.card]);
  }

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

export function StocksScreenerInteractive({
  cards,
  favoriteProviderKeys,
}: Props) {
  const [isRemovingFavorite, startRemoveTransition] = useTransition();
  const [optimisticCards, applyOptimistic] = useOptimistic(
    cards,
    reduceOptimisticCards
  );

  const onRemoveFavorite = (card: StockScreenerCard) => {
    startRemoveTransition(() => {
      applyOptimistic({ type: "remove", providerKey: card.providerKey });
      void removeStockWatchlistAction(card.providerKey).catch((error: unknown) => {
        applyOptimistic({ type: "restore", card });
        dispatchAppToast({
          tone: "destructive",
          title: "Nie udało się usunąć spółki.",
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
      <section className="rounded-xl border border-border/75 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/85">
              Screener
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Akcje</h1>
            <p className="text-sm text-muted-foreground">
              Twoje akcje z wszystkich portfeli w jednym miejscu.
            </p>
          </div>
          <div className="w-full max-w-xl space-y-2 lg:w-[26rem] lg:max-w-none">
            <p className="text-sm font-medium text-muted-foreground">
              Szukasz czegoś innego?
            </p>
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
        </header>
      </section>

      <StockScreenerGrid
        className="mt-5"
        cards={optimisticCards}
        onRemoveFavorite={onRemoveFavorite}
        isRemovingFavorite={isRemovingFavorite}
      />
    </>
  );
}
