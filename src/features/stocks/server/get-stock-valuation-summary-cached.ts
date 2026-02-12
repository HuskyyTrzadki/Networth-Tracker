import type { createClient } from "@/lib/supabase/server";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { yahooFinance } from "@/lib/yahoo-finance-client";

import type { StockValuationSummary } from "./types";
import { toDateOrNull, toFiniteNumber, toIsoDate } from "./value-normalizers";

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

const toDateOnly = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = toDateOrNull(value);
  return date ? toIsoDate(date) : null;
};

const fromRow = (providerKey: string, row: SummaryCacheRow): StockValuationSummary => ({
  providerKey,
  marketCap: toFiniteNumber(row.market_cap),
  peTtm: toFiniteNumber(row.pe_ttm),
  priceToSales: toFiniteNumber(row.price_to_sales),
  evToEbitda: toFiniteNumber(row.ev_to_ebitda),
  priceToBook: toFiniteNumber(row.price_to_book),
  profitMargin: toFiniteNumber(row.profit_margin),
  operatingMargin: toFiniteNumber(row.operating_margin),
  quarterlyEarningsYoy: toFiniteNumber(row.quarterly_earnings_yoy),
  quarterlyRevenueYoy: toFiniteNumber(row.quarterly_revenue_yoy),
  cash: toFiniteNumber(row.cash),
  debt: toFiniteNumber(row.debt),
  dividendYield: toFiniteNumber(row.dividend_yield),
  payoutRatio: toFiniteNumber(row.payout_ratio),
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
    marketCap: toFiniteNumber(quoteSummary.summaryDetail?.marketCap),
    peTtm: toFiniteNumber(quoteSummary.summaryDetail?.trailingPE),
    priceToSales: toFiniteNumber(
      quoteSummary.summaryDetail?.priceToSalesTrailing12Months
    ),
    evToEbitda: toFiniteNumber(
      quoteSummary.defaultKeyStatistics?.enterpriseToEbitda
    ),
    priceToBook:
      toFiniteNumber(quoteSummary.defaultKeyStatistics?.priceToBook) ??
      null,
    profitMargin:
      toFiniteNumber(quoteSummary.financialData?.profitMargins) ??
      toFiniteNumber(quoteSummary.defaultKeyStatistics?.profitMargins) ??
      null,
    operatingMargin: toFiniteNumber(quoteSummary.financialData?.operatingMargins),
    quarterlyEarningsYoy: toFiniteNumber(
      quoteSummary.financialData?.earningsGrowth
    ),
    quarterlyRevenueYoy: toFiniteNumber(quoteSummary.financialData?.revenueGrowth),
    cash: toFiniteNumber(quoteSummary.financialData?.totalCash),
    debt: toFiniteNumber(quoteSummary.financialData?.totalDebt),
    dividendYield: toFiniteNumber(quoteSummary.summaryDetail?.dividendYield),
    payoutRatio: toFiniteNumber(quoteSummary.summaryDetail?.payoutRatio),
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
