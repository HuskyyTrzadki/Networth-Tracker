import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getFxDailyRatesCached,
  getInstrumentDailyPricesCached,
  type CurrencyCode,
  type FxPair,
  type InstrumentQuoteRequest,
} from "@/features/market-data";
import {
  addDecimals,
  decimalZero,
  multiplyDecimals,
  parseDecimalString,
} from "@/lib/decimal";

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

const normalizeCurrency = (value: string) => value.trim().toUpperCase();

const normalizeFlowAmount = (value: string | number | null) => {
  if (value === null) return null;
  return typeof value === "number" ? value.toString() : value;
};

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

const hasAnySnapshotValue = (
  totals: Readonly<Record<SnapshotCurrency, SnapshotTotals>>
) =>
  SNAPSHOT_CURRENCIES.some((currency) => totals[currency].totalValue !== null);

type FlowRow = Readonly<{
  currency: string;
  net_amount: string | number | null;
}>;

type FlowTotals = Readonly<{
  value: string | null;
  missingFx: boolean;
}>;

const buildFlowMap = (rows: readonly FlowRow[]): Map<string, string> => {
  const map = new Map<string, string>();

  rows.forEach((row) => {
    const amount = normalizeFlowAmount(row.net_amount);
    if (amount === null) return;
    map.set(normalizeCurrency(row.currency), amount);
  });

  return map;
};

const buildFxPairs = (currencies: readonly CurrencyCode[]): FxPair[] => {
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

const convertFlowToBaseCurrency = (
  baseCurrency: SnapshotCurrency,
  flowsByCurrency: ReadonlyMap<string, string>,
  fxByPair: ReadonlyMap<string, { rate: string } | null>
): FlowTotals => {
  let total = decimalZero();
  let missingFx = false;

  flowsByCurrency.forEach((rawAmount, currency) => {
    const amount = parseDecimalString(rawAmount);
    if (!amount) return;

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
    return { value: null, missingFx: true };
  }

  return { value: total.toString(), missingFx: false };
};

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

const collectCurrencies = (
  holdings: readonly PortfolioHolding[],
  flowMaps: readonly ReadonlyMap<string, string>[]
): CurrencyCode[] => {
  const set = new Set<string>();

  holdings.forEach((holding) => set.add(normalizeCurrency(holding.currency)));
  flowMaps.forEach((map) => {
    map.forEach((_value, currency) => set.add(normalizeCurrency(currency)));
  });

  return Array.from(set);
};

export async function computePortfolioSnapshotAtDate(
  supabase: SupabaseClient,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null,
  bucketDate: string
): Promise<SnapshotComputeResult> {
  // Admin-side compute: use holdings and market closes as of the selected day.
  const { data, error } = await supabase.rpc("get_portfolio_holdings_admin_as_of", {
    p_user_id: userId,
    p_portfolio_id: portfolioId,
    p_bucket_date: bucketDate,
  });

  if (error) {
    throw new Error(error.message);
  }

  const holdingRows = (data ?? []) as PortfolioHoldingRow[];
  const holdings = buildHoldings(holdingRows);
  const hasHoldings = holdings.length > 0;

  const quoteRequests: InstrumentQuoteRequest[] = holdings
    .filter((holding) => holding.instrumentType !== "CURRENCY")
    .map((holding) => ({
      instrumentId: holding.instrumentId,
      provider: "yahoo",
      providerKey: holding.providerKey,
    }));

  const { data: externalRows, error: externalError } = await supabase.rpc(
    "get_external_cashflows_admin",
    {
      p_user_id: userId,
      p_portfolio_id: portfolioId,
      p_bucket_date: bucketDate,
    }
  );

  if (externalError) {
    throw new Error(externalError.message);
  }

  const { data: implicitRows, error: implicitError } = await supabase.rpc(
    "get_implicit_transfers_admin",
    {
      p_user_id: userId,
      p_portfolio_id: portfolioId,
      p_bucket_date: bucketDate,
    }
  );

  if (implicitError) {
    throw new Error(implicitError.message);
  }

  const externalFlows = buildFlowMap((externalRows ?? []) as FlowRow[]);
  const implicitTransfers = buildFlowMap((implicitRows ?? []) as FlowRow[]);

  const dailyPricesByInstrument = await getInstrumentDailyPricesCached(
    supabase,
    quoteRequests,
    bucketDate,
    {
      lookbackDays: 45,
    }
  );

  const quotesByInstrument = new Map(
    quoteRequests.map((request) => {
      const price = dailyPricesByInstrument.get(request.instrumentId) ?? null;
      if (!price) {
        return [request.instrumentId, null] as const;
      }

      return [
        request.instrumentId,
        {
          instrumentId: request.instrumentId,
          currency: price.currency,
          price: price.close,
          dayChange: null,
          dayChangePercent: null,
          asOf: price.asOf,
          fetchedAt: price.fetchedAt,
        },
      ] as const;
    })
  );

  const fxPairs = buildFxPairs(
    collectCurrencies(holdings, [externalFlows, implicitTransfers])
  );

  const fxByPair = await getFxDailyRatesCached(supabase, fxPairs, bucketDate, {
    lookbackDays: 45,
  });

  const flowTotalsByCurrency = SNAPSHOT_CURRENCIES.reduce(
    (acc, currency) => {
      const external = convertFlowToBaseCurrency(currency, externalFlows, fxByPair);
      const implicit = convertFlowToBaseCurrency(
        currency,
        implicitTransfers,
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
    {} as Record<SnapshotCurrency, SnapshotTotals>
  );

  return {
    row: buildSnapshotRow(
      userId,
      scope,
      portfolioId,
      bucketDate,
      totals,
      flowTotalsByCurrency.external,
      flowTotalsByCurrency.implicit
    ),
    hasHoldings,
    hasAnyValue: hasAnySnapshotValue(totals),
  };
}
