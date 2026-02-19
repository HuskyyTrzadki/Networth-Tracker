import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  parseDecimalString,
  type DecimalValue,
} from "@/lib/decimal";
import type { InstrumentType } from "@/features/market-data";

import type { PortfolioHolding } from "../get-portfolio-holdings";
import type { PortfolioSummary } from "../valuation";
import { SNAPSHOT_CURRENCIES, type SnapshotCurrency } from "./supported-currencies";
import type { SnapshotRowInsert, SnapshotScope, SnapshotTotals } from "./types";

const PAGE_SIZE = 1000;

const normalizeRequiredNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const normalizeOptionalNumeric = (value: string | number | null, fallback: string) =>
  value === null ? fallback : normalizeRequiredNumeric(value);

export const normalizeCurrency = (value: string) => value.trim().toUpperCase();

export type TransactionRow = Readonly<{
  trade_date: string;
  instrument_id: string | null;
  custom_instrument_id: string | null;
  side: "BUY" | "SELL";
  quantity: string | number;
  price: string | number;
  fee: string | number | null;
  leg_role: "ASSET" | "CASH" | null;
  cashflow_type: "DEPOSIT" | "WITHDRAWAL" | null;
  group_id: string | null;
  created_at: string;
}>;

export type InstrumentRow = Readonly<{
  id: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  provider: string;
  provider_key: string;
  logo_url: string | null;
  instrument_type: InstrumentType | null;
  annual_rate_pct?: string | number | null;
}>;

export type NormalizedTransaction = Readonly<{
  tradeDate: string;
  instrumentId: string;
  side: "BUY" | "SELL";
  quantity: string;
  price: string;
  fee: string;
  legRole: "ASSET" | "CASH" | null;
  cashflowType: "DEPOSIT" | "WITHDRAWAL" | null;
  groupId: string | null;
}>;

export const toSnapshotTotals = (summary: PortfolioSummary): SnapshotTotals => ({
  totalValue: summary.totalValueBase,
  isPartial: summary.isPartial,
  missingQuotes: summary.missingQuotes,
  missingFx: summary.missingFx,
  asOf: summary.asOf,
});

export const hasAnySnapshotValue = (
  totals: Readonly<Record<SnapshotCurrency, SnapshotTotals>>
) => SNAPSHOT_CURRENCIES.some((currency) => totals[currency].totalValue !== null);

export const buildSnapshotRow = (
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  bucketDate: string,
  totals: Readonly<Record<SnapshotCurrency, SnapshotTotals>>,
  externalCashflows: Readonly<Record<SnapshotCurrency, string | null>>,
  implicitTransfers: Readonly<Record<SnapshotCurrency, string | null>>
): SnapshotRowInsert => ({
  user_id: userId,
  scope,
  portfolio_id: scope === "PORTFOLIO" ? portfolioId : null,
  bucket_date: bucketDate,
  total_value_pln: totals.PLN.totalValue,
  total_value_usd: totals.USD.totalValue,
  total_value_eur: totals.EUR.totalValue,
  net_external_cashflow_pln: externalCashflows.PLN,
  net_external_cashflow_usd: externalCashflows.USD,
  net_external_cashflow_eur: externalCashflows.EUR,
  net_implicit_transfer_pln: implicitTransfers.PLN,
  net_implicit_transfer_usd: implicitTransfers.USD,
  net_implicit_transfer_eur: implicitTransfers.EUR,
  is_partial_pln: totals.PLN.isPartial,
  missing_quotes_pln: totals.PLN.missingQuotes,
  missing_fx_pln: totals.PLN.missingFx,
  as_of_pln: totals.PLN.asOf,
  is_partial_usd: totals.USD.isPartial,
  missing_quotes_usd: totals.USD.missingQuotes,
  missing_fx_usd: totals.USD.missingFx,
  as_of_usd: totals.USD.asOf,
  is_partial_eur: totals.EUR.isPartial,
  missing_quotes_eur: totals.EUR.missingQuotes,
  missing_fx_eur: totals.EUR.missingFx,
  as_of_eur: totals.EUR.asOf,
});

export const addFlowAmount = (
  map: Map<string, DecimalValue>,
  currency: string,
  amount: DecimalValue
) => {
  const key = normalizeCurrency(currency);
  const existing = map.get(key);
  map.set(key, existing ? addDecimals(existing, amount) : amount);
};

