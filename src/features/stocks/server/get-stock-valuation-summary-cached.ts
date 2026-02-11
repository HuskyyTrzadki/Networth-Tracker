import type { createClient } from "@/lib/supabase/server";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { yahooFinance } from "@/lib/yahoo-finance-client";

import type { StockValuationSummary } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

const PROVIDER = "yahoo";
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

type SummaryCacheRow = Readonly<{
  provider: string;
  provider_key: string;
  market_cap: number | string | null;
  pe_ttm: number | string | null;
  price_to_sales: number | string | null;
  ev_to_ebitda: number | string | null;
  price_to_book: number | string | null;
  profit_margin: number | string | null;
  operating_margin: number | string | null;
  quarterly_earnings_yoy: number | string | null;
  quarterly_revenue_yoy: number | string | null;
  cash: number | string | null;
  debt: number | string | null;
  dividend_yield: number | string | null;
  payout_ratio: number | string | null;
  payout_date: string | null;
  as_of: string | null;
  fetched_at: string;
}>;

type QuoteSummaryLike = Readonly<{
  summaryDetail?: Readonly<{
    marketCap?: number;
    trailingPE?: number;
    priceToSalesTrailing12Months?: number;
    dividendYield?: number;
    payoutRatio?: number;
  }>;
  defaultKeyStatistics?: Readonly<{
    enterpriseToEbitda?: number;
    priceToBook?: number;
    profitMargins?: number;
  }>;
  financialData?: Readonly<{
    profitMargins?: number;
    operatingMargins?: number;
    earningsGrowth?: number;
    revenueGrowth?: number;
    totalCash?: number;
    totalDebt?: number;
  }>;
  calendarEvents?: Readonly<{
    dividendDate?: Date;
    exDividendDate?: Date;
  }>;
  price?: Readonly<{
    regularMarketTime?: Date;
  }>;
}>;

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const toNumberOrNull = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toDateOnly = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const fromRow = (providerKey: string, row: SummaryCacheRow): StockValuationSummary => ({
  providerKey,
  marketCap: toNumberOrNull(row.market_cap),
  peTtm: toNumberOrNull(row.pe_ttm),
  priceToSales: toNumberOrNull(row.price_to_sales),
  evToEbitda: toNumberOrNull(row.ev_to_ebitda),
  priceToBook: toNumberOrNull(row.price_to_book),
  profitMargin: toNumberOrNull(row.profit_margin),
  operatingMargin: toNumberOrNull(row.operating_margin),
  quarterlyEarningsYoy: toNumberOrNull(row.quarterly_earnings_yoy),
  quarterlyRevenueYoy: toNumberOrNull(row.quarterly_revenue_yoy),
  cash: toNumberOrNull(row.cash),
  debt: toNumberOrNull(row.debt),
  dividendYield: toNumberOrNull(row.dividend_yield),
  payoutRatio: toNumberOrNull(row.payout_ratio),
  payoutDate: row.payout_date ?? null,
  asOf: row.as_of ?? null,
  fetchedAt: row.fetched_at,
});

