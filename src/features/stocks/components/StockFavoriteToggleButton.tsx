"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";
import {
  addStockWatchlistAction,
  removeStockWatchlistAction,
} from "@/features/stocks/server/watchlist-actions";

import {
  getStockWatchlistStatus,
} from "../client/stock-watchlist";

type Props = Readonly<{
  providerKey: string;
  symbol: string;
  name: string;
  currency: string;
  logoUrl: string | null;
  className?: string;
}>;

export function StockFavoriteToggleButton({
  providerKey,
  symbol,
  name,
  currency,
  logoUrl,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    void getStockWatchlistStatus(providerKey)
      .then((result) => {
        if (cancelled) return;
        setIsFavorite(result.isFavorite);
      })
      .catch(() => {
        if (cancelled) return;
        setIsFavorite(false);
      })
      .finally(() => {
        if (cancelled) return;
        setIsHydrating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [providerKey]);

  const onToggle = () => {
    if (isPending) return;
    const nextFavorite = !isFavorite;

    startTransition(() => {
      setIsFavorite(nextFavorite);

      const call = isFavorite
        ? removeStockWatchlistAction(providerKey)
        : addStockWatchlistAction({
            providerKey,
            symbol,
            name,
            currency,
            logoUrl,
          });

      void call.catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "";
          setIsFavorite(!nextFavorite);
          if (message === "UNAUTHORIZED") {
            const nextPath = pathname || `/stocks/${encodeURIComponent(providerKey)}`;
            router.push(`/login?next=${encodeURIComponent(nextPath)}`);
            return;
          }
          dispatchAppToast({
            tone: "destructive",
            title: "Nie udało się zaktualizować widoku.",
            description: message || "Spróbuj ponownie za chwilę.",
          });
        });
    });
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={isFavorite ? "default" : "outline"}
      className={cn(
        "size-9 cursor-pointer",
        isFavorite
          ? "bg-amber-500/90 text-amber-950 hover:bg-amber-500"
          : "border-black/20 bg-background/90 text-muted-foreground hover:text-foreground",
        className
      )}
      disabled={isPending || isHydrating}
      onClick={onToggle}
      aria-label={isFavorite ? "Usuń z widoku" : "Dodaj do widoku"}
      title={isFavorite ? "Usuń z widoku" : "Dodaj do widoku"}
    >
      {isPending || isHydrating ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Star className={cn("size-4", isFavorite && "fill-current")} aria-hidden />
      )}
    </Button>
  );
}
