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
import type { SettlementFx } from "./settlement";
import { resolveTransactionIntent } from "./transaction-intent";
import { validateTransactionGuards } from "./transaction-guards";
import {
  insertTransactionRows,
  runPostWriteSideEffects,
  shouldMarkSnapshotHistoryDirty,
} from "./create-transaction-write";
import type { CustomAssetType } from "../lib/custom-asset-types";
import { badRequestError, internalServerError } from "@/lib/http/app-error";

type CreateTransactionResult = Readonly<{
  transactionId: string;
  instrumentId: string | null;
  customInstrumentId: string | null;
  deduped: boolean;
}>;

type CustomInstrumentKind = CustomAssetType;
type CustomInstrumentValuationKind = "COMPOUND_ANNUAL_RATE";

const normalizeCurrency = (value: string) => value.trim().toUpperCase();

const createCustomInstrumentAndGetId = async (input: Readonly<{
  supabaseUser: SupabaseServerClient;
  request: CreateTransactionRequest;
  notes: string | null;
}>) => {
  const instrument = input.request.customInstrument;
  if (!instrument) {
    throw badRequestError("Missing customInstrument payload.", {
      code: "TRANSACTION_MISSING_CUSTOM_INSTRUMENT",
    });
  }

  const payload = {
    name: instrument.name.trim(),
    currency: normalizeCurrency(instrument.currency),
    notes: input.notes,
    kind: instrument.kind satisfies CustomInstrumentKind,
    valuation_kind: instrument.valuationKind satisfies CustomInstrumentValuationKind,
    annual_rate_pct: instrument.annualRatePct,
    client_request_id: input.request.clientRequestId,
  } as const;

  const { data: inserted, error: insertError } = await input.supabaseUser
    .from("custom_instruments")
    .insert(payload)
    .select("id")
    .single();

  if (!insertError && inserted) {
    return inserted.id;
  }

  if (insertError?.code !== "23505") {
    throw internalServerError("Custom instrument save failed.", {
      code: "CUSTOM_INSTRUMENT_SAVE_FAILED",
      cause: insertError,
    });
  }

  const { data: existing, error: existingError } = await input.supabaseUser
    .from("custom_instruments")
    .select("id")
    .eq("client_request_id", input.request.clientRequestId)
    .maybeSingle();

  if (existingError || !existing) {
    throw internalServerError("Custom instrument idempotency read failed.", {
      code: "CUSTOM_INSTRUMENT_IDEMPOTENCY_READ_FAILED",
      cause: existingError,
    });
  }

  return existing.id;
};

export async function createTransaction(
  supabaseUser: SupabaseServerClient,
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  input: CreateTransactionRequest,
  options: Readonly<{
    guardMode?: "STRICT" | "IMPORT";
    skipPostWriteSideEffects?: boolean;
    settlementOverride?: Readonly<{
      cashQuantity: string;
      fx?: SettlementFx | null;
    }> | null;
  }> = {}
): Promise<CreateTransactionResult> {
  if (!input.instrument && !input.customInstrument) {
    throw badRequestError("Missing instrument payload.", {
      code: "TRANSACTION_MISSING_INSTRUMENT",
    });
  }

  // Normalize and cache the instrument globally for stable identity.
  const cashflowType = input.cashflowType ?? null;

  const groupId = crypto.randomUUID();
  const updatedAt = new Date().toISOString();
  const notes = normalizeNotes(input.notes);

  const isCustom = Boolean(input.customInstrument);
  const normalizedInstrument = input.instrument ? normalizeInstrument(input.instrument) : null;

  if (normalizedInstrument?.isCashInstrument && !cashflowType) {
    throw badRequestError("Transakcja gotówkowa wymaga typu przepływu.", {
      code: "TRANSACTION_MISSING_CASHFLOW_TYPE",
    });
  }

  const isCashInstrument = normalizedInstrument?.isCashInstrument ?? false;
  const intent = resolveTransactionIntent({
    isCashInstrument,
    side: input.type,
  });

  const assetCurrency = isCustom
    ? normalizeCurrency(input.customInstrument?.currency ?? "")
    : (normalizedInstrument?.currency ?? "");

  const assetInstrumentId = normalizedInstrument
    ? await upsertInstrumentAndGetId(
        supabaseAdmin,
        buildAssetInstrumentUpsertPayload(normalizedInstrument, updatedAt),
        "Instrument save failed."
      )
    : null;

  const customInstrumentId = isCustom
    ? await createCustomInstrumentAndGetId({ supabaseUser, request: input, notes })
    : null;

  const assetRow = buildAssetLegRow({
    userId,
    instrumentId: assetInstrumentId,
    customInstrumentId,
    request: input,
    groupId,
    isCashInstrument,
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
    assetCurrency,
    isCashInstrument,
    updatedAt,
    settlementOverride: options.settlementOverride ?? null,
  });

  // Server-side guardrails: prevent oversell and negative cash from settlement.
  await validateTransactionGuards({
    supabaseAdmin,
    userId,
    portfolioId: input.portfolioId,
    tradeDate: input.date,
    intent,
    isCashInstrument,
    assetInstrumentId: assetInstrumentId ?? "custom",
    requestedAssetQuantity: input.quantity,
    consumeCash: input.consumeCash ?? false,
    cashCurrency:
      settlementContext.requestedCashCurrency ??
      (isCashInstrument ? assetCurrency : undefined),
    settlementLegs: settlementContext.settlementLegs,
    guardMode: options.guardMode,
  });

  const persisted = await insertTransactionRows({
    supabaseUser,
    rows: [assetRow, ...settlementContext.settlementRows],
    userId,
    clientRequestId: input.clientRequestId,
  });

  if (!options.skipPostWriteSideEffects) {
    await runPostWriteSideEffects({
      supabaseUser,
      supabaseAdmin,
      userId,
      portfolioId: input.portfolioId,
      tradeDate: input.date,
    });
  }

  return {
    transactionId: persisted.assetRow.id,
    instrumentId: persisted.assetRow.instrument_id,
    customInstrumentId: persisted.assetRow.custom_instrument_id,
    deduped: persisted.deduped,
  };
}

export const __test__ = {
  shouldMarkSnapshotHistoryDirty,
  resolveIsCashInstrument,
  normalizeInstrument,
  buildAssetInstrumentUpsertPayload,
};
