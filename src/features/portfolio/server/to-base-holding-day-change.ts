import {
  multiplyDecimals,
  parseDecimalString,
  type DecimalValue,
} from "@/lib/decimal";
import type { CurrencyCode, FxRate } from "@/features/market-data";

type Input = Readonly<{
  quantity: string;
  dayChange: string | null | undefined;
  fromCurrency: CurrencyCode;
  baseCurrency: CurrencyCode;
  fxByPair: ReadonlyMap<string, FxRate | null>;
}>;

export function toBaseHoldingDayChangeOrNull(input: Input): string | null {
  // Backend helper: convert one-day price delta to portfolio base currency and
  // multiply it by held quantity to get total daily P&L for this position.
  if (!input.dayChange) return null;

  const quantityDecimal = parseDecimalString(input.quantity);
  const dayChangeDecimal = parseDecimalString(input.dayChange);
  if (!quantityDecimal || !dayChangeDecimal) return null;

  const dayChangeInBase =
    input.fromCurrency === input.baseCurrency
      ? dayChangeDecimal
      : convertToBaseOrNull(dayChangeDecimal, input.fromCurrency, input.baseCurrency, input.fxByPair);

  if (!dayChangeInBase) return null;

  return multiplyDecimals(quantityDecimal, dayChangeInBase).toString();
}

function convertToBaseOrNull(
  amount: DecimalValue,
  fromCurrency: CurrencyCode,
  baseCurrency: CurrencyCode,
  fxByPair: ReadonlyMap<string, FxRate | null>
) {
  const fx = fxByPair.get(`${fromCurrency}:${baseCurrency}`);
  if (!fx) return null;

  const fxDecimal = parseDecimalString(fx.rate);
  if (!fxDecimal) return null;

  return multiplyDecimals(amount, fxDecimal);
}
