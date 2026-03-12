"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { Button } from "@/features/design-system/components/ui/button";
import { addStockWatchlistAction, removeStockWatchlistAction } from "@/features/stocks/server/watchlist-actions";
import type { StockScreenerCard } from "@/features/stocks/server/types";
import { InstrumentCombobox } from "@/features/transactions/components/InstrumentCombobox";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";

type FavoriteAction =
  | Readonly<{ type: "add"; providerKey: string }>
  | Readonly<{ type: "remove"; providerKey: string }>;

const reduceFavorites = (
  state: readonly string[],
  action: FavoriteAction
): readonly string[] => {
  if (action.type === "add") {
    if (state.includes(action.providerKey)) return state;
    return [...state, action.providerKey];
  }
  return state.filter((providerKey) => providerKey !== action.providerKey);
};

const buildOptimisticCard = (
  option: InstrumentSearchResult
): StockScreenerCard => ({
  providerKey: option.providerKey,
  symbol: (option.ticker || option.symbol || option.providerKey).toUpperCase(),
  name: option.name,
  logoUrl: option.logoUrl ?? null,
  inPortfolio: false,
  isFavorite: true,
  isHydrating: true,
  currency: option.currency.trim().toUpperCase(),
  price: null,
  previewChart: [],
  asOf: null,
});

type Props = Readonly<{
  initialFavoriteProviderKeys?: readonly string[];
  onOptimisticAdd?: (card: StockScreenerCard) => void;
  onOptimisticRemove?: (providerKey: string) => void;
}>;

export function StockSearchBar({
  initialFavoriteProviderKeys = [],
  onOptimisticAdd,
  onOptimisticRemove,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState<InstrumentSearchResult | null>(null);
  const [pendingProviderKeys, setPendingProviderKeys] = useState<
    ReadonlySet<string>
  >(new Set<string>());
  const [, startTransition] = useTransition();
  const [favoriteProviderKeys, applyFavorite] = useOptimistic(
    initialFavoriteProviderKeys,
    reduceFavorites
  );

  const setPending = (providerKey: string, enabled: boolean) => {
    setPendingProviderKeys((current) => {
      const next = new Set(current);
      if (enabled) {
        next.add(providerKey);
      } else {
        next.delete(providerKey);
      }
      return next;
    });
  };

  const toggleFavorite = (option: InstrumentSearchResult) => {
    const providerKey = option.providerKey;
    if (pendingProviderKeys.has(providerKey)) return;

    const wasFavorite = favoriteProviderKeys.includes(providerKey);
    const optimisticCard = buildOptimisticCard(option);
    setPending(providerKey, true);

    startTransition(() => {
      if (wasFavorite) {
        applyFavorite({ type: "remove", providerKey });
        onOptimisticRemove?.(providerKey);
      } else {
        applyFavorite({ type: "add", providerKey });
        onOptimisticAdd?.(optimisticCard);
      }

      const action = wasFavorite
        ? removeStockWatchlistAction(providerKey).then(() => ({ created: false }))
        : addStockWatchlistAction({
            providerKey,
            symbol: optimisticCard.symbol,
            name: option.name,
            currency: optimisticCard.currency,
            logoUrl: option.logoUrl ?? null,
            instrumentType: option.instrumentType,
          });

      void action.catch((error: unknown) => {
          if (wasFavorite) {
            applyFavorite({ type: "add", providerKey });
            onOptimisticAdd?.({ ...optimisticCard, isHydrating: false });
          } else {
            applyFavorite({ type: "remove", providerKey });
            onOptimisticRemove?.(providerKey);
          }

          const message = error instanceof Error ? error.message : "";
          if (message === "UNAUTHORIZED") {
            router.push("/login?next=%2Fstocks");
            return;
          }

          dispatchAppToast({
            tone: "destructive",
            title: wasFavorite
              ? "Nie udało się usunąć spółki z obserwowanych."
              : "Nie udało się dodać spółki do obserwowanych.",
            description: message || "Spróbuj ponownie za chwilę.",
          });
        }).finally(() => {
          setPending(providerKey, false);
        });
    });
  };

  return (
    <InstrumentCombobox
      value={value}
      listenForFocusShortcut
      showSelectedIndicator={false}
      emptyLabel="Szukaj instrumentu po nazwie lub tickerze"
      queryPlaceholder="Szukaj (np. AAPL, MSFT, CDR)"
      triggerClassName="h-11 rounded-md bg-background"
      onChange={(next) => {
        setValue(next);
        router.push(`/stocks/${encodeURIComponent(next.providerKey)}`);
      }}
      renderItemAction={(option) => (
        <Button
          size="icon"
          type="button"
          variant="ghost"
          className="size-7 cursor-pointer text-muted-foreground hover:text-amber-500"
          aria-label={
            favoriteProviderKeys.includes(option.providerKey)
              ? `Usuń ${option.ticker} z obserwowanych`
              : `Dodaj ${option.ticker} do obserwowanych`
          }
          title={
            favoriteProviderKeys.includes(option.providerKey)
              ? "Usuń z obserwowanych"
              : "Dodaj do obserwowanych"
          }
          disabled={pendingProviderKeys.has(option.providerKey)}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(option);
          }}
        >
          {pendingProviderKeys.has(option.providerKey) ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Star
              className={favoriteProviderKeys.includes(option.providerKey) ? "size-4 fill-current text-amber-500" : "size-4"}
              aria-hidden
            />
          )}
        </Button>
      )}
    />
  );
}
