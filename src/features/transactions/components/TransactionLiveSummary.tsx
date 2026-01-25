"use client";

import { parseDecimalInput } from "../lib/parse-decimal";

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
  const parsedQuantity = parseDecimalInput(quantity);
  const parsedPrice = parseDecimalInput(price);
  const parsedFee = parseDecimalInput(fee) ?? 0;

  const value =
    parsedQuantity !== null && parsedPrice !== null
      ? parsedQuantity * parsedPrice
      : null;

  const signedFee = type === "BUY" ? parsedFee : -parsedFee;
  const total = value !== null ? value + signedFee : null;

  const canFormat = currency.length === 3;
  const formatter = canFormat
    ? new Intl.NumberFormat("pl-PL", { style: "currency", currency })
    : null;

  if (!canFormat || value === null || total === null || !formatter) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
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
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Wartość</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatter.format(value)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Prowizja</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatter.format(signedFee)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <span className="text-sm font-medium text-foreground">
            {type === "BUY" ? "Łącznie (koszt)" : "Łącznie (przychód netto)"}
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">
            {formatter.format(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
