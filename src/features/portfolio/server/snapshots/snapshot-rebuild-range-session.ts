import type { SupabaseClient } from "@supabase/supabase-js";

import type { InstrumentQuoteRequest } from "@/features/market-data";
import { isoDateRange, shiftIsoDate } from "@/features/market-data/server/lib/date-utils";
import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  negateDecimal,
  parseDecimalString,
  type DecimalValue,
} from "@/lib/decimal";

import { buildPortfolioSummary } from "../valuation";
import {
  addFlowAmount,
  buildFxPairs,
  buildSnapshotRow,
  convertFlowToBaseCurrency,
  fetchInstrumentsByIds,
  fetchScopedPortfolioIds,
  fetchTransactionsUpToDate,
  hasAnySnapshotValue,
  normalizeCurrency,
  toNormalizedTransactions,
  toSnapshotTotals,
  type InstrumentRow,
  type NormalizedTransaction,
  type PortfolioHolding,
} from "./compute-portfolio-snapshot-range-helpers";
import { createFxSeriesCursor, createInstrumentSeriesCursor } from "./range-market-data-cursor";
import { preloadFxDailySeries, preloadInstrumentDailySeries } from "./range-market-data";
import { resolveChunkToDate } from "./rebuild-chunk-window";
import { SNAPSHOT_CURRENCIES, type SnapshotCurrency } from "./supported-currencies";
import type { SnapshotRowInsert, SnapshotScope } from "./types";

export type SnapshotRangeDayResult = Readonly<{
  bucketDate: string;
  row: SnapshotRowInsert | null;
}>;

export type SnapshotRebuildChunkResult = Readonly<{
  chunkFromDate: string;
  chunkToDate: string;
  lastProcessed: string;
  nextDirtyFrom: string | null;
  processedDays: number;
  dayResults: readonly SnapshotRangeDayResult[];
}>;

export type SnapshotRebuildRangeSession = Readonly<{
  getNextDirtyFrom: () => string | null;
  processNextChunk: (maxDaysPerRun: number) => SnapshotRebuildChunkResult | null;
}>;

type BuildFlowInput = Readonly<{
  dailyTransactions: readonly NormalizedTransaction[];
  groupHasCash: ReadonlySet<string>;
  instrumentById: ReadonlyMap<string, InstrumentRow>;
}>;

type BuildSnapshotRowInput = Readonly<{
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
}>;

