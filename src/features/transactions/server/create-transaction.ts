import {
  buildAssetInstrumentUpsertPayload,
  buildAssetLegRow,
  buildSettlementContext,
  normalizeInstrument,
  normalizeNotes,
  resolveIsCashInstrument,
  type SupabaseServerClient,
  upsertInstrumentAndGetId,
} from "./create-transaction-context";
import type { CreateTransactionRequest } from "./schema";
import { resolveTransactionIntent } from "./transaction-intent";
import { validateTransactionGuards } from "./transaction-guards";
import {
  insertTransactionRows,
  runPostWriteSideEffects,
  shouldMarkSnapshotHistoryDirty,
} from "./create-transaction-write";

type CreateTransactionResult = Readonly<{
  transactionId: string;
  instrumentId: string;
  deduped: boolean;
}>;

export async function createTransaction(
  supabaseUser: SupabaseServerClient,
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  input: CreateTransactionRequest
): Promise<CreateTransactionResult> {
  // Normalize and cache the instrument globally for stable identity.
  const normalizedInstrument = normalizeInstrument(input.instrument);
  const cashflowType = input.cashflowType ?? null;

  if (normalizedInstrument.isCashInstrument && !cashflowType) {
    throw new Error("Transakcja gotówkowa wymaga typu przepływu.");
  }

  const intent = resolveTransactionIntent({
    isCashInstrument: normalizedInstrument.isCashInstrument,
    side: input.type,
  });

  const groupId = crypto.randomUUID();
  const updatedAt = new Date().toISOString();
  const notes = normalizeNotes(input.notes);

  const assetInstrumentId = await upsertInstrumentAndGetId(
    supabaseAdmin,
    buildAssetInstrumentUpsertPayload(normalizedInstrument, updatedAt),
    "Instrument save failed."
  );

  const assetRow = buildAssetLegRow({
    userId,
    instrumentId: assetInstrumentId,
    request: input,
    groupId,
    isCashInstrument: normalizedInstrument.isCashInstrument,
    cashflowType,
    notes,
  });

  const settlementContext = await buildSettlementContext({
    supabaseUser,
    supabaseAdmin,
    userId,
    request: input,
    groupId,
    notes,
    assetCurrency: normalizedInstrument.currency,
    isCashInstrument: normalizedInstrument.isCashInstrument,
    updatedAt,
  });

  // Server-side guardrails: prevent oversell and negative cash from settlement.
  await validateTransactionGuards({
    supabaseAdmin,
    userId,
    portfolioId: input.portfolioId,
    tradeDate: input.date,
    intent,
    isCashInstrument: normalizedInstrument.isCashInstrument,
    assetInstrumentId,
    requestedAssetQuantity: input.quantity,
    consumeCash: input.consumeCash ?? false,
    cashCurrency:
      settlementContext.requestedCashCurrency ??
      (normalizedInstrument.isCashInstrument ? normalizedInstrument.currency : undefined),
    settlementLegs: settlementContext.settlementLegs,
  });

  const persisted = await insertTransactionRows({
    supabaseUser,
    rows: [assetRow, ...settlementContext.settlementRows],
    userId,
    clientRequestId: input.clientRequestId,
  });

  await runPostWriteSideEffects({
    supabaseUser,
    supabaseAdmin,
    userId,
    portfolioId: input.portfolioId,
    tradeDate: input.date,
  });

  return {
    transactionId: persisted.assetRow.id,
    instrumentId: persisted.assetRow.instrument_id,
    deduped: persisted.deduped,
  };
}

export const __test__ = {
  shouldMarkSnapshotHistoryDirty,
  resolveIsCashInstrument,
  normalizeInstrument,
  buildAssetInstrumentUpsertPayload,
};
