import type { FxPair, FxRate, InstrumentQuote } from "@/features/market-data";
import { getFxRatesCached } from "@/features/market-data/server/get-fx-rates-cached";
import {
  fetchYahooQuotes,
  normalizeYahooQuote,
} from "@/features/market-data/server/providers/yahoo/yahoo-quote";
import type { PortfolioHolding } from "@/features/portfolio/server/get-portfolio-holdings";
import { buildPortfolioSummary } from "@/features/portfolio/server/valuation";
import { addDecimals, decimalZero, negateDecimal, parseDecimalString } from "@/lib/decimal";

import type {
  BrokerImportPreviewHolding,
  BrokerImportPreviewRow,
  BrokerImportPreviewValuation,
} from "../../lib/broker-import-types";
import type { SupabaseServerClient } from "../search/search-types";
import { buildInstrumentId } from "../search/search-utils";

const QUOTE_TTL_MS = 15 * 60 * 1000;

const toSignedQuantity = (row: BrokerImportPreviewRow) => {
  const quantity = parseDecimalString(row.quantity);
  if (!quantity) {
    return null;
  }

  return row.side === "BUY" ? quantity : negateDecimal(quantity);
};

const toSignedAmount = (row: BrokerImportPreviewRow) => {
  if (!row.requiresInstrument) {
    const quantity = parseDecimalString(row.quantity);
    if (!quantity) {
      return null;
    }

    return row.side === "BUY" ? quantity : negateDecimal(quantity);
  }

  return parseDecimalString(row.amount);
};

const isFresh = (fetchedAt: string, ttlMs: number) =>
  Date.now() - new Date(fetchedAt).getTime() <= ttlMs;

const getPreviewInstrumentQuotes = async (
  supabase: SupabaseServerClient,
  holdings: readonly PortfolioHolding[]
) => {
  const results = new Map<string, InstrumentQuote | null>();
  const quoteableHoldings = holdings.filter(
    (holding) => holding.provider === "yahoo" && holding.instrumentType !== "CURRENCY"
  );

  if (quoteableHoldings.length === 0) {
    return results;
  }

  const providerKeys = Array.from(
    new Set(quoteableHoldings.map((holding) => holding.providerKey))
  );

  const { data, error } = await supabase
    .from("instrument_quotes_cache")
    .select("provider_key, currency, price, as_of, fetched_at")
    .eq("provider", "yahoo")
    .in("provider_key", providerKeys);

  if (error) {
    throw new Error(error.message);
  }

  const cachedByProviderKey = new Map(
    (data ?? [])
      .filter(
        (row) =>
          typeof row.provider_key === "string" &&
          typeof row.fetched_at === "string" &&
          isFresh(row.fetched_at, QUOTE_TTL_MS)
      )
      .map((row) => [row.provider_key, row] as const)
  );

  for (const holding of quoteableHoldings) {
    const cached = cachedByProviderKey.get(holding.providerKey);
    if (cached) {
      results.set(holding.instrumentId, {
        instrumentId: holding.instrumentId,
        currency: cached.currency,
        price: cached.price.toString(),
        dayChange: null,
        dayChangePercent: null,
        asOf: cached.as_of,
        fetchedAt: cached.fetched_at,
      });
    }
  }

  const missingProviderKeys = providerKeys.filter(
    (providerKey) => !cachedByProviderKey.has(providerKey)
  );
  if (missingProviderKeys.length === 0) {
    return results;
  }

  try {
    const yahooQuotes = await fetchYahooQuotes(missingProviderKeys, 4000);

    for (const holding of quoteableHoldings) {
      if (results.has(holding.instrumentId)) {
        continue;
      }

      const normalized = normalizeYahooQuote(
        holding.providerKey,
        yahooQuotes[holding.providerKey]
      );

      results.set(
        holding.instrumentId,
        normalized
          ? {
              instrumentId: holding.instrumentId,
              currency: normalized.currency,
              price: normalized.price,
              dayChange: normalized.dayChange,
              dayChangePercent: normalized.dayChangePercent,
              asOf: normalized.asOf,
              fetchedAt: normalized.asOf,
            }
          : null
      );
    }
  } catch {
    for (const holding of quoteableHoldings) {
      if (!results.has(holding.instrumentId)) {
        results.set(holding.instrumentId, null);
      }
    }
  }

  return results;
};

const getFxRatesBestEffort = async (
  supabase: SupabaseServerClient,
  pairs: readonly FxPair[]
) => {
  try {
    return await getFxRatesCached(supabase, pairs);
  } catch {
    const results = new Map<string, FxRate | null>();

    await Promise.all(
      pairs.map(async (pair) => {
        const key = `${pair.from}:${pair.to}`;
        try {
          const fxMap = await getFxRatesCached(supabase, [pair]);
          results.set(key, fxMap.get(key) ?? null);
        } catch {
          results.set(key, null);
        }
      })
    );

    return results;
  }
};

const toPreviewHoldings = (
  holdings: readonly PortfolioHolding[],
  valueByInstrumentId?: ReadonlyMap<
    string,
    Readonly<{
      valueBase: string | null;
      price: string | null;
      missingReason: "MISSING_QUOTE" | "MISSING_FX" | null;
    }>
  >
): BrokerImportPreviewHolding[] =>
  holdings
    .filter((holding) => holding.instrumentType !== "CURRENCY")
    .map((holding) => {
      const valuation = valueByInstrumentId?.get(holding.instrumentId);
      return {
        instrumentId: holding.instrumentId,
        provider: holding.provider,
        providerKey: holding.providerKey,
        symbol: holding.symbol,
        name: holding.name,
        currency: holding.currency,
        exchange: holding.exchange,
        logoUrl: holding.logoUrl,
        instrumentType: holding.instrumentType,
        quantity: holding.quantity,
        valueBase: valuation?.valueBase ?? null,
        price: valuation?.price ?? null,
        missingReason: valuation?.missingReason ?? null,
      };
    })
    .sort((left, right) => {
      const leftValue = parseDecimalString(left.valueBase ?? "")?.toNumber() ?? -1;
      const rightValue = parseDecimalString(right.valueBase ?? "")?.toNumber() ?? -1;

      if (leftValue !== rightValue) {
        return rightValue - leftValue;
      }

      return left.name.localeCompare(right.name, "pl");
    });

