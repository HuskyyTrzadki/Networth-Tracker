import { cn } from "@/lib/cn";

import { formatMoney } from "./constants";
import type { InstrumentPriceOnDateResponse } from "../../client/get-instrument-price-on-date";

type Props = Readonly<{
  currency: string;
  hint: InstrumentPriceOnDateResponse | null;
  errorMessage: string | null;
}>;

export function HistoricalPriceAssistHint({
  currency,
  hint,
  errorMessage,
}: Props) {
  if (errorMessage) {
    return <p className="mt-2 text-xs text-destructive">{errorMessage}</p>;
  }

  if (!hint) {
    return null;
  }

  const rangeText = hint.range
    ? `${formatMoney(hint.range.low, currency)} - ${formatMoney(
        hint.range.high,
        currency
      )}`
    : null;
  const isFilled = hint.isFilledFromPreviousSession;

  return (
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
      {rangeText ? (
        <p>
          Zakres sesji {hint.marketDate ? `(${hint.marketDate})` : ""}: {rangeText}
        </p>
      ) : null}
      {hint.warning ? (
        <p className={cn(isFilled && "text-amber-600")}>{hint.warning}</p>
      ) : null}
    </div>
  );
}
