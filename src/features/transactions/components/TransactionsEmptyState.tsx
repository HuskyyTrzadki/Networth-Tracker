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
    ? `Nie znaleziono transakcji dla "${query}".`
    : "Brak transakcji do wyświetlenia.";

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border bg-card",
        "px-6 py-10 text-center text-sm text-muted-foreground"
      )}
    >
      <p>{message}</p>
      <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {query ? (
          <Link className={buttonVariants({ variant: "outline" })} href={clearSearchHref}>
            Wyczyść wyszukiwanie
          </Link>
        ) : null}
        <Link className={buttonVariants()} href={addTransactionHref} scroll={false}>
          Dodaj transakcję
        </Link>
      </div>
    </div>
  );
}