export const convertFlowToBaseCurrency = (
  baseCurrency: SnapshotCurrency,
  flowsByCurrency: ReadonlyMap<string, DecimalValue>,
  fxByPair: ReadonlyMap<string, { rate: string } | null>
) => {
  let total = decimalZero();
  let missingFx = false;

  flowsByCurrency.forEach((amount, currency) => {
    if (currency === baseCurrency) {
      total = addDecimals(total, amount);
      return;
    }

    const fx = fxByPair.get(`${currency}:${baseCurrency}`);
    const rate = parseDecimalString(fx?.rate ?? null);
    if (!rate) {
      missingFx = true;
      return;
    }

    total = addDecimals(total, multiplyDecimals(amount, rate));
  });

  if (missingFx) {
    return { value: null, missingFx: true } as const;
  }

  return { value: total.toString(), missingFx: false } as const;
};

export async function fetchScopedPortfolioIds(
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null
) {
  let query = supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", userId)
    .is("archived_at", null);

  if (scope === "PORTFOLIO") {
    query = query.eq("id", portfolioId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const ids = (data ?? []).map((row) => row.id);
  if (scope === "PORTFOLIO" && ids.length === 0) {
    throw new Error("Portfolio not found.");
  }

  return ids;
}

export async function fetchTransactionsUpToDate(
  supabase: SupabaseClient,
  userId: string,
  portfolioIds: readonly string[],
  toDate: string
) {
  const allRows: TransactionRow[] = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "trade_date,instrument_id,custom_instrument_id,side,quantity,price,fee,leg_role,cashflow_type,group_id,created_at"
      )
      .eq("user_id", userId)
      .in("portfolio_id", portfolioIds)
      .lte("trade_date", toDate)
      .order("trade_date", { ascending: true })
      .order("created_at", { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as TransactionRow[];
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return allRows;
}

export async function fetchInstrumentsByIds(
  supabase: SupabaseClient,
  ids: readonly string[]
) {
  if (ids.length === 0) {
    return [] as InstrumentRow[];
  }

  const { data, error } = await supabase
    .from("instruments")
    .select("id,symbol,name,currency,exchange,provider,provider_key,logo_url,instrument_type")
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InstrumentRow[];
}

export function toNormalizedTransactions(rows: readonly TransactionRow[]) {
  return rows
    .map((row) => {
      const instrumentId = row.instrument_id
        ? row.instrument_id
        : row.custom_instrument_id
          ? `custom:${row.custom_instrument_id}`
          : null;

      if (!instrumentId) {
        return null;
      }

      return {
        tradeDate: row.trade_date,
        instrumentId,
        side: row.side,
        quantity: normalizeRequiredNumeric(row.quantity),
        price: normalizeRequiredNumeric(row.price),
        fee: normalizeOptionalNumeric(row.fee, "0"),
        legRole: row.leg_role,
        cashflowType: row.cashflow_type,
        groupId: row.group_id,
      } satisfies NormalizedTransaction;
    })
    .filter((row): row is NormalizedTransaction => Boolean(row));
}

export async function fetchCustomInstrumentsByIds(
  supabase: SupabaseClient,
  userId: string,
  ids: readonly string[]
) {
  if (ids.length === 0) {
    return [] as InstrumentRow[];
  }

  const { data, error } = await supabase
    .from("custom_instruments")
    .select("id,name,currency,annual_rate_pct")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ReadonlyArray<{
    id: string;
    name: string;
    currency: string;
    annual_rate_pct: string | number;
  }>;

  return rows.map(
    (row) =>
      ({
        id: `custom:${row.id}`,
        symbol: "CUSTOM",
        name: row.name,
        currency: row.currency,
        exchange: null,
        provider: "custom",
        provider_key: row.id,
        logo_url: null,
        instrument_type: null,
        annual_rate_pct: row.annual_rate_pct,
      }) satisfies InstrumentRow
  );
}

export const buildFxPairs = (currencies: readonly string[]) => {
  const pairs = new Set<string>();

  currencies.forEach((currency) => {
    SNAPSHOT_CURRENCIES.forEach((baseCurrency) => {
      if (currency === baseCurrency) return;
      pairs.add(`${currency}:${baseCurrency}`);
    });
  });

  return Array.from(pairs).map((key) => {
    const [from, to] = key.split(":");
    return { from, to };
  });
};

export type { PortfolioHolding };
