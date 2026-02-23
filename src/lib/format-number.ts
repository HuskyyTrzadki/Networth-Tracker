import { parseDecimalString, toFixedDecimalString } from "@/lib/decimal";

type FormatGroupedNumberInput = string | number | null | undefined;

type FormatGroupedNumberOptions = Readonly<{
  locale?: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  trimTrailingZeros?: boolean;
}>;

const getLocaleSeparators = (locale: string) => {
  const parts = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(1000.1);
  const group = parts.find((part) => part.type === "group")?.value ?? " ";
  const decimal = parts.find((part) => part.type === "decimal")?.value ?? ",";
  return { group, decimal };
};

const stripTrailingZeros = (value: string) => {
  if (!value.includes(".")) return value;
  return value.replace(/\.?0+$/, "");
};

const groupInteger = (digitsRaw: string, groupSeparator: string) => {
  const digits = digitsRaw.replace(/^0+(?=\d)/, "") || "0";
  const chunks: string[] = [];

  for (let index = digits.length; index > 0; index -= 3) {
    chunks.push(digits.slice(Math.max(0, index - 3), index));
  }

  return chunks.reverse().join(groupSeparator);
};

export const formatGroupedNumber = (
  value: FormatGroupedNumberInput,
  options: FormatGroupedNumberOptions = {}
): string | null => {
  const parsed = parseDecimalString(value);
  if (!parsed) return null;

  const locale = options.locale ?? "pl-PL";
  const minFractionDigits = Math.max(0, options.minFractionDigits ?? 0);
  const maxFractionDigits = Math.max(
    minFractionDigits,
    options.maxFractionDigits ?? 8
  );
  const trimTrailingZeros = options.trimTrailingZeros ?? true;

  const fixedMax = toFixedDecimalString(parsed, maxFractionDigits);
  const normalized = trimTrailingZeros ? stripTrailingZeros(fixedMax) : fixedMax;

  const [integerPartRaw, fractionPartRaw = ""] = normalized.replace("-", "").split(".");
  const isNegative = normalized.startsWith("-");

  const { group, decimal } = getLocaleSeparators(locale);
  const integerPart = groupInteger(integerPartRaw || "0", group);

  const fractionPart =
    fractionPartRaw.length > 0 || minFractionDigits > 0
      ? fractionPartRaw.padEnd(minFractionDigits, "0")
      : "";

  return `${isNegative ? "-" : ""}${integerPart}${fractionPart ? `${decimal}${fractionPart}` : ""}`;
};