const buildFlowMapsForDay = (input: BuildFlowInput) => {
  const externalByCurrency = new Map<string, DecimalValue>();
  const implicitByCurrency = new Map<string, DecimalValue>();

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

const applyTransactionsToHoldings = (
  holdingsQtyByInstrument: Map<string, DecimalValue>,
  dailyTransactions: readonly NormalizedTransaction[]
) => {
  dailyTransactions.forEach((transaction) => {
    const quantity = parseDecimalString(transaction.quantity);
    if (!quantity) return;

    const signedQuantity =
      transaction.side === "BUY" ? quantity : negateDecimal(quantity);
    const existing = holdingsQtyByInstrument.get(transaction.instrumentId);
    const next = existing ? addDecimals(existing, signedQuantity) : signedQuantity;
    if (next.eq(0)) {
      holdingsQtyByInstrument.delete(transaction.instrumentId);
      return;
    }
    holdingsQtyByInstrument.set(transaction.instrumentId, next);
  });
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

const buildDaySnapshotRow = (input: BuildSnapshotRowInput) => {
  input.instrumentCursor.advanceTo(input.bucketDate);
  input.fxCursor.advanceTo(input.bucketDate);

  const holdings = buildHoldings(input.holdingsQtyByInstrument, input.instrumentById);
  const quotesByInstrument = new Map(
    holdings
      .filter((holding) => holding.instrumentType !== "CURRENCY")
      .map((holding) => {
        const point = input.instrumentCursor.get(holding.providerKey);
        if (!point) return [holding.instrumentId, null] as const;
        return [
          holding.instrumentId,
          {
            instrumentId: holding.instrumentId,
            currency: point.currency,
            price: point.close,
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

export async function createSnapshotRebuildRangeSession(
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  fromDate: string,
  toDate: string
): Promise<SnapshotRebuildRangeSession> {
  // Rebuild session: preload transactions + daily market/FX inputs once for this run.
  const scopedPortfolioIds = await fetchScopedPortfolioIds(
    supabase,
    userId,
    scope,
    portfolioId
  );
  const transactionRows = await fetchTransactionsUpToDate(
    supabase,
    userId,
    scopedPortfolioIds,
    toDate
  );
  const transactions = toNormalizedTransactions(transactionRows);

  const instrumentIds = Array.from(new Set(transactions.map((row) => row.instrumentId)));
  const instruments = await fetchInstrumentsByIds(supabase, instrumentIds);
  const instrumentById = new Map(instruments.map((instrument) => [instrument.id, instrument]));

  const quoteRequests: InstrumentQuoteRequest[] = instruments
    .filter((instrument) => instrument.instrument_type !== "CURRENCY")
    .map((instrument) => ({
      instrumentId: instrument.id,
      provider: "yahoo",
      providerKey: instrument.provider_key,
    }));

  const currencies = Array.from(
    new Set(instruments.map((instrument) => normalizeCurrency(instrument.currency)))
  );
  const fxPairs = buildFxPairs(currencies);

  const [instrumentSeries, fxSeries] = await Promise.all([
    preloadInstrumentDailySeries(supabase, quoteRequests, fromDate, toDate),
    preloadFxDailySeries(supabase, fxPairs, fromDate, toDate),
  ]);

  const instrumentCursor = createInstrumentSeriesCursor(instrumentSeries);
  const fxCursor = createFxSeriesCursor(fxSeries);
  const groupHasCash = new Set(
    transactions
      .filter((transaction) => transaction.legRole === "CASH" && transaction.groupId)
      .map((transaction) => transaction.groupId as string)
  );

  const holdingsQtyByInstrument = new Map<string, DecimalValue>();
  const transactionsByDate = new Map<string, NormalizedTransaction[]>();

  transactions.forEach((transaction) => {
    const quantity = parseDecimalString(transaction.quantity);
    if (!quantity) return;

    const signedQuantity =
      transaction.side === "BUY" ? quantity : negateDecimal(quantity);

    if (transaction.tradeDate < fromDate) {
      const existing = holdingsQtyByInstrument.get(transaction.instrumentId);
      const next = existing ? addDecimals(existing, signedQuantity) : signedQuantity;
      if (next.eq(0)) holdingsQtyByInstrument.delete(transaction.instrumentId);
      else holdingsQtyByInstrument.set(transaction.instrumentId, next);
      return;
    }

    if (transaction.tradeDate > toDate) return;

    const existing = transactionsByDate.get(transaction.tradeDate) ?? [];
    existing.push(transaction);
    transactionsByDate.set(transaction.tradeDate, existing);
  });

  let nextDirtyFrom: string | null = fromDate;

  return {
    getNextDirtyFrom: () => nextDirtyFrom,
    processNextChunk: (maxDaysPerRun: number) => {
      if (!nextDirtyFrom) {
        return null;
      }

      const chunkFromDate = nextDirtyFrom;
      const chunkToDate = resolveChunkToDate(chunkFromDate, toDate, maxDaysPerRun);
      const dayResults: SnapshotRangeDayResult[] = [];

      for (const bucketDate of isoDateRange(chunkFromDate, chunkToDate)) {
        const dailyTransactions = transactionsByDate.get(bucketDate) ?? [];
        applyTransactionsToHoldings(holdingsQtyByInstrument, dailyTransactions);

        const row = buildDaySnapshotRow({
          userId,
          scope,
          portfolioId,
          bucketDate,
          holdingsQtyByInstrument,
          instrumentById,
          groupHasCash,
          dailyTransactions,
          fxPairs,
          instrumentCursor,
          fxCursor,
        });

        dayResults.push({ bucketDate, row });
      }

      const hasMore = chunkToDate < toDate;
      const updatedNextDirtyFrom = hasMore ? shiftIsoDate(chunkToDate, 1) : null;
      nextDirtyFrom = updatedNextDirtyFrom;

      return {
        chunkFromDate,
        chunkToDate,
        lastProcessed: chunkToDate,
        nextDirtyFrom: updatedNextDirtyFrom,
        processedDays: dayResults.length,
        dayResults,
      } satisfies SnapshotRebuildChunkResult;
    },
  };
}

