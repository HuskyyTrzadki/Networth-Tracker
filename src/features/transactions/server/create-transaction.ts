import type { SupabaseClient } from "@supabase/supabase-js";

import { touchProfileLastActive } from "@/features/auth/server/profiles";
import { getFxRatesCached } from "@/features/market-data";
import type { FxRate } from "@/features/market-data";
import { getBucketDate } from "@/features/portfolio/server/snapshots/bucket-date";
import { markSnapshotRebuildDirty } from "@/features/portfolio/server/snapshots/rebuild-state";
import {
  buildCashInstrument,
  isSupportedCashCurrency,
} from "@/features/transactions/lib/system-currencies";

import type { CreateTransactionRequest } from "./schema";
import { buildSettlementLegs } from "./settlement";

type SupabaseServerClient = SupabaseClient;

type CreateTransactionResult = Readonly<{
  transactionId: string;
  instrumentId: string;
  deduped: boolean;
}>;

const normalizeRequiredText = (value: string) => value.trim();

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeCurrency = (value: string) =>
  normalizeRequiredText(value).toUpperCase();

const resolveFxRate = (fx: FxRate | null) =>
  fx
    ? {
        rate: fx.rate,
        asOf: fx.asOf,
        provider: "yahoo",
      }
    : null;

const markSnapshotHistoryDirty = async (
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  portfolioId: string,
  tradeDate: string
) => {
  // Past-dated writes need historical snapshot recompute from the earliest affected day.
  const todayBucket = getBucketDate(new Date());
  if (tradeDate >= todayBucket) {
    return;
  }

  await Promise.all([
    markSnapshotRebuildDirty(supabaseAdmin, {
      userId,
      scope: "PORTFOLIO",
      portfolioId,
      dirtyFrom: tradeDate,
    }),
    markSnapshotRebuildDirty(supabaseAdmin, {
      userId,
      scope: "ALL",
      portfolioId: null,
      dirtyFrom: tradeDate,
    }),
  ]);
};

