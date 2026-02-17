import type { SupabaseClient } from "@supabase/supabase-js";

import { getFxDailyRatesCached } from "@/features/market-data";
import type { FxDailyRate } from "@/features/market-data";
import {
  buildCashInstrument,
  isSupportedCashCurrency,
  type CashCurrency,
} from "@/features/transactions/lib/system-currencies";

import type { CreateTransactionRequest } from "./schema";
import { buildSettlementLegs, type SettlementFx } from "./settlement";

export type SupabaseServerClient = SupabaseClient;

export type TransactionRow = Readonly<{
  user_id: string;
  instrument_id: string;
  portfolio_id: string;
  side: CreateTransactionRequest["type"];
  trade_date: string;
  quantity: string;
  price: string;
  fee: string;
  notes: string | null;
  client_request_id: string;
  group_id: string;
  leg_role: "ASSET" | "CASH";
  leg_key: "ASSET" | "CASH_SETTLEMENT" | "CASH_FX_FEE";
  cashflow_type: string | null;
  settlement_fx_rate?: string | null;
  settlement_fx_as_of?: string | null;
  settlement_fx_provider?: string | null;
}>;

type InstrumentUpsertPayload = Readonly<{
  provider: string;
  provider_key: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  region: string | null;
  updated_at: string;
  logo_url?: string | null;
  instrument_type?: CreateTransactionRequest["instrument"]["instrumentType"];
}>;

export type NormalizedInstrument = Readonly<{
  provider: string;
  providerKey: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  region: string | null;
  logoUrl: string | null;
  instrumentType: CreateTransactionRequest["instrument"]["instrumentType"] | null;
  isCashInstrument: boolean;
}>;

const normalizeRequiredText = (value: string) => value.trim();

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeCurrency = (value: string) =>
  normalizeRequiredText(value).toUpperCase();

export const normalizeNotes = (notes?: string) => notes?.trim() || null;

export const resolveIsCashInstrument = (
  provider: string,
  instrumentType: NormalizedInstrument["instrumentType"]
) => instrumentType === "CURRENCY" || provider === "system";

export const normalizeInstrument = (
  instrument: CreateTransactionRequest["instrument"]
): NormalizedInstrument => {
  const provider = normalizeRequiredText(instrument.provider).toLowerCase();
  const providerKey = normalizeOptionalText(instrument.providerKey);

  if (!providerKey) {
    throw new Error("Instrument wymaga provider_key.");
  }

  const instrumentType = instrument.instrumentType ?? null;

  return {
    provider,
    providerKey,
    symbol: normalizeRequiredText(instrument.symbol),
    name: normalizeRequiredText(instrument.name),
    currency: normalizeCurrency(instrument.currency),
    exchange: normalizeOptionalText(instrument.exchange),
    region: normalizeOptionalText(instrument.region),
    logoUrl: normalizeOptionalText(instrument.logoUrl),
    instrumentType,
    isCashInstrument: resolveIsCashInstrument(provider, instrumentType),
  };
};

const resolveFxRate = (fx: FxDailyRate | null): SettlementFx | null =>
  fx
    ? {
        rate: fx.rate,
        asOf: fx.asOf,
        provider: "yahoo",
      }
    : null;

export const buildAssetInstrumentUpsertPayload = (
  instrument: NormalizedInstrument,
  updatedAt: string
): InstrumentUpsertPayload => {
  const base: InstrumentUpsertPayload = {
    provider: instrument.provider,
    provider_key: instrument.providerKey,
    symbol: instrument.symbol,
    name: instrument.name,
    currency: instrument.currency,
    exchange: instrument.exchange,
    region: instrument.region,
    updated_at: updatedAt,
  };

  const withLogo = instrument.logoUrl ? { ...base, logo_url: instrument.logoUrl } : base;

  // Avoid overwriting existing type with null from older clients.
  return instrument.instrumentType
    ? { ...withLogo, instrument_type: instrument.instrumentType }
    : withLogo;
};

const buildCashInstrumentUpsertPayload = (
  cashCurrency: CashCurrency,
  updatedAt: string
): InstrumentUpsertPayload => {
  const cashInstrument = buildCashInstrument(cashCurrency);

  return {
    provider: cashInstrument.provider,
    provider_key: cashInstrument.providerKey,
    symbol: cashInstrument.symbol,
    name: cashInstrument.name,
    currency: cashInstrument.currency,
    exchange: null,
    region: null,
    logo_url: null,
    instrument_type: "CURRENCY",
    updated_at: updatedAt,
  };
};

