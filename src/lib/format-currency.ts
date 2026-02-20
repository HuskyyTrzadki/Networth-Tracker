import {
  parseDecimalString,
  toFixedDecimalString,
  type DecimalValue,
} from "./decimal";

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

export const getCurrencyFormatter = (currency: string) =>
  currency.length === 3
    ? new Intl.NumberFormat("pl-PL", { style: "currency", currency })
    : null;

export const formatCurrencyValue = (
  value: DecimalValue,
  formatter: Intl.NumberFormat
) => {
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const fixed = toFixedDecimalString(value, fractionDigits);
  return formatCurrencyFromFixed(fixed, formatter);
};

export const formatCurrencyString = (
  value: string | number | null | undefined,
  formatter: Intl.NumberFormat
) => {
  const parsed = parseDecimalString(value);
  if (!parsed) return null;

  return formatCurrencyValue(parsed, formatter);
};

export type CurrencyLabelParts = Readonly<{
  amount: string;
  currency: string | null;
}>;

export const splitCurrencyLabel = (label: string): CurrencyLabelParts => {
  const normalized = label.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.*?)[\s\u00A0\u202F]+([A-Z]{3}|zł)$/u);

  if (!match) {
    return { amount: normalized, currency: null };
  }

  return {
    amount: match[1]?.trim() ?? normalized,
    currency: match[2] ?? null,
  };
};
