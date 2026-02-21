import { touchProfileLastActive } from "@/features/auth/server/profiles";
import { getBucketDate } from "@/features/portfolio/server/snapshots/bucket-date";
import { markSnapshotRebuildDirty } from "@/features/portfolio/server/snapshots/rebuild-state";
import { DEFAULT_CUSTOM_ASSET_TYPE, isCustomAssetType, type CustomAssetType } from "../lib/custom-asset-types";
import { instrumentTypes, type InstrumentType } from "../lib/instrument-search";

import type { UpdateTransactionRequest } from "./schema";
import { createTransactionRequestSchema } from "./schema";
import { getTransactionGroupByTransactionId } from "./get-transaction-group";
import {
  buildAssetLegRow,
  buildSettlementContext,
  normalizeInstrument,
  normalizeNotes,
  resolveIsCashInstrument,
  type SupabaseServerClient,
} from "./create-transaction-context";
import { resolveTransactionIntent } from "./transaction-intent";
import { validateTransactionGuards } from "./transaction-guards";

type UpdateTransactionResult = Readonly<{
  portfolioId: string;
  oldTradeDate: string;
  newTradeDate: string;
  groupId: string;
  replacedCount: number;
}>;

type ReplaceTransactionGroupRpcRow = Readonly<{
  portfolio_id: string;
  old_trade_date: string;
  new_trade_date: string;
  group_id: string;
  replaced_count: number;
}>;

type FullUpdateRequest =
  | (UpdateTransactionRequest & {
      portfolioId: string;
      clientRequestId: string;
      instrument: NonNullable<
        Parameters<typeof normalizeInstrument>[0]
      >;
      customInstrument?: never;
    })
  | (UpdateTransactionRequest & {
      portfolioId: string;
      clientRequestId: string;
      customInstrument: Readonly<{
        name: string;
        currency: string;
        notes?: string;
        kind: CustomAssetType;
        valuationKind: "COMPOUND_ANNUAL_RATE";
        annualRatePct: string;
      }>;
      instrument?: never;
    });

const shouldMarkSnapshotHistoryDirty = (tradeDate: string, todayBucket: string) =>
  tradeDate <= todayBucket;

const resolveDirtyFromTradeDate = (oldTradeDate: string, newTradeDate: string) =>
  oldTradeDate <= newTradeDate ? oldTradeDate : newTradeDate;

const markSnapshotDirtyAfterEdit = async (input: Readonly<{
  supabaseAdmin: SupabaseServerClient;
  userId: string;
  portfolioId: string;
  oldTradeDate: string;
  newTradeDate: string;
}>) => {
  const dirtyFrom = resolveDirtyFromTradeDate(input.oldTradeDate, input.newTradeDate);
  const todayBucket = getBucketDate(new Date());
  if (!shouldMarkSnapshotHistoryDirty(dirtyFrom, todayBucket)) {
    return;
  }

  await Promise.all([
    markSnapshotRebuildDirty(input.supabaseAdmin, {
      userId: input.userId,
      portfolioId: input.portfolioId,
      scope: "PORTFOLIO",
      dirtyFrom,
    }),
    markSnapshotRebuildDirty(input.supabaseAdmin, {
      userId: input.userId,
      portfolioId: null,
      scope: "ALL",
      dirtyFrom,
    }),
  ]);
};

const normalizeCustomInstrumentRate = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const normalizeCustomInstrumentKind = (value: string): CustomAssetType =>
  isCustomAssetType(value) ? value : DEFAULT_CUSTOM_ASSET_TYPE;

const normalizeInstrumentType = (value: string | null) => {
  if (!value) return undefined;
  return instrumentTypes.includes(value as InstrumentType)
    ? (value as InstrumentType)
    : undefined;
};

const buildFullUpdateRequest = (
  input: Readonly<{
    request: UpdateTransactionRequest;
    portfolioId: string;
    clientRequestId: string;
    group: Awaited<ReturnType<typeof getTransactionGroupByTransactionId>>;
  }>
) => {
  const assetLeg = input.group.assetLeg;
  const instrument = assetLeg.instrument;
  const customInstrument = assetLeg.customInstrument;

  if (customInstrument) {
    return {
      ...input.request,
      portfolioId: input.portfolioId,
      clientRequestId: input.clientRequestId,
      customInstrument: {
        name: customInstrument.name,
        currency: customInstrument.currency,
        notes: customInstrument.notes ?? undefined,
        kind: normalizeCustomInstrumentKind(customInstrument.kind),
        valuationKind: "COMPOUND_ANNUAL_RATE" as const,
        annualRatePct: normalizeCustomInstrumentRate(customInstrument.annual_rate_pct),
      },
    } satisfies FullUpdateRequest;
  }

  if (!instrument) {
    throw new Error("Brak instrumentu dla lega ASSET.");
  }

  return {
    ...input.request,
    portfolioId: input.portfolioId,
    clientRequestId: input.clientRequestId,
    instrument: {
      provider: instrument.provider,
      providerKey: instrument.provider_key,
      symbol: instrument.symbol,
      name: instrument.name,
      currency: instrument.currency,
      instrumentType: normalizeInstrumentType(instrument.instrument_type),
      exchange: instrument.exchange ?? undefined,
      region: instrument.region ?? undefined,
      logoUrl: instrument.logo_url ?? undefined,
    },
  } satisfies FullUpdateRequest;
};

