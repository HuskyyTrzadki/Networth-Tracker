import type { DecimalValue } from "@/lib/decimal";
import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  negateDecimal,
  parseDecimalString,
  type DecimalValue as DecimalValueType,
} from "@/lib/decimal";

import {
  computeCompoundedAnnualRateDailyFactor,
  computeCompoundedAnnualRateQuote,
  computeCompoundedAnnualRateQuoteFromPreviousDay,
} from "../custom-instruments/compound-annual-rate";
import { buildPortfolioSummary } from "../valuation";
import type { InstrumentQuote } from "@/features/market-data";

import {
  addFlowAmount,
  buildSnapshotRow,
  convertFlowToBaseCurrency,
  hasAnySnapshotValue,
  normalizeCurrency,
  toSnapshotTotals,
  type InstrumentRow,
  type NormalizedTransaction,
  type PortfolioHolding,
} from "./compute-portfolio-snapshot-range-helpers";
import { SNAPSHOT_CURRENCIES, type SnapshotCurrency } from "./supported-currencies";
import type { SnapshotRowInsert, SnapshotScope } from "./types";
import { createFxSeriesCursor, createInstrumentSeriesCursor } from "./range-market-data-cursor";

export type CustomAnchorState = Readonly<{
  tradeDate: string;
  price: string;
}>;

export type CustomQuoteState = Readonly<{
  bucketDate: string;
  anchorTradeDate: string;
  anchorPrice: string;
  dailyRateFactor: string;
  price: string;
}>;

const MS_PER_DAY = 86_400_000;

const isNextIsoDate = (previousDate: string, nextDate: string) => {
  const previousMs = Date.parse(previousDate);
  const nextMs = Date.parse(nextDate);
  if (!Number.isFinite(previousMs) || !Number.isFinite(nextMs)) {
    return false;
  }

  return nextMs - previousMs === MS_PER_DAY;
};

const normalizeAnnualRatePct = (value: string | number | null | undefined) =>
  value === null || value === undefined
    ? "0"
    : typeof value === "number"
      ? value.toString()
      : value;

const buildFlowMapsForDay = (input: Readonly<{
  dailyTransactions: readonly NormalizedTransaction[];
  groupHasCash: ReadonlySet<string>;
  instrumentById: ReadonlyMap<string, InstrumentRow>;
}>) => {
  const externalByCurrency = new Map<string, DecimalValueType>();
  const implicitByCurrency = new Map<string, DecimalValueType>();

  input.dailyTransactions.forEach((transaction) => {
    const instrument = input.instrumentById.get(transaction.instrumentId);
    if (!instrument) return;

    const quantity = parseDecimalString(transaction.quantity);
    const price = parseDecimalString(transaction.price);
    if (!quantity || !price) return;

    const gross = multiplyDecimals(quantity, price);
    const currency = normalizeCurrency(instrument.currency);

    if (
      instrument.instrument_type === "CURRENCY" &&
      (transaction.cashflowType === "DEPOSIT" ||
        transaction.cashflowType === "WITHDRAWAL")
    ) {
      const amount = transaction.side === "BUY" ? gross : negateDecimal(gross);
      addFlowAmount(externalByCurrency, currency, amount);
    }

    if (
      transaction.legRole === "ASSET" &&
      instrument.instrument_type !== "CURRENCY" &&
      !input.groupHasCash.has(transaction.groupId ?? "")
    ) {
      const fee = parseDecimalString(transaction.fee) ?? decimalZero();
      const amount =
        transaction.side === "BUY"
          ? addDecimals(gross, fee)
          : negateDecimal(addDecimals(gross, negateDecimal(fee)));
      addFlowAmount(implicitByCurrency, currency, amount);
    }
  });

  return { externalByCurrency, implicitByCurrency };
};

