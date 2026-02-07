import { parseDecimalString } from "@/lib/decimal";

type SessionRange = Readonly<{
  low: string;
  high: string;
}>;

export const isPriceWithinSessionRange = (
  priceValue: string,
  range: SessionRange
): boolean | null => {
  const price = parseDecimalString(priceValue);
  const low = parseDecimalString(range.low);
  const high = parseDecimalString(range.high);

  if (!price || !low || !high) {
    return null;
  }

  return price.gte(low) && price.lte(high);
};

