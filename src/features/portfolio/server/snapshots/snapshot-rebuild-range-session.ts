import type { SupabaseClient } from "@supabase/supabase-js";

import type { InstrumentQuoteRequest } from "@/features/market-data";
import { isoDateRange, shiftIsoDate } from "@/features/market-data/server/lib/date-utils";

import {
  buildFxPairs,
  fetchCustomInstrumentsByIds,
  fetchInstrumentsByIds,
  fetchScopedPortfolioIds,
  fetchTransactionsUpToDate,
  normalizeCurrency,
  toNormalizedTransactions,
  type InstrumentRow,
  type NormalizedTransaction,
} from "./compute-portfolio-snapshot-range-helpers";
import { createFxSeriesCursor, createInstrumentSeriesCursor } from "./range-market-data-cursor";
import { preloadFxDailySeries, preloadInstrumentDailySeries } from "./range-market-data";
import { resolveChunkToDate } from "./rebuild-chunk-window";
import type { SnapshotRowInsert, SnapshotScope } from "./types";
import {
  applyTransactionToState,
  applyTransactionsToState,
  buildDaySnapshotRow,
  type CustomAnchorState,
} from "./snapshot-rebuild-range-day";

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
  const marketInstrumentIds = instrumentIds.filter((id) => !id.startsWith("custom:"));
  const customInstrumentIds = instrumentIds
    .filter((id) => id.startsWith("custom:"))
    .map((id) => id.replace(/^custom:/, ""));

  const [instruments, customInstruments] = await Promise.all([
    fetchInstrumentsByIds(supabase, marketInstrumentIds),
    fetchCustomInstrumentsByIds(supabase, userId, customInstrumentIds),
  ]);

  const instrumentById = new Map<string, InstrumentRow>([
    ...instruments.map((instrument) => [instrument.id, instrument] as const),
    ...customInstruments.map((instrument) => [instrument.id, instrument] as const),
  ]);

  const quoteRequests: InstrumentQuoteRequest[] = instruments
    .filter((instrument) => instrument.instrument_type !== "CURRENCY")
    .map((instrument) => ({
      instrumentId: instrument.id,
      provider: "yahoo",
      providerKey: instrument.provider_key,
    }));

  const currencies = Array.from(
    new Set(
      [...instruments, ...customInstruments].map((instrument) =>
        normalizeCurrency(instrument.currency)
      )
    )
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

  const holdingsQtyByInstrument = new Map<string, import("@/lib/decimal").DecimalValue>();
  const customAnchorByInstrumentId = new Map<string, CustomAnchorState>();
  const transactionsByDate = new Map<string, NormalizedTransaction[]>();

  transactions.forEach((transaction) => {
    if (transaction.tradeDate < fromDate) {
      applyTransactionToState(holdingsQtyByInstrument, customAnchorByInstrumentId, transaction);
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
        applyTransactionsToState(holdingsQtyByInstrument, customAnchorByInstrumentId, dailyTransactions);

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
          customAnchorByInstrumentId,
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
