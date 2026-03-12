import Link from "next/link";
import { buttonVariants } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  addTransactionHref: string;
  clearSearchHref: string;
  query: string | null;
}>;

export function TransactionsEmptyState({
  addTransactionHref,
  clearSearchHref,
  query,
}: Props) {
  const message = query
    ? `Nie znaleźliśmy transakcji dla "${query}". Spróbuj innej frazy albo wyczyść filtry.`
    : "Nie masz jeszcze żadnych transakcji. Dodaj pierwszą, aby zobaczyć historię operacji.";

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border/70 bg-background/68",
        "px-6 py-12 text-center"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
        Brak transakcji
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {query ? (
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "h-9 rounded-full px-4 text-xs",
            })}
            href={clearSearchHref}
          >
            Wyczyść filtry
          </Link>
        ) : null}
        <Link
          className={buttonVariants({ className: "h-9 rounded-full px-4 text-xs" })}
          href={addTransactionHref}
          scroll={false}
        >
          Dodaj transakcję
        </Link>
      </div>
    </div>
  );
}
