import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getFxRatesCached,
  getInstrumentQuotesCached,
  type CurrencyCode,
  type FxPair,
  type InstrumentQuoteRequest,
} from "@/features/market-data";

import type { InstrumentType } from "@/features/market-data";

import { buildPortfolioSummary, type PortfolioSummary } from "../valuation";
import {
  SNAPSHOT_CURRENCIES,
  type SnapshotCurrency,
} from "./supported-currencies";
import type { SnapshotRowInsert, SnapshotScope, SnapshotTotals } from "./types";

type PortfolioHoldingRow = Readonly<{
  instrument_id: string;
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
  provider: string;
  provider_key: string;
  logo_url: string | null;
  instrument_type: InstrumentType | null;
  quantity: string | number;
}>;

type PortfolioHolding = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  currency: CurrencyCode;
  exchange: string | null;
  provider: string;
  providerKey: string;
  logoUrl: string | null;
  instrumentType: InstrumentType | null;
  quantity: string;
}>;

type SnapshotComputeResult = Readonly<{
  row: SnapshotRowInsert;
  hasHoldings: boolean;
  hasAnyValue: boolean;
}>;

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const toSnapshotTotals = (summary: PortfolioSummary): SnapshotTotals => ({
  totalValue: summary.totalValueBase,
  isPartial: summary.isPartial,
  missingQuotes: summary.missingQuotes,
  missingFx: summary.missingFx,
  asOf: summary.asOf,
});

const buildSnapshotRow = (
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  bucketDate: string,
  totals: Readonly<Record<SnapshotCurrency, SnapshotTotals>>
): SnapshotRowInsert => ({
  user_id: userId,
  scope,
  portfolio_id: scope === "PORTFOLIO" ? portfolioId : null,
  bucket_date: bucketDate,
  total_value_pln: totals.PLN.totalValue,
  total_value_usd: totals.USD.totalValue,
  total_value_eur: totals.EUR.totalValue,
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

const hasAnySnapshotValue = (
  totals: Readonly<Record<SnapshotCurrency, SnapshotTotals>>
) =>
  SNAPSHOT_CURRENCIES.some((currency) => totals[currency].totalValue !== null);

const buildHoldings = (rows: readonly PortfolioHoldingRow[]): PortfolioHolding[] =>
  rows.map((row) => ({
    instrumentId: row.instrument_id,
    symbol: row.symbol,
    name: row.name,
    currency: row.currency,
    exchange: row.exchange ?? null,
    provider: row.provider,
    providerKey: row.provider_key,
    logoUrl: row.logo_url ?? null,
    instrumentType: row.instrument_type ?? null,
    quantity: normalizeNumeric(row.quantity),
  }));

const buildFxPairs = (
  holdings: readonly PortfolioHolding[]
): FxPair[] => {
  const pairs = new Set<string>();

  holdings.forEach((holding) => {
    SNAPSHOT_CURRENCIES.forEach((currency) => {
      if (holding.currency === currency) return;
      pairs.add(`${holding.currency}:${currency}`);
    });
  });

  return Array.from(pairs).map((key) => {
    const [from, to] = key.split(":");
    return { from, to };
  });
};

export async function computePortfolioSnapshot(
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  bucketDate: string
): Promise<SnapshotComputeResult> {
  // Admin-side compute: build a snapshot row using cached quotes/FX.
  const { data, error } = await supabase.rpc("get_portfolio_holdings_admin", {
    p_user_id: userId,
    p_portfolio_id: portfolioId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const holdingRows = (data ?? []) as PortfolioHoldingRow[];
  const holdings = buildHoldings(holdingRows);
  const hasHoldings = holdings.length > 0;

  const quoteRequests: InstrumentQuoteRequest[] = holdings.map((holding) => ({
    instrumentId: holding.instrumentId,
    provider: "yahoo",
    providerKey: holding.providerKey,
  }));

  const quotesByInstrument = await getInstrumentQuotesCached(
    supabase,
    quoteRequests
  );

  const fxPairs = buildFxPairs(holdings);
  const fxByPair = await getFxRatesCached(supabase, fxPairs);

  const totals = SNAPSHOT_CURRENCIES.reduce(
    (acc, currency) => {
      const summary = buildPortfolioSummary({
        baseCurrency: currency,
        holdings,
        quotesByInstrument,
        fxByPair,
      });

      acc[currency] = toSnapshotTotals(summary);
      return acc;
    },
    {} as Record<SnapshotCurrency, SnapshotTotals>
  );

  return {
    row: buildSnapshotRow(userId, scope, portfolioId, bucketDate, totals),
    hasHoldings,
    hasAnyValue: hasAnySnapshotValue(totals),
  };
}

export const __test__ = {
  buildSnapshotRow,
  buildFxPairs,
  hasAnySnapshotValue,
};