export const upsertInstrumentAndGetId = async (
  supabaseAdmin: SupabaseServerClient,
  payload: InstrumentUpsertPayload,
  fallbackErrorMessage: string
) => {
  const { data, error } = await supabaseAdmin
    .from("instruments")
    .upsert(payload, { onConflict: "provider,provider_key" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? fallbackErrorMessage);
  }

  return data.id;
};

export const buildAssetLegRow = (input: Readonly<{
  userId: string;
  instrumentId: string;
  request: CreateTransactionRequest;
  groupId: string;
  isCashInstrument: boolean;
  cashflowType: string | null;
  notes: string | null;
}>): TransactionRow => ({
  user_id: input.userId,
  instrument_id: input.instrumentId,
  portfolio_id: input.request.portfolioId,
  side: input.request.type,
  trade_date: input.request.date,
  quantity: input.request.quantity,
  price: input.isCashInstrument ? "1" : input.request.price,
  fee: input.isCashInstrument ? "0" : input.request.fee ?? "0",
  notes: input.notes,
  client_request_id: input.request.clientRequestId,
  group_id: input.groupId,
  leg_role: "ASSET",
  leg_key: "ASSET",
  cashflow_type: input.isCashInstrument ? input.cashflowType : null,
});

const resolveSettlementFxMeta = async (input: Readonly<{
  supabaseUser: SupabaseServerClient;
  assetCurrency: string;
  cashCurrency: string;
  tradeDate: string;
}>): Promise<SettlementFx | null> => {
  if (input.cashCurrency === input.assetCurrency) {
    return null;
  }

  // Historical settlement uses FX as-of trade date (with previous-session fill).
  const fxByPair = await getFxDailyRatesCached(
    input.supabaseUser,
    [{ from: input.assetCurrency, to: input.cashCurrency }],
    input.tradeDate
  );

  const resolvedFx = resolveFxRate(
    fxByPair.get(`${input.assetCurrency}:${input.cashCurrency}`) ?? null
  );

  if (!resolvedFx) {
    throw new Error(
      `Brak kursu FX (${input.assetCurrency}/${input.cashCurrency}) na dzień ${input.tradeDate}.`
    );
  }

  return resolvedFx;
};

export const buildSettlementContext = async (input: Readonly<{
  supabaseUser: SupabaseServerClient;
  supabaseAdmin: SupabaseServerClient;
  userId: string;
  request: CreateTransactionRequest;
  groupId: string;
  notes: string | null;
  assetCurrency: string;
  isCashInstrument: boolean;
  updatedAt: string;
}>) => {
  if (input.isCashInstrument || !input.request.consumeCash) {
    return {
      settlementLegs: [] as ReturnType<typeof buildSettlementLegs>,
      settlementRows: [] as TransactionRow[],
      requestedCashCurrency: undefined,
    };
  }

  const requestedCashCurrencyInput = normalizeCurrency(input.request.cashCurrency ?? "");
  if (!isSupportedCashCurrency(requestedCashCurrencyInput)) {
    throw new Error("Nieobsługiwana waluta gotówki.");
  }
  const requestedCashCurrency: CashCurrency = requestedCashCurrencyInput;

  const cashInstrumentId = await upsertInstrumentAndGetId(
    input.supabaseAdmin,
    buildCashInstrumentUpsertPayload(requestedCashCurrency, input.updatedAt),
    "Cash instrument save failed."
  );

  const settlementFx = await resolveSettlementFxMeta({
    supabaseUser: input.supabaseUser,
    assetCurrency: input.assetCurrency,
    cashCurrency: requestedCashCurrency,
    tradeDate: input.request.date,
  });

  const settlementLegs = buildSettlementLegs({
    type: input.request.type,
    quantity: input.request.quantity,
    price: input.request.price,
    fee: input.request.fee ?? "0",
    assetCurrency: input.assetCurrency,
    cashCurrency: requestedCashCurrency,
    fx: settlementFx ?? undefined,
    fxFee: input.request.fxFee ?? undefined,
  });

  const settlementRows: TransactionRow[] = settlementLegs.map((leg) => ({
    user_id: input.userId,
    instrument_id: cashInstrumentId,
    portfolio_id: input.request.portfolioId,
    side: leg.side,
    trade_date: input.request.date,
    quantity: leg.quantity,
    price: leg.price,
    fee: "0",
    notes: input.notes,
    client_request_id: input.request.clientRequestId,
    group_id: input.groupId,
    leg_role: "CASH",
    leg_key: leg.legKey,
    cashflow_type: leg.cashflowType,
    settlement_fx_rate: leg.settlementFx?.rate ?? null,
    settlement_fx_as_of: leg.settlementFx?.asOf ?? null,
    settlement_fx_provider: leg.settlementFx?.provider ?? null,
  }));

  return {
    settlementLegs,
    settlementRows,
    requestedCashCurrency,
  };
};
