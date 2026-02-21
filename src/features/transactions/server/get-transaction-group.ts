import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseServerClient = SupabaseClient;

type InstrumentJoinRow = Readonly<{
  provider: string;
  provider_key: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  region: string | null;
  logo_url: string | null;
  instrument_type: string | null;
}>;

type CustomInstrumentJoinRow = Readonly<{
  id: string;
  name: string;
  currency: string;
  kind: string;
  valuation_kind: string;
  annual_rate_pct: string | number;
  notes: string | null;
}>;

type TransactionGroupLegRow = Readonly<{
  id: string;
  user_id: string;
  portfolio_id: string;
  trade_date: string;
  side: "BUY" | "SELL";
  quantity: string | number;
  price: string | number;
  fee: string | number;
  notes: string | null;
  client_request_id: string;
  group_id: string;
  leg_role: "ASSET" | "CASH";
  leg_key: "ASSET" | "CASH_SETTLEMENT" | "CASH_FX_FEE";
  cashflow_type: string | null;
  instrument_id: string | null;
  custom_instrument_id: string | null;
  settlement_fx_rate: string | number | null;
  settlement_fx_as_of: string | null;
  settlement_fx_provider: string | null;
  instrument: InstrumentJoinRow | InstrumentJoinRow[] | null;
  custom_instrument: CustomInstrumentJoinRow | CustomInstrumentJoinRow[] | null;
}>;

export type TransactionGroupLeg = Readonly<{
  id: string;
  userId: string;
  portfolioId: string;
  tradeDate: string;
  side: "BUY" | "SELL";
  quantity: string;
  price: string;
  fee: string;
  notes: string | null;
  clientRequestId: string;
  groupId: string;
  legRole: "ASSET" | "CASH";
  legKey: "ASSET" | "CASH_SETTLEMENT" | "CASH_FX_FEE";
  cashflowType: string | null;
  instrumentId: string | null;
  customInstrumentId: string | null;
  settlementFxRate: string | null;
  settlementFxAsOf: string | null;
  settlementFxProvider: string | null;
  instrument: InstrumentJoinRow | null;
  customInstrument: CustomInstrumentJoinRow | null;
}>;

type TransactionGroupResult = Readonly<{
  groupId: string;
  legs: readonly TransactionGroupLeg[];
  assetLeg: TransactionGroupLeg;
}>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_RE.test(value);

const toSingleRelation = <T>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

const normalizeNumeric = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "0";
  return typeof value === "number" ? value.toString() : value;
};

const normalizeNullableNumeric = (
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value.toString() : value;
};

const selectColumns =
  "id, user_id, portfolio_id, trade_date, side, quantity, price, fee, notes, client_request_id, group_id, leg_role, leg_key, cashflow_type, instrument_id, custom_instrument_id, settlement_fx_rate, settlement_fx_as_of, settlement_fx_provider, instrument:instruments(provider, provider_key, symbol, name, currency, exchange, region, logo_url, instrument_type), custom_instrument:custom_instruments(id, name, currency, kind, valuation_kind, annual_rate_pct, notes)";

const toTransactionGroupLeg = (row: TransactionGroupLegRow): TransactionGroupLeg => ({
  id: row.id,
  userId: row.user_id,
  portfolioId: row.portfolio_id,
  tradeDate: row.trade_date,
  side: row.side,
  quantity: normalizeNumeric(row.quantity),
  price: normalizeNumeric(row.price),
  fee: normalizeNumeric(row.fee),
  notes: row.notes,
  clientRequestId: row.client_request_id,
  groupId: row.group_id,
  legRole: row.leg_role,
  legKey: row.leg_key,
  cashflowType: row.cashflow_type,
  instrumentId: row.instrument_id,
  customInstrumentId: row.custom_instrument_id,
  settlementFxRate: normalizeNullableNumeric(row.settlement_fx_rate),
  settlementFxAsOf: row.settlement_fx_as_of,
  settlementFxProvider: row.settlement_fx_provider,
  instrument: toSingleRelation(row.instrument),
  customInstrument: toSingleRelation(row.custom_instrument),
});

const resolveGroupId = async (
  supabase: SupabaseServerClient,
  userId: string,
  transactionIdentifier: string
) => {
  if (!isUuid(transactionIdentifier)) {
    return null;
  }

  const { data: byTransactionId, error: byTransactionIdError } = await supabase
    .from("transactions")
    .select("group_id")
    .eq("id", transactionIdentifier)
    .eq("user_id", userId)
    .maybeSingle();

  if (byTransactionIdError) {
    throw new Error(byTransactionIdError.message);
  }

  if (byTransactionId?.group_id) {
    return byTransactionId.group_id;
  }

  const { data: byGroupId, error: byGroupIdError } = await supabase
    .from("transactions")
    .select("group_id")
    .eq("group_id", transactionIdentifier)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (byGroupIdError) {
    throw new Error(byGroupIdError.message);
  }

  return byGroupId?.group_id ?? null;
};

export async function getTransactionGroupByTransactionId(
  supabase: SupabaseServerClient,
  userId: string,
  transactionId: string
): Promise<TransactionGroupResult> {
  const resolvedGroupId = await resolveGroupId(supabase, userId, transactionId);
  if (!resolvedGroupId) {
    throw new Error("Transakcja nie istnieje albo nie masz do niej dostępu.");
  }

  const { data: rows, error } = await supabase
    .from("transactions")
    .select(selectColumns)
    .eq("user_id", userId)
    .eq("group_id", resolvedGroupId)
    .order("created_at", { ascending: true })
    .order("leg_key", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const normalized = ((rows ?? []) as TransactionGroupLegRow[]).map(
    toTransactionGroupLeg
  );

  if (normalized.length === 0) {
    throw new Error("Transakcja nie istnieje albo nie masz do niej dostępu.");
  }

  const assetLeg = normalized.find((row) => row.legKey === "ASSET");
  if (!assetLeg) {
    throw new Error("Brak lega ASSET w grupie transakcji.");
  }

  return {
    groupId: resolvedGroupId,
    legs: normalized,
    assetLeg,
  };
}