export async function buildBrokerImportPreviewValuation(
  supabase: SupabaseServerClient,
  rows: readonly BrokerImportPreviewRow[],
  baseCurrency: string
): Promise<BrokerImportPreviewValuation> {
  const readyRows = rows.filter(
    (row): row is BrokerImportPreviewRow & { status: "READY" } => row.status === "READY"
  );
  const holdingsByInstrument = new Map<string, PortfolioHolding>();
  const quantityByInstrument = new Map<string, ReturnType<typeof decimalZero>>();
  const cashByCurrency = new Map<string, ReturnType<typeof decimalZero>>();

  for (const row of readyRows) {
    const signedAmount = toSignedAmount(row);
    if (signedAmount) {
      const previousCash = cashByCurrency.get(row.accountCurrency) ?? decimalZero();
      cashByCurrency.set(row.accountCurrency, addDecimals(previousCash, signedAmount));
    }

    if (!row.requiresInstrument || !row.instrument) {
      continue;
    }

    const signedQuantity = toSignedQuantity(row);
    if (!signedQuantity) {
      continue;
    }

    const instrumentId = buildInstrumentId({
      provider: row.instrument.provider,
      providerKey: row.instrument.providerKey,
    });

    holdingsByInstrument.set(instrumentId, {
      instrumentId,
      symbol: row.instrument.symbol,
      name: row.instrument.name,
      currency: row.instrument.currency,
      exchange: row.instrument.exchange ?? null,
      provider: row.instrument.provider,
      providerKey: row.instrument.providerKey,
      logoUrl: row.instrument.logoUrl ?? null,
      instrumentType: row.instrument.instrumentType ?? null,
      quantity: "0",
    });

    const previousQuantity = quantityByInstrument.get(instrumentId) ?? decimalZero();
    quantityByInstrument.set(instrumentId, addDecimals(previousQuantity, signedQuantity));
  }

  const holdings: PortfolioHolding[] = [];
  for (const [instrumentId, holding] of holdingsByInstrument.entries()) {
    const quantity = quantityByInstrument.get(instrumentId);
    if (!quantity || quantity.eq(0)) {
      continue;
    }

    holdings.push({
      ...holding,
      quantity: quantity.toString(),
    });
  }

  for (const [currency, amount] of cashByCurrency.entries()) {
    if (amount.eq(0)) {
      continue;
    }

    const instrumentId = buildInstrumentId({
      provider: "system",
      providerKey: currency,
    });

    holdings.push({
      instrumentId,
      symbol: currency,
      name: `Gotówka ${currency}`,
      currency,
      exchange: null,
      provider: "system",
      providerKey: currency,
      logoUrl: null,
      instrumentType: "CURRENCY",
      quantity: amount.toString(),
    });
  }

  const deterministicCashValueBase = cashByCurrency.get(baseCurrency)?.toString() ?? null;
  const deterministicHoldingsCount = holdings.filter(
    (holding) => holding.instrumentType !== "CURRENCY"
  ).length;
  const fallbackHoldings = toPreviewHoldings(holdings);

  try {
    const quotesByInstrument = await getPreviewInstrumentQuotes(supabase, holdings);
    const fxPairs = Array.from(
      new Set(
        holdings
          .filter((holding) => holding.currency !== baseCurrency)
          .map((holding) => `${holding.currency}:${baseCurrency}`)
      )
    ).map((pair) => {
      const [from, to] = pair.split(":");
      return { from, to };
    });
    const fxByPair = await getFxRatesBestEffort(supabase, fxPairs);
    const summary = buildPortfolioSummary({
      baseCurrency,
      holdings,
      quotesByInstrument,
      fxByPair,
    });
    const valuationByInstrumentId = new Map(
      summary.holdings
        .filter((holding) => holding.instrumentType !== "CURRENCY")
        .map((holding) => [
          holding.instrumentId,
          {
            valueBase: holding.valueBase,
            price: holding.price,
            missingReason: holding.missingReason,
          },
        ] as const)
    );

    const cashValueBase = summary.holdings
      .filter((holding) => holding.instrumentType === "CURRENCY" && holding.valueBase)
      .reduce(
        (total, holding) =>
          addDecimals(total, parseDecimalString(holding.valueBase) ?? decimalZero()),
        decimalZero()
      )
      .toString();

    return {
      baseCurrency,
      totalValueBase: summary.totalValueBase,
      cashValueBase,
      holdingsCount: summary.holdings.filter(
        (holding) => holding.instrumentType !== "CURRENCY"
      ).length,
      missingQuotes: summary.missingQuotes,
      missingFx: summary.missingFx,
      asOf: summary.asOf,
      holdings: toPreviewHoldings(holdings, valuationByInstrumentId),
    };
  } catch {
    return {
      baseCurrency,
      totalValueBase: null,
      cashValueBase:
        deterministicCashValueBase ??
        (cashByCurrency.size > 0 ? decimalZero().toString() : null),
      holdingsCount: deterministicHoldingsCount,
      missingQuotes: 0,
      missingFx: 0,
      asOf: null,
      holdings: fallbackHoldings,
    };
  }
}
