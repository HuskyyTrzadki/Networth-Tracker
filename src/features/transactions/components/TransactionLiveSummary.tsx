"use client";

import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  negateDecimal,
  parseDecimalString,
  toFixedDecimalString,
  type DecimalValue,
} from "../lib/decimal";

const groupSeparator =
  new Intl.NumberFormat("pl-PL", { useGrouping: true })
    .formatToParts(1000)
    .find((part) => part.type === "group")?.value ?? " ";

const formatGroupedInteger = (value: string) => {
  const digits = value.replace(/^0+(?=\d)/, "") || "0";
  const chunks: string[] = [];

  for (let i = digits.length; i > 0; i -= 3) {
    chunks.push(digits.slice(Math.max(0, i - 3), i));
  }

  return chunks.reverse().join(groupSeparator);
};

const formatCurrencyFromFixed = (
  fixedValue: string,
  formatter: Intl.NumberFormat
) => {
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const negative = fixedValue.startsWith("-");
  const raw = negative ? fixedValue.slice(1) : fixedValue;
  const [integerRaw, fractionRaw = ""] = raw.split(".");
  const integer = formatGroupedInteger(integerRaw || "0");
  const fraction = fractionRaw
    .padEnd(fractionDigits, "0")
    .slice(0, fractionDigits);

  return formatter
    .formatToParts(negative ? -1 : 1)
    .map((part) => {
      if (part.type === "integer") return integer;
      if (part.type === "fraction") return fraction;
      if (part.type === "decimal") {
        return fractionDigits > 0 ? part.value : "";
      }
      return part.value;
    })
    .join("");
};

const formatCurrencyValue = (
  value: DecimalValue,
  formatter: Intl.NumberFormat
) => {
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const fixed = toFixedDecimalString(value, fractionDigits);
  return formatCurrencyFromFixed(fixed, formatter);
};

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

  const canFormat = currency.length === 3;
  const formatter = canFormat
    ? new Intl.NumberFormat("pl-PL", { style: "currency", currency })
    : null;

  if (!canFormat || value === null || total === null || !formatter || signedFee === null) {
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
            {formatCurrencyValue(value, formatter)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Prowizja</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatCurrencyValue(signedFee, formatter)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <span className="text-sm font-medium text-foreground">
            {type === "BUY" ? "Łącznie (koszt)" : "Łącznie (przychód netto)"}
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">
            {formatCurrencyValue(total, formatter)}
          </span>
        </div>
      </div>
    </div>
  );
}