export const applyTransactionToState = (
  holdingsQtyByInstrument: Map<string, DecimalValue>,
  customAnchorByInstrumentId: Map<string, CustomAnchorState>,
  transaction: NormalizedTransaction
) => {
  const quantity = parseDecimalString(transaction.quantity);
  if (!quantity) return;

  const signedQuantity =
    transaction.side === "BUY" ? quantity : negateDecimal(quantity);
  const existing = holdingsQtyByInstrument.get(transaction.instrumentId);
  const next = existing ? addDecimals(existing, signedQuantity) : signedQuantity;
  if (next.eq(0)) {
    holdingsQtyByInstrument.delete(transaction.instrumentId);
  } else {
    holdingsQtyByInstrument.set(transaction.instrumentId, next);
  }

  if (
    transaction.legRole === "ASSET" &&
    transaction.instrumentId.startsWith("custom:")
  ) {
    customAnchorByInstrumentId.set(transaction.instrumentId, {
      tradeDate: transaction.tradeDate,
      price: transaction.price,
    });
  }
};

export const applyTransactionsToState = (
  holdingsQtyByInstrument: Map<string, DecimalValue>,
  customAnchorByInstrumentId: Map<string, CustomAnchorState>,
  dailyTransactions: readonly NormalizedTransaction[]
) => {
  dailyTransactions.forEach((transaction) =>
    applyTransactionToState(holdingsQtyByInstrument, customAnchorByInstrumentId, transaction)
  );
};

const buildHoldings = (
  holdingsQtyByInstrument: ReadonlyMap<string, DecimalValue>,
  instrumentById: ReadonlyMap<string, InstrumentRow>
) =>
  Array.from(holdingsQtyByInstrument.entries())
    .map(([instrumentId, quantity]) => {
      const instrument = instrumentById.get(instrumentId);
      if (!instrument) return null;
      return {
        instrumentId,
        symbol: instrument.symbol,
        name: instrument.name,
        currency: normalizeCurrency(instrument.currency),
        exchange: instrument.exchange,
        provider: instrument.provider,
        providerKey: instrument.provider_key,
        logoUrl: instrument.logo_url,
        instrumentType: instrument.instrument_type,
        quantity: quantity.toString(),
      } satisfies PortfolioHolding;
    })
    .filter((holding): holding is PortfolioHolding => Boolean(holding));

