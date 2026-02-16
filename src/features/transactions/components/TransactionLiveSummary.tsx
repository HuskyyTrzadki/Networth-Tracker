"use client";

import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  negateDecimal,
  parseDecimalString,
} from "@/lib/decimal";
import {
  formatCurrencyValue,
  getCurrencyFormatter,
} from "@/lib/format-currency";

type TransactionType = "BUY" | "SELL";

type Props = Readonly<{
  type: TransactionType;
  quantity: string;
  price: string;
  fee: string;
  currency: string;
}>;

export function TransactionLiveSummary({
  type,
  quantity,
  price,
  fee,
  currency,
}: Props) {
  const parsedQuantity = parseDecimalString(quantity);
  const parsedPrice = parseDecimalString(price);
  const parsedFee =
    fee.trim().length === 0 ? decimalZero() : parseDecimalString(fee);

  const value =
    parsedQuantity && parsedPrice
      ? multiplyDecimals(parsedQuantity, parsedPrice)
      : null;

  const signedFee =
    parsedFee !== null
      ? type === "BUY"
        ? parsedFee
        : negateDecimal(parsedFee)
      : null;

  const total =
    value && signedFee ? addDecimals(value, signedFee) : null;

  const formatter = getCurrencyFormatter(currency);

  if (value === null || total === null || !formatter || signedFee === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm text-muted-foreground">
            {type === "BUY" ? "Łącznie (koszt)" : "Łącznie (przychód netto)"}
          </span>
          <span className="text-sm text-muted-foreground">
            Uzupełnij dane
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="text-muted-foreground">Wartość</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatCurrencyValue(value, formatter)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="text-muted-foreground">Prowizja</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatCurrencyValue(signedFee, formatter)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-6 border-t border-border pt-3">
          <span className="text-sm font-medium text-foreground">
            {type === "BUY" ? "Łącznie (koszt)" : "Łącznie (przychód netto)"}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground md:text-base">
            {formatCurrencyValue(total, formatter)}
          </span>
        </div>
      </div>
    </div>
  );
}
