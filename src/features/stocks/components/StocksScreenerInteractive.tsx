"use client";

import { useState } from "react";
import { useOptimistic, useTransition } from "react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/features/design-system/components/ui/toggle-group";
import type { StockScreenerCard } from "@/features/stocks";
import { removeStockWatchlistAction } from "@/features/stocks/server/watchlist-actions";
import { STOCK_SCREENER_PREVIEW_RANGES, type StockScreenerPreviewRange } from "@/features/stocks/server/types";

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
  const [selectedRange, setSelectedRange] =
    useState<StockScreenerPreviewRange>("1M");
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
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Akcje</h1>
            <p className="text-sm text-muted-foreground">Spółki z portfeli i obserwowanych.</p>
          </div>
          <div className="w-full max-w-xl lg:w-[26rem] lg:max-w-none">
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

        <div className="mt-4 flex items-center justify-start border-t border-dashed border-black/10 pt-4">
          <ToggleGroup
            type="single"
            value={selectedRange}
            onValueChange={(value) => {
              if (!value) return;
              setSelectedRange(value as StockScreenerPreviewRange);
            }}
            className="gap-1"
            aria-label="Zakres wykresow akcji"
          >
            {STOCK_SCREENER_PREVIEW_RANGES.map((range) => (
              <ToggleGroupItem
                key={range}
                value={range}
                variant="ledger"
                size="sm"
                className="rounded-none px-3 font-mono text-[11px]"
              >
                {range}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </section>

      <StockScreenerGrid
        className="mt-5"
        cards={optimisticCards}
        selectedRange={selectedRange}
        onRemoveFavorite={onRemoveFavorite}
        isRemovingFavorite={isRemovingFavorite}
      />
    </>
  );
}