const fromYahoo = (
  providerKey: string,
  quoteSummary: QuoteSummaryLike
): StockValuationSummary => {
  const payoutDate =
    toDateOnly(quoteSummary.calendarEvents?.dividendDate) ??
    toDateOnly(quoteSummary.calendarEvents?.exDividendDate);

  return {
    providerKey,
    marketCap: toNumberOrNull(quoteSummary.summaryDetail?.marketCap),
    peTtm: toNumberOrNull(quoteSummary.summaryDetail?.trailingPE),
    priceToSales: toNumberOrNull(
      quoteSummary.summaryDetail?.priceToSalesTrailing12Months
    ),
    evToEbitda: toNumberOrNull(
      quoteSummary.defaultKeyStatistics?.enterpriseToEbitda
    ),
    priceToBook:
      toNumberOrNull(quoteSummary.defaultKeyStatistics?.priceToBook) ??
      null,
    profitMargin:
      toNumberOrNull(quoteSummary.financialData?.profitMargins) ??
      toNumberOrNull(quoteSummary.defaultKeyStatistics?.profitMargins) ??
      null,
    operatingMargin: toNumberOrNull(quoteSummary.financialData?.operatingMargins),
    quarterlyEarningsYoy: toNumberOrNull(
      quoteSummary.financialData?.earningsGrowth
    ),
    quarterlyRevenueYoy: toNumberOrNull(quoteSummary.financialData?.revenueGrowth),
    cash: toNumberOrNull(quoteSummary.financialData?.totalCash),
    debt: toNumberOrNull(quoteSummary.financialData?.totalDebt),
    dividendYield: toNumberOrNull(quoteSummary.summaryDetail?.dividendYield),
    payoutRatio: toNumberOrNull(quoteSummary.summaryDetail?.payoutRatio),
    payoutDate,
    asOf: quoteSummary.price?.regularMarketTime?.toISOString() ?? null,
    fetchedAt: new Date().toISOString(),
  };
};

const readCache = async (
  supabase: SupabaseServerClient,
  providerKey: string
): Promise<SummaryCacheRow | null> => {
  const { data, error } = await supabase
    .from("instrument_valuation_summary_cache")
    .select(
      "provider,provider_key,market_cap,pe_ttm,price_to_sales,ev_to_ebitda,price_to_book,profit_margin,operating_margin,quarterly_earnings_yoy,quarterly_revenue_yoy,cash,debt,dividend_yield,payout_ratio,payout_date,as_of,fetched_at"
    )
    .eq("provider", PROVIDER)
    .eq("provider_key", providerKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SummaryCacheRow | null) ?? null;
};

const writeCache = async (summary: StockValuationSummary) => {
  const adminClient = tryCreateAdminClient();
  if (!adminClient) return;

  const { error } = await adminClient.from("instrument_valuation_summary_cache").upsert(
    {
      provider: PROVIDER,
      provider_key: summary.providerKey,
      market_cap: summary.marketCap,
      pe_ttm: summary.peTtm,
      price_to_sales: summary.priceToSales,
      ev_to_ebitda: summary.evToEbitda,
      price_to_book: summary.priceToBook,
      profit_margin: summary.profitMargin,
      operating_margin: summary.operatingMargin,
      quarterly_earnings_yoy: summary.quarterlyEarningsYoy,
      quarterly_revenue_yoy: summary.quarterlyRevenueYoy,
      cash: summary.cash,
      debt: summary.debt,
      dividend_yield: summary.dividendYield,
      payout_ratio: summary.payoutRatio,
      payout_date: summary.payoutDate,
      as_of: summary.asOf,
      fetched_at: summary.fetchedAt,
    },
    { onConflict: "provider,provider_key" }
  );

  if (error) {
    throw new Error(error.message);
  }
};

export async function getStockValuationSummaryCached(
  supabase: SupabaseServerClient,
  providerKey: string,
  options?: Readonly<{ ttlMs?: number }>
): Promise<StockValuationSummary> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const cached = await readCache(supabase, providerKey);

  if (cached && isFresh(cached.fetched_at, ttlMs)) {
    return fromRow(providerKey, cached);
  }

  try {
    // Backend fetch: request only the modules we need to keep latency predictable.
    const raw = await yahooFinance.quoteSummary(
      providerKey,
      {
        modules: [
          "summaryDetail",
          "defaultKeyStatistics",
          "financialData",
          "calendarEvents",
          "price",
        ],
      },
      { validateResult: false }
    );

    const fresh = fromYahoo(providerKey, raw as QuoteSummaryLike);
    await writeCache(fresh);
    return fresh;
  } catch (error) {
    if (cached) {
      return fromRow(providerKey, cached);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
}
