import { cn } from "@/lib/cn";

type Props = Readonly<{
  query: string | null;
}>;

export function TransactionsEmptyState({ query }: Props) {
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
      {message}
    </div>
  );
}
