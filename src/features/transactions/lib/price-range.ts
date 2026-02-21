import { parseDecimalString } from "@/lib/decimal";

type SessionRange = Readonly<{
  low: string;
  high: string;
}>;

const SESSION_RANGE_TOLERANCE = parseDecimalString("0.0001");

export const isPriceWithinSessionRange = (
  priceValue: string,
  range: SessionRange
): boolean | null => {
  const price = parseDecimalString(priceValue);
  const low = parseDecimalString(range.low);
  const high = parseDecimalString(range.high);

  if (!price || !low || !high || !SESSION_RANGE_TOLERANCE) {
    return null;
  }

  // Yahoo candles can carry tiny float artifacts (e.g. 88.519996) while user input
  // is rounded (e.g. 88.52). Keep strict validation, but tolerate sub-cent noise.
  return price.gte(low.minus(SESSION_RANGE_TOLERANCE)) &&
    price.lte(high.plus(SESSION_RANGE_TOLERANCE));
};