export const buildDaySnapshotRow = (input: Readonly<{
  userId: string;
  scope: SnapshotScope;
  portfolioId: string | null;
  bucketDate: string;
  holdingsQtyByInstrument: ReadonlyMap<string, DecimalValue>;
  instrumentById: ReadonlyMap<string, InstrumentRow>;
  groupHasCash: ReadonlySet<string>;
  dailyTransactions: readonly NormalizedTransaction[];
  fxPairs: readonly { from: string; to: string }[];
  instrumentCursor: ReturnType<typeof createInstrumentSeriesCursor>;
  fxCursor: ReturnType<typeof createFxSeriesCursor>;
  customAnchorByInstrumentId: ReadonlyMap<string, CustomAnchorState>;
  customQuoteStateByInstrumentId: Map<string, CustomQuoteState>;
}>): SnapshotRowInsert | null => {
  input.instrumentCursor.advanceTo(input.bucketDate);
  input.fxCursor.advanceTo(input.bucketDate);

  const holdings = buildHoldings(input.holdingsQtyByInstrument, input.instrumentById);

  const quotesByInstrument = new Map<string, InstrumentQuote | null>(
    holdings
      .filter((holding) => holding.instrumentType !== "CURRENCY")
      .map((holding) => {
        const instrument = input.instrumentById.get(holding.instrumentId);
        if (!instrument) return [holding.instrumentId, null] as const;

        if (instrument.provider === "custom") {
          const anchor = input.customAnchorByInstrumentId.get(holding.instrumentId);
          if (!anchor) {
            input.customQuoteStateByInstrumentId.delete(holding.instrumentId);
            return [holding.instrumentId, null] as const;
          }

          const annualRatePct = normalizeAnnualRatePct(instrument.annual_rate_pct);
          const dailyRateFactor = computeCompoundedAnnualRateDailyFactor(annualRatePct);
          if (!dailyRateFactor) {
            input.customQuoteStateByInstrumentId.delete(holding.instrumentId);
            return [holding.instrumentId, null] as const;
          }

          const previousQuoteState =
            input.customQuoteStateByInstrumentId.get(holding.instrumentId);
          const canCarryForward = previousQuoteState
            ? previousQuoteState.anchorTradeDate === anchor.tradeDate &&
              previousQuoteState.anchorPrice === anchor.price &&
              previousQuoteState.dailyRateFactor === dailyRateFactor &&
              isNextIsoDate(previousQuoteState.bucketDate, input.bucketDate)
            : false;

          const quote = (() => {
            if (canCarryForward && previousQuoteState) {
              const incrementalQuote =
                computeCompoundedAnnualRateQuoteFromPreviousDay({
                  previousPrice: previousQuoteState.price,
                  dailyRateFactor: previousQuoteState.dailyRateFactor,
                });
              if (incrementalQuote) {
                return incrementalQuote;
              }
            }

            return computeCompoundedAnnualRateQuote({
              anchorPrice: anchor.price,
              anchorDate: anchor.tradeDate,
              annualRatePct,
              asOfDate: input.bucketDate,
            });
          })();

          input.customQuoteStateByInstrumentId.set(holding.instrumentId, {
            bucketDate: input.bucketDate,
            anchorTradeDate: anchor.tradeDate,
            anchorPrice: anchor.price,
            dailyRateFactor,
            price: quote.price,
          });

          const quoteAsOf = `${input.bucketDate}T00:00:00.000Z`;
          return [
            holding.instrumentId,
            {
              instrumentId: holding.instrumentId,
              currency: holding.currency,
              price: quote.price,
              dayChange: quote.dayChange,
              dayChangePercent: quote.dayChangePercent,
              asOf: quoteAsOf,
              fetchedAt: quoteAsOf,
            },
          ] as const;
        }

        const point = input.instrumentCursor.get(holding.providerKey);
        if (!point) return [holding.instrumentId, null] as const;

        return [
          holding.instrumentId,
          {
            instrumentId: holding.instrumentId,
            currency: point.currency,
            price: point.close,
            dayChange: null,
            dayChangePercent: null,
            asOf: point.asOf,
            fetchedAt: point.fetchedAt,
          },
        ] as const;
      })
  );

  const fxByPair = new Map(
    input.fxPairs.map((pair) => {
      const point = input.fxCursor.get(pair.from, pair.to);
      return [
        `${pair.from}:${pair.to}`,
        point
          ? {
              from: pair.from,
              to: pair.to,
              rate: point.rate,
              asOf: point.asOf,
              fetchedAt: point.fetchedAt,
              source: point.source,
            }
          : null,
      ] as const;
    })
  );

  const flowMaps = buildFlowMapsForDay({
    dailyTransactions: input.dailyTransactions,
    groupHasCash: input.groupHasCash,
    instrumentById: input.instrumentById,
  });

  const flowTotalsByCurrency = SNAPSHOT_CURRENCIES.reduce(
    (acc, currency) => {
      const external = convertFlowToBaseCurrency(
        currency,
        flowMaps.externalByCurrency,
        fxByPair
      );
      const implicit = convertFlowToBaseCurrency(
        currency,
        flowMaps.implicitByCurrency,
        fxByPair
      );
      acc.external[currency] = external.value;
      acc.implicit[currency] = implicit.value;
      acc.missingFx[currency] = external.missingFx || implicit.missingFx;
      return acc;
    },
    {
      external: {} as Record<SnapshotCurrency, string | null>,
      implicit: {} as Record<SnapshotCurrency, string | null>,
      missingFx: {} as Record<SnapshotCurrency, boolean>,
    }
  );

  const totals = SNAPSHOT_CURRENCIES.reduce(
    (acc, currency) => {
      const summary = buildPortfolioSummary({
        baseCurrency: currency,
        holdings,
        quotesByInstrument,
        fxByPair,
      });
      const snapshotTotals = toSnapshotTotals(summary);
      acc[currency] = {
        ...snapshotTotals,
        isPartial: snapshotTotals.isPartial || flowTotalsByCurrency.missingFx[currency],
      };
      return acc;
    },
    {} as Record<SnapshotCurrency, ReturnType<typeof toSnapshotTotals>>
  );

  if (holdings.length === 0 || !hasAnySnapshotValue(totals)) {
    return null;
  }

  return buildSnapshotRow(
    input.userId,
    input.scope,
    input.portfolioId,
    input.bucketDate,
    totals,
    flowTotalsByCurrency.external,
    flowTotalsByCurrency.implicit
  );
};
