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
  splitCurrencyLabel,
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
      <div className="rounded-md border border-border/70 bg-muted/15 p-3.5">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {type === "BUY" ? "Łącznie (koszt)" : "Łącznie (przychód netto)"}
          </span>
          <span className="justify-self-end text-right text-sm text-muted-foreground">
            Uzupełnij dane
          </span>
        </div>
      </div>
    );
  }

  const valueLabel = formatCurrencyValue(value, formatter);
  const feeLabel = formatCurrencyValue(signedFee, formatter);
  const totalLabel = formatCurrencyValue(total, formatter);

  return (
    <div className="rounded-md border border-border/70 bg-muted/15 p-3.5">
      <div className="grid gap-2.5">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 text-sm">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Wartość
          </span>
          <SummaryAmount label={valueLabel} />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 text-sm">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Prowizja
          </span>
          <SummaryAmount label={feeLabel} />
        </div>
        <div className="mt-0.5 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-border/70 pt-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground">
            {type === "BUY" ? "Łącznie (koszt)" : "Łącznie (przychód netto)"}
          </span>
          <SummaryAmount label={totalLabel} strong />
        </div>
      </div>
    </div>
  );
}

function SummaryAmount({
  label,
  strong = false,
}: Readonly<{ label: string; strong?: boolean }>) {
  const parts = splitCurrencyLabel(label);

  return (
    <span className="justify-self-end whitespace-nowrap text-right font-mono tabular-nums text-foreground">
      <span
        className={strong ? "text-base font-semibold tracking-tight" : "text-sm font-medium"}
      >
        {parts.amount}
      </span>
      {parts.currency ? (
        <span className="ml-1 text-[11px] font-medium text-muted-foreground/80">
          {parts.currency}
        </span>
      ) : null}
    </span>
  );
}
