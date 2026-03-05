import { subDays } from "date-fns";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { multiplyDecimals, parseDecimalString, toFixedDecimalString } from "@/lib/decimal";
import { getInstrumentDividendSignalsCached } from "@/features/market-data";
import type { DividendInboxItem, DividendInboxResult } from "@/features/portfolio/lib/dividend-inbox";

import { computeDividendSmartDefault, buildDividendEventKey, classifyDividendMarket } from "./dividend-utils";
import {
  buildPastDividendInboxItem,
  buildUpcomingDividendInboxItem,
  finalizePastDividendItems,
  finalizeUpcomingDividendItems,
} from "./dividend-inbox-builders";

type SupabaseClient = ReturnType<typeof createClient>;

type HoldingRow = Readonly<{
  provider: string;
  provider_key: string;
  symbol: string;
  name: string;
  currency: string;
  quantity: string | number;
  instrument_type: string | null;
}>;

type InstrumentMetaRow = Readonly<{
  provider_key: string;
  region: string | null;
}>;

const TODAY = () => new Date();
const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

const fetchCurrentYahooHoldings = async (
  supabase: SupabaseClient,
  portfolioId: string | null
) => {
  const { data, error } = await supabase.rpc("get_portfolio_holdings", {
    p_portfolio_id: portfolioId ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as HoldingRow[])
    .filter(
      (holding) =>
        holding.provider === "yahoo" &&
        holding.instrument_type !== "CURRENCY"
    )
    .map((holding) => ({
      providerKey: holding.provider_key,
      symbol: holding.symbol,
      name: holding.name,
      currency: holding.currency.toUpperCase(),
      quantity: normalizeNumeric(holding.quantity),
    }));
};

const fetchAsOfYahooHoldingsByDate = async (input: Readonly<{
  userId: string;
  portfolioId: string;
  bucketDate: string;
}>) => {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return new Map<string, string>();
  }
  const { data, error } = await admin.rpc("get_portfolio_holdings_admin_as_of", {
    p_user_id: input.userId,
    p_portfolio_id: input.portfolioId,
    p_bucket_date: input.bucketDate,
  });

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, string>();
  ((data ?? []) as HoldingRow[])
    .filter(
      (holding) =>
        holding.provider === "yahoo" &&
        holding.instrument_type !== "CURRENCY"
    )
    .forEach((holding) => {
      map.set(holding.provider_key, normalizeNumeric(holding.quantity));
    });

  return map;
};

const fetchInstrumentRegionByProviderKey = async (
  supabase: SupabaseClient,
  providerKeys: readonly string[]
) => {
  if (providerKeys.length === 0) {
    return new Map<string, string | null>();
  }

  const { data, error } = await supabase
    .from("instruments")
    .select("provider_key, region")
    .eq("provider", "yahoo")
    .in("provider_key", providerKeys);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as InstrumentMetaRow[];
  return new Map(rows.map((row) => [row.provider_key, row.region ?? null] as const));
};

const fetchPortfolioTaxProfile = async (
  supabase: SupabaseClient,
  portfolioId: string
) => {
  const { data, error } = await supabase
    .from("portfolios")
    .select("id, is_tax_advantaged")
    .eq("id", portfolioId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Portfolio not found.");
  }

  return Boolean(data.is_tax_advantaged);
};

const computeGross = (shares: string, amountPerShare: string) => {
  const sharesDecimal = parseDecimalString(shares);
  const amountDecimal = parseDecimalString(amountPerShare);
  if (!sharesDecimal || !amountDecimal) return null;

  return toFixedDecimalString(multiplyDecimals(sharesDecimal, amountDecimal), 2);
};

const fetchBookedEventKeys = async (input: Readonly<{
  supabase: SupabaseClient;
  portfolioId: string;
  keys: readonly string[];
}>) => {
  if (input.keys.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await input.supabase
    .from("transactions")
    .select("dividend_event_key")
    .eq("portfolio_id", input.portfolioId)
    .eq("leg_role", "ASSET")
    .eq("cashflow_type", "DIVIDEND")
    .in("dividend_event_key", input.keys);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    ((data ?? []) as ReadonlyArray<{ dividend_event_key: string | null }>)
      .map((row) => row.dividend_event_key)
      .filter((value): value is string => Boolean(value))
  );
};

