import Big from "big.js";

Big.RM = 1;

type DecimalValue = Big;

const normalizeDecimalInput = (value: string) =>
  value.trim().replace(/\s+/g, "").replace(",", ".");

export function parseDecimalString(value: string): DecimalValue | null {
  const normalized = normalizeDecimalInput(value);
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

export function negateDecimal(value: DecimalValue): DecimalValue {
  return value.times(-1);
}

export function decimalZero(): DecimalValue {
  return new Big(0);
}

export type { DecimalValue };
