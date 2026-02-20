import Big from "big.js";

Big.DP = 8;
Big.RM = Big.roundHalfUp;

type DecimalValue = Big;

const normalizeDecimalInput = (value: string) =>
  value.trim().replace(/\s+/g, "").replace(",", ".");

export function parseDecimalString(
  value: string | number | null | undefined
): DecimalValue | null {
  if (value === null || value === undefined) return null;

  const stringValue = typeof value === "number" ? value.toString() : value;
  if (typeof stringValue !== "string") return null;

  const normalized = normalizeDecimalInput(stringValue);
  if (!normalized) return null;

  try {
    return new Big(normalized);
  } catch {
    return null;
  }
}

export function multiplyDecimals(a: DecimalValue, b: DecimalValue): DecimalValue {
  return a.times(b);
}

export function addDecimals(a: DecimalValue, b: DecimalValue): DecimalValue {
  return a.plus(b);
}

export function toFixedDecimalString(value: DecimalValue, fractionDigits: number) {
  return value.toFixed(fractionDigits);
}

export function divideDecimals(a: DecimalValue, b: DecimalValue): DecimalValue {
  return a.div(b);
}

export function negateDecimal(value: DecimalValue): DecimalValue {
  return value.times(-1);
}

export function decimalZero(): DecimalValue {
  return new Big(0);
}

export function decimalOne(): DecimalValue {
  return new Big(1);
}

export type { DecimalValue };
