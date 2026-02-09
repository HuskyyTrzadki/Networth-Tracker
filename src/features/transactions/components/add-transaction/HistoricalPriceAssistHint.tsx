import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";

import type { InstrumentPriceOnDateResponse } from "../../client/get-instrument-price-on-date";

type Props = Readonly<{
  hint: InstrumentPriceOnDateResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
}>;

export function HistoricalPriceAssistHint({
  hint,
  errorMessage,
  isLoading,
}: Props) {
  if (errorMessage) {
    return <p className="mt-2 text-xs text-destructive">{errorMessage}</p>;
  }

  if (isLoading) {
    return (
      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        Pobieram dane sesji historycznej...
      </div>
    );
  }

  if (!hint) {
    return null;
  }

  const isFilled = hint.isFilledFromPreviousSession;

  return (
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
      {hint.warning ? (
        <p className={cn(isFilled && "text-amber-600")}>{hint.warning}</p>
      ) : null}
    </div>
  );
}
