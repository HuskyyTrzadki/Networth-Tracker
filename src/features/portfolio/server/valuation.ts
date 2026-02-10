import { addDecimals, decimalZero, multiplyDecimals, parseDecimalString } from "@/lib/decimal";

import type { CurrencyCode, FxRate, InstrumentQuote, InstrumentType } from "@/features/market-data";
import type { PortfolioHolding } from "./get-portfolio-holdings";
import { toBaseHoldingDayChangeOrNull } from "./to-base-holding-day-change";

export type ValuedHolding = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  exchange: string | null;
  currency: CurrencyCode;
  logoUrl: string | null;
  instrumentType: InstrumentType | null;
  quantity: string;
  averageBuyPriceBase?: string | null;
  price: string | null;
  valueBase: string | null;
  weight: number | null;
  todayChangeBase?: string | null;
  todayChangePercent?: number | null;
  missingReason: null | "MISSING_QUOTE" | "MISSING_FX";
}>;

export type PortfolioSummary = Readonly<{
  baseCurrency: CurrencyCode;
  totalValueBase: string | null;
  isPartial: boolean;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
  holdings: readonly ValuedHolding[];
}>;

type ValuationInput = Readonly<{
  baseCurrency: CurrencyCode;
  holdings: readonly PortfolioHolding[];
  quotesByInstrument: ReadonlyMap<string, InstrumentQuote | null>;
  fxByPair: ReadonlyMap<string, FxRate | null>;
  averageBuyPriceByInstrument?: ReadonlyMap<string, string>;
}>;

const minIso = (values: string[]) =>
  values.length === 0
    ? null
    : values.reduce((min, value) => (value < min ? value : min));