export async function createTransaction(
  supabaseUser: SupabaseServerClient,
  supabaseAdmin: SupabaseServerClient,
  userId: string,
  input: CreateTransactionRequest
): Promise<CreateTransactionResult> {
  // Normalize and cache the instrument globally for stable identity.
  const provider = normalizeRequiredText(input.instrument.provider).toLowerCase();
  const providerKey = normalizeOptionalText(input.instrument.providerKey);
  const symbol = normalizeRequiredText(input.instrument.symbol);
  const name = normalizeRequiredText(input.instrument.name);
  const currency = normalizeCurrency(input.instrument.currency);
  const exchange = normalizeOptionalText(input.instrument.exchange);
  const region = normalizeOptionalText(input.instrument.region);
  const logoUrl = normalizeOptionalText(input.instrument.logoUrl);
  // Persist Yahoo quoteType so we can group holdings by asset class later.
  const instrumentType = input.instrument.instrumentType ?? null;

  // Backend safety: provider_key is required for global instruments.
  if (!providerKey) {
    throw new Error("Instrument wymaga provider_key.");
  }

  const isCashInstrument =
    instrumentType === "CURRENCY" || provider.toLowerCase() === "system";
  const cashflowType = input.cashflowType ?? null;

  if (isCashInstrument && !cashflowType) {
    throw new Error("Transakcja gotówkowa wymaga typu przepływu.");
  }

  const groupId = crypto.randomUUID();
  const now = new Date().toISOString();
  const instrumentPayload = {
    provider,
    provider_key: providerKey,
    symbol,
    name,
    currency,
    exchange,
    region,
    logo_url: logoUrl,
    updated_at: now,
  } as const;

  // Avoid overwriting an existing type with null from older clients.
  const instrumentPayloadWithType = instrumentType
    ? { ...instrumentPayload, instrument_type: instrumentType }
    : instrumentPayload;

  // Persist logo URL (if provided) so lists can render instrument branding later.
  const { data: instrument, error: instrumentError } = await supabaseAdmin
    .from("instruments")
    .upsert(
      instrumentPayloadWithType,
      { onConflict: "provider,provider_key" }
    )
    .select("id")
    .single();

  if (instrumentError || !instrument) {
    throw new Error(instrumentError?.message ?? "Instrument save failed.");
  }

  // Build transaction legs. Each leg is a single row in the ledger.
  const assetLeg = {
    user_id: userId,
    instrument_id: instrument.id,
    portfolio_id: input.portfolioId,
    side: input.type,
    trade_date: input.date,
    quantity: input.quantity,
    price: isCashInstrument ? "1" : input.price,
    fee: isCashInstrument ? "0" : input.fee ?? "0",
    notes: input.notes?.trim() || null,
    client_request_id: input.clientRequestId,
    group_id: groupId,
    leg_role: "ASSET",
    leg_key: "ASSET",
    cashflow_type: isCashInstrument ? cashflowType : null,
  } as const;

  const legs: Array<Record<string, string | null>> = [assetLeg];

  if (!isCashInstrument && input.consumeCash) {
    const requestedCashCurrency = normalizeCurrency(input.cashCurrency ?? "");
    if (!isSupportedCashCurrency(requestedCashCurrency)) {
      throw new Error("Nieobsługiwana waluta gotówki.");
    }

    const cashInstrument = buildCashInstrument(requestedCashCurrency);

    const { data: cashRow, error: cashError } = await supabaseAdmin
      .from("instruments")
      .upsert(
        {
          provider: cashInstrument.provider,
          provider_key: cashInstrument.providerKey,
          symbol: cashInstrument.symbol,
          name: cashInstrument.name,
          currency: cashInstrument.currency,
          exchange: null,
          region: null,
          logo_url: null,
          instrument_type: "CURRENCY",
          updated_at: now,
        },
        { onConflict: "provider,provider_key" }
      )
      .select("id")
      .single();

    if (cashError || !cashRow) {
      throw new Error(cashError?.message ?? "Cash instrument save failed.");
    }

    let fxMeta: { rate: string; asOf: string; provider: string } | null = null;

    if (requestedCashCurrency !== currency) {
      // FX is computed once at write-time and stored for auditability.
      const fxByPair = await getFxRatesCached(supabaseUser, [
        { from: currency, to: requestedCashCurrency },
      ]);
      fxMeta = resolveFxRate(fxByPair.get(`${currency}:${requestedCashCurrency}`) ?? null);
      if (!fxMeta) {
        throw new Error("Brak kursu FX do rozliczenia gotówki.");
      }
    }

    const settlementLegs = buildSettlementLegs({
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      fee: input.fee ?? "0",
      assetCurrency: currency,
      cashCurrency: requestedCashCurrency,
      fx: fxMeta ?? undefined,
      fxFee: input.fxFee ?? undefined,
    });

    settlementLegs.forEach((leg) => {
      legs.push({
        user_id: userId,
        instrument_id: cashRow.id,
        portfolio_id: input.portfolioId,
        side: leg.side,
        trade_date: input.date,
        quantity: leg.quantity,
        price: leg.price,
        fee: "0",
        notes: input.notes?.trim() || null,
        client_request_id: input.clientRequestId,
        group_id: groupId,
        leg_role: "CASH",
        leg_key: leg.legKey,
        cashflow_type: leg.cashflowType,
        settlement_fx_rate: leg.settlementFx?.rate ?? null,
        settlement_fx_as_of: leg.settlementFx?.asOf ?? null,
        settlement_fx_provider: leg.settlementFx?.provider ?? null,
      });
    });
  }

  // Insert the legs. If the client retries, we return the existing asset leg.
  const { data: inserted, error: transactionError } = await supabaseUser
    .from("transactions")
    .insert(legs)
    .select("id, instrument_id, leg_key");

  if (transactionError) {
    if (transactionError.code === "23505") {
      const { data: existing, error: existingError } = await supabaseUser
        .from("transactions")
        .select("id, instrument_id")
        .eq("user_id", userId)
        .eq("client_request_id", input.clientRequestId)
        .eq("leg_key", "ASSET")
        .maybeSingle();

      if (existingError || !existing) {
        throw new Error(
          existingError?.message ?? "Missing transaction after duplicate insert."
        );
      }

      // Best-effort profile touch; we do not block the response.
      await touchProfileLastActive(supabaseUser, userId).catch(() => undefined);

      return {
        transactionId: existing.id,
        instrumentId: existing.instrument_id,
        deduped: true,
      };
    }

    throw new Error(transactionError.message);
  }

  const assetRow = inserted?.find((row) => row.leg_key === "ASSET");
  if (!assetRow) {
    throw new Error("Brak głównego lega transakcji po zapisie.");
  }

  // Best-effort profile touch; we do not block the response.
  await touchProfileLastActive(supabaseUser, userId).catch(() => undefined);
  // Best-effort rebuild mark for past-dated transactions; no response blocking.
  await markSnapshotHistoryDirty(
    supabaseAdmin,
    userId,
    input.portfolioId,
    input.date
  ).catch(() => undefined);

  return {
    transactionId: assetRow.id,
    instrumentId: assetRow.instrument_id,
    deduped: false,
  };
}
