"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";
import {
  addStockWatchlistAction,
  removeStockWatchlistAction,
} from "@/features/stocks/server/watchlist-actions";

type Props = Readonly<{
  initialIsFavorite: boolean;
  providerKey: string;
  symbol: string;
  name: string;
  currency: string;
  logoUrl: string | null;
  className?: string;
}>;

export function StockFavoriteToggleButton({
  initialIsFavorite,
  providerKey,
  symbol,
  name,
  currency,
  logoUrl,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFavorite, setOptimisticFavorite] = useOptimistic(
    initialIsFavorite,
    (_, next: boolean) => next
  );
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    if (isPending) return;
    const nextFavorite = !isFavorite;

    startTransition(() => {
      setOptimisticFavorite(nextFavorite);

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
          setOptimisticFavorite(!nextFavorite);
          if (message === "UNAUTHORIZED") {
            const nextPath = pathname || `/stocks/${encodeURIComponent(providerKey)}`;
            router.push(`/login?next=${encodeURIComponent(nextPath)}`);
            return;
          }
          dispatchAppToast({
            tone: "destructive",
            title: "Nie udało się zaktualizować obserwowanych.",
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
      disabled={isPending}
      onClick={onToggle}
      aria-label={isFavorite ? "Usuń z obserwowanych" : "Dodaj do obserwowanych"}
      title={isFavorite ? "Usuń z obserwowanych" : "Dodaj do obserwowanych"}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Star className={cn("size-4", isFavorite && "fill-current")} aria-hidden />
      )}
    </Button>
  );
}