export function buildPortfolioSummary({
  baseCurrency,
  holdings,
  quotesByInstrument,
  fxByPair,
  averageBuyPriceByInstrument = new Map<string, string>(),
}: ValuationInput): PortfolioSummary {
  // Server-side valuation: compute totals only for holdings with price + FX.
  let totalValue = decimalZero();
  let hasValued = false;
  let missingQuotes = 0;
  let missingFx = 0;
  const usedTimestamps: string[] = [];

  const valuedHoldings: ValuedHolding[] = holdings.map((holding) => {
    if (holding.instrumentType === "CURRENCY") {
      const quantityDecimal = parseDecimalString(holding.quantity);
      if (!quantityDecimal) {
        missingQuotes += 1;
        return {
          instrumentId: holding.instrumentId,
          symbol: holding.symbol,
          name: holding.name,
          exchange: holding.exchange,
          currency: holding.currency,
          logoUrl: holding.logoUrl,
          instrumentType: holding.instrumentType,
          quantity: holding.quantity,
          averageBuyPriceBase: null,
          price: null,
          valueBase: null,
          weight: null,
          missingReason: "MISSING_QUOTE",
        };
      }

      if (holding.currency === baseCurrency) {
        const valueBase = quantityDecimal;
        totalValue = addDecimals(totalValue, valueBase);
        hasValued = true;

        return {
          instrumentId: holding.instrumentId,
          symbol: holding.symbol,
          name: holding.name,
          exchange: holding.exchange,
          currency: holding.currency,
          logoUrl: holding.logoUrl,
          instrumentType: holding.instrumentType,
          quantity: holding.quantity,
          averageBuyPriceBase: null,
          price: "1",
          valueBase: valueBase.toString(),
          weight: null,
          missingReason: null,
        };
      }

      const fxKey = `${holding.currency}:${baseCurrency}`;
      const fx = fxByPair.get(fxKey) ?? null;

      if (!fx) {
        missingFx += 1;
        return {
          instrumentId: holding.instrumentId,
          symbol: holding.symbol,
          name: holding.name,
          exchange: holding.exchange,
          currency: holding.currency,
          logoUrl: holding.logoUrl,
          instrumentType: holding.instrumentType,
          quantity: holding.quantity,
          averageBuyPriceBase: null,
          price: "1",
          valueBase: null,
          weight: null,
          missingReason: "MISSING_FX",
        };
      }

      const fxDecimal = parseDecimalString(fx.rate);
      if (!fxDecimal) {
        missingFx += 1;
        return {
          instrumentId: holding.instrumentId,
          symbol: holding.symbol,
          name: holding.name,
          exchange: holding.exchange,
          currency: holding.currency,
          logoUrl: holding.logoUrl,
          instrumentType: holding.instrumentType,
          quantity: holding.quantity,
          averageBuyPriceBase: null,
          price: "1",
          valueBase: null,
          weight: null,
          missingReason: "MISSING_FX",
        };
      }

      const valueBase = multiplyDecimals(quantityDecimal, fxDecimal);
      totalValue = addDecimals(totalValue, valueBase);
      hasValued = true;
      usedTimestamps.push(fx.asOf);

      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        exchange: holding.exchange,
        currency: holding.currency,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        averageBuyPriceBase: null,
        price: "1",
        valueBase: valueBase.toString(),
        weight: null,
        missingReason: null,
      };
    }

    const quote = quotesByInstrument.get(holding.instrumentId) ?? null;
    const averageBuyPrice = averageBuyPriceByInstrument.get(holding.instrumentId);
    const averageBuyPriceBase = toBasePriceOrNull({
      price: averageBuyPrice,
      fromCurrency: holding.currency,
      baseCurrency,
      fxByPair,
    });

    if (!quote) {
      missingQuotes += 1;
      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        exchange: holding.exchange,
        currency: holding.currency,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        averageBuyPriceBase,
        price: null,
        valueBase: null,
        weight: null,
        missingReason: "MISSING_QUOTE",
      };
    }

    if (quote.currency !== holding.currency) {
      missingQuotes += 1;
      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        exchange: holding.exchange,
        currency: holding.currency,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        averageBuyPriceBase,
        price: null,
        valueBase: null,
        weight: null,
        missingReason: "MISSING_QUOTE",
      };
    }

    // Backend note: daily move comes from quote delta and is converted to
    // portfolio base currency, so ranking is comparable across instruments.
    const todayChangeBase = toBaseHoldingDayChangeOrNull({
      quantity: holding.quantity,
      dayChange: quote.dayChange,
      fromCurrency: holding.currency,
      baseCurrency,
      fxByPair,
    });
    const todayChangePercent =
      typeof quote.dayChangePercent === "number" &&
      Number.isFinite(quote.dayChangePercent)
        ? quote.dayChangePercent
        : null;

    const priceDecimal = parseDecimalString(quote.price);
    const quantityDecimal = parseDecimalString(holding.quantity);
    if (!priceDecimal || !quantityDecimal) {
      missingQuotes += 1;
      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        exchange: holding.exchange,
        currency: holding.currency,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        averageBuyPriceBase,
        price: null,
        valueBase: null,
        weight: null,
        missingReason: "MISSING_QUOTE",
      };
    }

    if (holding.currency === baseCurrency) {
      const valueBase = multiplyDecimals(quantityDecimal, priceDecimal);
      totalValue = addDecimals(totalValue, valueBase);
      hasValued = true;
      usedTimestamps.push(quote.asOf);

      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        exchange: holding.exchange,
        currency: holding.currency,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        averageBuyPriceBase,
        price: quote.price,
        valueBase: valueBase.toString(),
        weight: null,
        todayChangeBase,
        todayChangePercent,
        missingReason: null,
      };
    }

    const fxKey = `${holding.currency}:${baseCurrency}`;
    const fx = fxByPair.get(fxKey) ?? null;

    if (!fx) {
      missingFx += 1;
      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        exchange: holding.exchange,
        currency: holding.currency,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        averageBuyPriceBase,
        price: quote.price,
        valueBase: null,
        weight: null,
        missingReason: "MISSING_FX",
      };
    }

    const fxDecimal = parseDecimalString(fx.rate);
    if (!fxDecimal) {
      missingFx += 1;
      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        exchange: holding.exchange,
        currency: holding.currency,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        averageBuyPriceBase,
        price: quote.price,
        valueBase: null,
        weight: null,
        missingReason: "MISSING_FX",
      };
    }

    const valueBase = multiplyDecimals(
      multiplyDecimals(quantityDecimal, priceDecimal),
      fxDecimal
    );
    totalValue = addDecimals(totalValue, valueBase);
    hasValued = true;
    usedTimestamps.push(quote.asOf, fx.asOf);

    return {
      instrumentId: holding.instrumentId,
      symbol: holding.symbol,
      name: holding.name,
      exchange: holding.exchange,
      currency: holding.currency,
      logoUrl: holding.logoUrl,
      instrumentType: holding.instrumentType,
      quantity: holding.quantity,
      averageBuyPriceBase,
      price: quote.price,
      valueBase: valueBase.toString(),
      weight: null,
      todayChangeBase,
      todayChangePercent,
      missingReason: null,
    };
  });

  const totalValueBase = hasValued ? totalValue.toString() : null;
  const totalDecimal =
    hasValued && totalValue.toString() !== "0" ? totalValue : null;

  const holdingsWithWeights = valuedHoldings.map((holding) => {
    if (!holding.valueBase || !totalDecimal) {
      return holding;
    }
    const valueDecimal = parseDecimalString(holding.valueBase);
    if (!valueDecimal) return holding;
    const weight = Number(valueDecimal.div(totalDecimal).toString());
    return { ...holding, weight };
  });

  const asOf = minIso(usedTimestamps);

  return {
    baseCurrency,
    totalValueBase,
    isPartial: missingQuotes > 0 || missingFx > 0,
    missingQuotes,
    missingFx,
    asOf,
    holdings: holdingsWithWeights,
  };
}

type ToBasePriceInput = Readonly<{
  price: string | undefined;
  fromCurrency: CurrencyCode;
  baseCurrency: CurrencyCode;
  fxByPair: ReadonlyMap<string, FxRate | null>;
}>;

function toBasePriceOrNull(input: ToBasePriceInput): string | null {
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
