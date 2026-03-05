import { addDecimals, decimalZero, multiplyDecimals, parseDecimalString } from "@/lib/decimal";

import type { CurrencyCode, FxRate, InstrumentQuote, InstrumentType } from "@/features/market-data";
import type { CustomAssetType } from "@/features/transactions/lib/custom-asset-types";
import type { PortfolioHolding } from "./get-portfolio-holdings";
import { toBaseHoldingDayChangeOrNull } from "./to-base-holding-day-change";
import {
  minIso,
  toBasePriceOrNull,
  toHoldingBase,
  toMissingFxHolding,
  toMissingQuoteHolding,
  toValuedHolding,
} from "./valuation-helpers";

export type ValuedHolding = Readonly<{
  instrumentId: string;
  provider: string;
  providerKey?: string;
  symbol: string;
  name: string;
  exchange: string | null;
  currency: CurrencyCode;
  logoUrl: string | null;
  instrumentType: InstrumentType | null;
  customAssetType?: CustomAssetType | null;
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
  const customAssetTypeByInstrumentId = new Map(
    holdings.map((holding) => [holding.instrumentId, holding.customAssetType ?? null] as const)
  );

  const registerValuedAmount = (valueBase: ReturnType<typeof decimalZero>, timestamps: string[]) => {
    totalValue = addDecimals(totalValue, valueBase);
    hasValued = true;
    if (timestamps.length > 0) {
      usedTimestamps.push(...timestamps);
    }
  };

  const valuedHoldings: ValuedHolding[] = holdings.map((holding) => {
    const holdingBase = toHoldingBase(holding);

    if (holding.instrumentType === "CURRENCY") {
      const quantityDecimal = parseDecimalString(holding.quantity);
      if (!quantityDecimal) {
        missingQuotes += 1;
        return toMissingQuoteHolding(holdingBase);
      }

      if (holding.currency === baseCurrency) {
        registerValuedAmount(quantityDecimal, []);
        return toValuedHolding(holdingBase, {
          price: "1",
          valueBase: quantityDecimal.toString(),
        });
      }

      const fx = fxByPair.get(`${holding.currency}:${baseCurrency}`) ?? null;
      if (!fx) {
        missingFx += 1;
        return toMissingFxHolding(holdingBase, { price: "1" });
      }

      const fxDecimal = parseDecimalString(fx.rate);
      if (!fxDecimal) {
        missingFx += 1;
        return toMissingFxHolding(holdingBase, { price: "1" });
      }

      const valueBase = multiplyDecimals(quantityDecimal, fxDecimal);
      registerValuedAmount(valueBase, [fx.asOf]);
      return toValuedHolding(holdingBase, {
        price: "1",
        valueBase: valueBase.toString(),
      });
    }

    const quote = quotesByInstrument.get(holding.instrumentId) ?? null;
    const averageBuyPriceBase = toBasePriceOrNull({
      price: averageBuyPriceByInstrument.get(holding.instrumentId),
      fromCurrency: holding.currency,
      baseCurrency,
      fxByPair,
    });

    if (!quote || quote.currency !== holding.currency) {
      missingQuotes += 1;
      return toMissingQuoteHolding(holdingBase, averageBuyPriceBase);
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
      typeof quote.dayChangePercent === "number" && Number.isFinite(quote.dayChangePercent)
        ? quote.dayChangePercent
        : null;

    const priceDecimal = parseDecimalString(quote.price);
    const quantityDecimal = parseDecimalString(holding.quantity);
    if (!priceDecimal || !quantityDecimal) {
      missingQuotes += 1;
      return toMissingQuoteHolding(holdingBase, averageBuyPriceBase);
    }

    const quoteValue = multiplyDecimals(quantityDecimal, priceDecimal);
    if (holding.currency === baseCurrency) {
      registerValuedAmount(quoteValue, [quote.asOf]);
      return toValuedHolding(holdingBase, {
        averageBuyPriceBase,
        price: quote.price,
        valueBase: quoteValue.toString(),
        todayChangeBase,
        todayChangePercent,
      });
    }

    const fx = fxByPair.get(`${holding.currency}:${baseCurrency}`) ?? null;
    if (!fx) {
      missingFx += 1;
      return toMissingFxHolding(holdingBase, {
        averageBuyPriceBase,
        price: quote.price,
        todayChangeBase,
        todayChangePercent,
      });
    }

    const fxDecimal = parseDecimalString(fx.rate);
    if (!fxDecimal) {
      missingFx += 1;
      return toMissingFxHolding(holdingBase, {
        averageBuyPriceBase,
        price: quote.price,
        todayChangeBase,
        todayChangePercent,
      });
    }

    const valueBase = multiplyDecimals(quoteValue, fxDecimal);
    registerValuedAmount(valueBase, [quote.asOf, fx.asOf]);

    return toValuedHolding(holdingBase, {
      averageBuyPriceBase,
      price: quote.price,
      valueBase: valueBase.toString(),
      todayChangeBase,
      todayChangePercent,
    });
  });

  const totalValueBase = hasValued ? totalValue.toString() : null;
  const totalDecimal = hasValued && totalValue.toString() !== "0" ? totalValue : null;

  const holdingsWithWeights = valuedHoldings.map((holding) => {
    const customAssetType = customAssetTypeByInstrumentId.get(holding.instrumentId) ?? null;
    if (!holding.valueBase || !totalDecimal) {
      return { ...holding, customAssetType };
    }

    const valueDecimal = parseDecimalString(holding.valueBase);
    if (!valueDecimal) return { ...holding, customAssetType };

    const weight = Number(valueDecimal.div(totalDecimal).toString());
    return { ...holding, weight, customAssetType };
  });

  return {
    baseCurrency,
    totalValueBase,
    isPartial: missingQuotes > 0 || missingFx > 0,
    missingQuotes,
    missingFx,
    asOf: minIso(usedTimestamps),
    holdings: holdingsWithWeights,
  };
}