const replaceTransactionGroup = async (input: Readonly<{
  supabaseAdmin: SupabaseServerClient;
  userId: string;
  groupId: string;
  rows: readonly ReturnType<typeof buildAssetLegRow>[];
}>): Promise<ReplaceTransactionGroupRpcRow> => {
  const { data, error } = await input.supabaseAdmin.rpc("replace_transaction_group", {
    p_user_id: input.userId,
    p_group_id: input.groupId,
    p_new_legs: input.rows,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as ReplaceTransactionGroupRpcRow[] | null)?.[0] ?? null;
  if (!row) {
    throw new Error("Brak odpowiedzi po podmianie grupy transakcji.");
  }

  return row;
};

export async function updateTransactionById(
  supabaseUser: SupabaseServerClient,
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  transactionId: string,
  input: UpdateTransactionRequest
): Promise<UpdateTransactionResult> {
  const group = await getTransactionGroupByTransactionId(
    supabaseUser,
    userId,
    transactionId
  );
  const assetLeg = group.assetLeg;
  const fullRequest = buildFullUpdateRequest({
    request: input,
    portfolioId: assetLeg.portfolioId,
    clientRequestId: assetLeg.clientRequestId,
    group,
  });

  const parsed = createTransactionRequestSchema.parse(fullRequest);
  const notes = normalizeNotes(parsed.notes);
  const normalizedInstrument = parsed.instrument
    ? normalizeInstrument(parsed.instrument)
    : null;
  const isCashInstrument = normalizedInstrument
    ? resolveIsCashInstrument(
        normalizedInstrument.provider,
        normalizedInstrument.instrumentType
      )
    : false;
  const assetCurrency = (
    parsed.customInstrument?.currency ?? normalizedInstrument?.currency ?? ""
  ).toUpperCase();
  const intent = resolveTransactionIntent({
    isCashInstrument,
    side: parsed.type,
  });

  const settlementContext = await buildSettlementContext({
    supabaseUser,
    supabaseAdmin,
    userId,
    request: parsed,
    groupId: group.groupId,
    notes,
    assetCurrency,
    isCashInstrument,
    updatedAt: new Date().toISOString(),
  });

  await validateTransactionGuards({
    supabaseAdmin,
    userId,
    portfolioId: assetLeg.portfolioId,
    tradeDate: parsed.date,
    intent,
    isCashInstrument,
    assetInstrumentId: assetLeg.instrumentId ?? "custom",
    requestedAssetQuantity: parsed.quantity,
    consumeCash: parsed.consumeCash ?? false,
    cashCurrency:
      settlementContext.requestedCashCurrency ??
      (isCashInstrument ? assetCurrency : undefined),
    settlementLegs: settlementContext.settlementLegs,
  });

  const assetRow = buildAssetLegRow({
    userId,
    instrumentId: assetLeg.instrumentId,
    customInstrumentId: assetLeg.customInstrumentId,
    request: parsed,
    groupId: group.groupId,
    isCashInstrument,
    cashflowType: parsed.cashflowType ?? null,
    notes,
  });

  const replaced = await replaceTransactionGroup({
    supabaseAdmin,
    userId,
    groupId: group.groupId,
    rows: [assetRow, ...settlementContext.settlementRows],
  });

  await Promise.all([
    touchProfileLastActive(supabaseUser, userId).catch(() => undefined),
    markSnapshotDirtyAfterEdit({
      supabaseAdmin,
      userId,
      portfolioId: replaced.portfolio_id,
      oldTradeDate: replaced.old_trade_date,
      newTradeDate: replaced.new_trade_date,
    }).catch(() => undefined),
  ]);

  return {
    portfolioId: replaced.portfolio_id,
    oldTradeDate: replaced.old_trade_date,
    newTradeDate: replaced.new_trade_date,
    groupId: replaced.group_id,
    replacedCount: replaced.replaced_count,
  };
}

export const __test__ = {
  resolveDirtyFromTradeDate,
  shouldMarkSnapshotHistoryDirty,
};
