import { multiplyDecimals, parseDecimalString } from "@/lib/decimal";

import type { CurrencyCode, FxRate } from "@/features/market-data";
import type { PortfolioHolding } from "./get-portfolio-holdings";
import type { ValuedHolding } from "./valuation";

type ToBasePriceInput = Readonly<{
  price: string | undefined;
  fromCurrency: CurrencyCode;
  baseCurrency: CurrencyCode;
  fxByPair: ReadonlyMap<string, FxRate | null>;
}>;

type HoldingBase = Pick<
  ValuedHolding,
  | "instrumentId"
  | "provider"
  | "providerKey"
  | "symbol"
  | "name"
  | "exchange"
  | "currency"
  | "logoUrl"
  | "instrumentType"
  | "quantity"
>;

type BuildHoldingInput = Readonly<{
  averageBuyPriceBase?: string | null;
  price: string | null;
  valueBase: string | null;
  todayChangeBase?: string | null;
  todayChangePercent?: number | null;
  missingReason: ValuedHolding["missingReason"];
}>;

export const minIso = (values: readonly string[]) =>
  values.length === 0
    ? null
    : values.reduce((min, value) => (value < min ? value : min));

export function toBasePriceOrNull(input: ToBasePriceInput): string | null {
  if (!input.price) return null;

  const priceDecimal = parseDecimalString(input.price);
  if (!priceDecimal) return null;

  if (input.fromCurrency === input.baseCurrency) {
    return priceDecimal.toString();
  }

  const fx = input.fxByPair.get(`${input.fromCurrency}:${input.baseCurrency}`);
  if (!fx) return null;

  const fxDecimal = parseDecimalString(fx.rate);
  if (!fxDecimal) return null;

  return multiplyDecimals(priceDecimal, fxDecimal).toString();
}

export const toHoldingBase = (holding: PortfolioHolding): HoldingBase => ({
  instrumentId: holding.instrumentId,
  provider: holding.provider,
  providerKey: holding.providerKey,
  symbol: holding.symbol,
  name: holding.name,
  exchange: holding.exchange,
  currency: holding.currency,
  logoUrl: holding.logoUrl,
  instrumentType: holding.instrumentType,
  quantity: holding.quantity,
});

const buildHolding = (base: HoldingBase, input: BuildHoldingInput): ValuedHolding => ({
  ...base,
  averageBuyPriceBase: input.averageBuyPriceBase ?? null,
  price: input.price,
  valueBase: input.valueBase,
  weight: null,
  todayChangeBase: input.todayChangeBase,
  todayChangePercent: input.todayChangePercent,
  missingReason: input.missingReason,
});

export const toMissingQuoteHolding = (
  base: HoldingBase,
  averageBuyPriceBase: string | null = null
): ValuedHolding =>
  buildHolding(base, {
    averageBuyPriceBase,
    price: null,
    valueBase: null,
    missingReason: "MISSING_QUOTE",
  });

export const toMissingFxHolding = (
  base: HoldingBase,
  input: Readonly<{
    averageBuyPriceBase?: string | null;
    price: string;
    todayChangeBase?: string | null;
    todayChangePercent?: number | null;
  }>
): ValuedHolding =>
  buildHolding(base, {
    averageBuyPriceBase: input.averageBuyPriceBase ?? null,
    price: input.price,
    valueBase: null,
    todayChangeBase: input.todayChangeBase,
    todayChangePercent: input.todayChangePercent,
    missingReason: "MISSING_FX",
  });

export const toValuedHolding = (
  base: HoldingBase,
  input: Readonly<{
    averageBuyPriceBase?: string | null;
    price: string;
    valueBase: string;
    todayChangeBase?: string | null;
    todayChangePercent?: number | null;
  }>
): ValuedHolding =>
  buildHolding(base, {
    averageBuyPriceBase: input.averageBuyPriceBase ?? null,
    price: input.price,
    valueBase: input.valueBase,
    todayChangeBase: input.todayChangeBase,
    todayChangePercent: input.todayChangePercent,
    missingReason: null,
  });