export async function getDividendInbox(input: Readonly<{
  supabase: SupabaseClient;
  userId: string;
  portfolioId: string | null;
  pastDays?: number;
  futureDays?: number;
}>): Promise<DividendInboxResult> {
  const today = toIsoDate(TODAY());
  const pastDays = Math.max(1, Math.min(input.pastDays ?? 60, 365));
  const futureDays = Math.max(1, Math.min(input.futureDays ?? 60, 365));
  const pastFromDate = toIsoDate(subDays(TODAY(), pastDays));
  const historicalLookbackFromDate = toIsoDate(subDays(TODAY(), 400));
  const futureToDate = toIsoDate(subDays(TODAY(), -futureDays));
  const isReadOnly = input.portfolioId === null;

  const [holdings, isTaxAdvantaged] = await Promise.all([
    fetchCurrentYahooHoldings(input.supabase, input.portfolioId),
    input.portfolioId
      ? fetchPortfolioTaxProfile(input.supabase, input.portfolioId)
      : Promise.resolve(false),
  ]);

  if (holdings.length === 0) {
    return {
      scope: input.portfolioId ? "PORTFOLIO" : "ALL",
      isReadOnly,
      generatedAt: new Date().toISOString(),
      pastItems: [],
      upcomingItems: [],
    };
  }

  const providerKeys = holdings.map((holding) => holding.providerKey);
  const [regionByProviderKey, signalsByProviderKey] = await Promise.all([
    fetchInstrumentRegionByProviderKey(input.supabase, providerKeys),
    getInstrumentDividendSignalsCached(
      holdings.map((holding) => ({
        provider: "yahoo" as const,
        providerKey: holding.providerKey,
      })),
      {
        pastFromDate,
        pastToDate: today,
        futureToDate,
        historicalLookbackFromDate,
        timeoutMs: 6_000,
        maxConcurrency: 4,
      }
    ),
  ]);

  const pastCandidates = holdings.flatMap((holding) => {
    const signals = signalsByProviderKey.get(holding.providerKey);
    if (!signals) return [];

    return signals.pastEvents.map((event) => ({
      holding,
      eventDate: event.eventDate,
      amountPerShare: event.amountPerShare,
    }));
  });

  const asOfByDate = new Map<string, Map<string, string>>();
  const selectedPortfolioId = input.portfolioId;
  if (selectedPortfolioId) {
    const uniqueDates = Array.from(new Set(pastCandidates.map((item) => item.eventDate)));
    const resolved = await Promise.all(
      uniqueDates.map(async (bucketDate) => [
        bucketDate,
        await fetchAsOfYahooHoldingsByDate({
          userId: input.userId,
          portfolioId: selectedPortfolioId,
          bucketDate,
        }),
      ] as const)
    );
    resolved.forEach(([date, map]) => asOfByDate.set(date, map));
  }

  const rawPastItems: DividendInboxItem[] = [];
  if (selectedPortfolioId) {
    for (const candidate of pastCandidates) {
      const asOfHoldings = asOfByDate.get(candidate.eventDate);
      const shares = asOfHoldings?.get(candidate.holding.providerKey) ?? null;
      if (!shares) continue;

      const sharesDecimal = parseDecimalString(shares);
      if (!sharesDecimal || sharesDecimal.lte(0)) continue;

      const gross = computeGross(shares, candidate.amountPerShare);
      const market = classifyDividendMarket({
        providerKey: candidate.holding.providerKey,
        symbol: candidate.holding.symbol,
        region: regionByProviderKey.get(candidate.holding.providerKey) ?? null,
      });
      const smartDefault = computeDividendSmartDefault({
        gross,
        market,
        isTaxAdvantaged,
      });

      rawPastItems.push(
        buildPastDividendInboxItem({
          dividendEventKey: buildDividendEventKey(
            candidate.holding.providerKey,
            candidate.eventDate
          ),
          providerKey: candidate.holding.providerKey,
          symbol: candidate.holding.symbol,
          name: candidate.holding.name,
          eventDate: candidate.eventDate,
          payoutCurrency: candidate.holding.currency,
          amountPerShare: candidate.amountPerShare,
          estimatedShares: sharesDecimal.toString(),
          estimatedGross: gross,
          market,
          smartDefault,
        })
      );
    }
  }

  const upcomingItems: DividendInboxItem[] = [];
  for (const holding of holdings) {
    const upcoming = signalsByProviderKey.get(holding.providerKey)?.upcomingEvent;
    if (!upcoming) continue;

    const sharesDecimal = parseDecimalString(holding.quantity);
    if (!sharesDecimal || sharesDecimal.lte(0)) continue;

    const gross = upcoming.amountPerShare
      ? computeGross(sharesDecimal.toString(), upcoming.amountPerShare)
      : null;
    const market = classifyDividendMarket({
      providerKey: holding.providerKey,
      symbol: holding.symbol,
      region: regionByProviderKey.get(holding.providerKey) ?? null,
    });
    const smartDefault = computeDividendSmartDefault({
      gross,
      market,
      isTaxAdvantaged,
    });

    upcomingItems.push(
      buildUpcomingDividendInboxItem({
        dividendEventKey: buildDividendEventKey(holding.providerKey, upcoming.eventDate),
        providerKey: holding.providerKey,
        symbol: holding.symbol,
        name: holding.name,
        eventDate: upcoming.eventDate,
        payoutCurrency: holding.currency,
        amountPerShare: upcoming.amountPerShare,
        estimatedShares: sharesDecimal.toString(),
        estimatedGross: gross,
        market,
        smartDefault,
      })
    );
  }

  const allKnownKeys = [...rawPastItems, ...upcomingItems].map((item) => item.dividendEventKey);
  const bookedKeys =
    selectedPortfolioId && allKnownKeys.length > 0
      ? await fetchBookedEventKeys({
          supabase: input.supabase,
          portfolioId: selectedPortfolioId,
          keys: allKnownKeys,
        })
      : new Set<string>();

  const pastItems = finalizePastDividendItems({
    rawItems: rawPastItems,
    bookedKeys,
    isReadOnly,
  });

  const normalizedUpcoming = finalizeUpcomingDividendItems({
    items: upcomingItems,
    bookedKeys,
  });

  return {
    scope: input.portfolioId ? "PORTFOLIO" : "ALL",
    isReadOnly,
    generatedAt: new Date().toISOString(),
    pastItems,
    upcomingItems: normalizedUpcoming,
  };
}
