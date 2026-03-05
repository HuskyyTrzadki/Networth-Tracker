import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGeminiJson } from "@/lib/ai/gemini-client";
import type { Database } from "@/lib/supabase/database.types";
import type { EconomicCurrencyExposureApiResponse } from "@/features/portfolio/lib/currency-exposure";
import type { CurrencyCode } from "@/features/market-data";
import { customAssetTypeLabels } from "@/features/transactions/lib/custom-asset-types";
import { getPortfolioHoldings } from "../get-portfolio-holdings";
import { getPortfolioSummary } from "../get-portfolio-summary";
import { readCurrencyExposureCache, loadRevenueGeoByProviderKey, saveCurrencyExposureCache } from "./cache";
import { CURRENCY_EXPOSURE_MODEL, CURRENCY_EXPOSURE_PROMPT_VERSION, REVENUE_GEO_PROVIDER } from "./constants";
import { findRevenueGeoCoverageGaps } from "./coverage";
import { buildInstrumentSetFingerprint } from "./fingerprint";
import { modelResponseSchema, normalizeCurrencyCode, normalizeCurrencyExposure, parseCachedBreakdown } from "./normalization";
import { buildEconomicCurrencyExposurePrompt } from "./prompt";
import type { EconomicCurrencyExposurePromptHolding } from "./prompt";
import type { CachedAssetBreakdown, CurrencyExposureScope } from "./types";
import { buildWeightedEconomicCurrencyExposure } from "./weighting";
type SupabaseServerClient = SupabaseClient<Database>;
type PortfolioSummaryResult = Awaited<ReturnType<typeof getPortfolioSummary>>;
type PortfolioHoldingRow = Awaited<ReturnType<typeof getPortfolioHoldings>>[number];
type Input = Readonly<{
  supabase: SupabaseServerClient;
  userId: string;
  portfolioId: string | null;
  traceId?: string;
}>;
const LOG_PREFIX = "[currency-exposure][economic]";
const isVerboseLogEnabled = () => {
  const flag = process.env.CURRENCY_EXPOSURE_VERBOSE_LOGS;
  return flag === "1" || flag === "true";
};
const logInfo = (
  traceId: string,
  event: string,
  payload: Record<string, unknown> = {}
) => {
  console.info(`${LOG_PREFIX} ${event}`, {
    traceId,
    ...payload,
  });
};
const logError = (
  traceId: string,
  event: string,
  payload: Record<string, unknown> = {}
) => {
  console.error(`${LOG_PREFIX} ${event}`, {
    traceId,
    ...payload,
  });
};
const resolveBaseCurrency = async (
  supabase: SupabaseServerClient,
  portfolioId: string | null
): Promise<CurrencyCode> => {
  if (!portfolioId) {
    return "PLN";
  }
  const { data, error } = await supabase
    .from("portfolios")
    .select("base_currency")
    .eq("id", portfolioId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  const baseCurrency = data?.base_currency?.toUpperCase();
  if (baseCurrency && /^[A-Z]{3}$/.test(baseCurrency)) {
    return baseCurrency as CurrencyCode;
  }
  return "PLN";
};
const toAssetBreakdownFromModel = (
  holdings: Awaited<ReturnType<typeof getPortfolioSummary>>["holdings"],
  modelJson: string
): readonly CachedAssetBreakdown[] => {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(modelJson) as unknown;
  } catch {
    throw new Error("Gemini returned invalid JSON for economic exposure.");
  }

  const parsed = modelResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error("Gemini returned invalid economic exposure schema.");
  }

  const byInstrumentId = new Map(parsed.data.assets.map((asset) => [asset.instrumentId, asset]));

  return holdings.map((holding) => {
    const candidate = byInstrumentId.get(holding.instrumentId);
    if (!candidate) {
      return {
        instrumentId: holding.instrumentId,
        currencyExposure: [{ currencyCode: normalizeCurrencyCode(holding.currency), sharePct: 100 }],
        rationale: "fallback_native_currency",
      };
    }

    return {
      instrumentId: holding.instrumentId,
      currencyExposure: normalizeCurrencyExposure(candidate.currencyExposure, holding.currency),
      rationale: candidate.rationale ?? null,
    };
  });
};

const buildPendingEconomicCurrencyExposure = (
  summary: PortfolioSummaryResult,
  scope: CurrencyExposureScope,
  portfolioId: string | null,
  pendingProviderKeys: readonly string[]
): EconomicCurrencyExposureApiResponse => ({
  scope,
  portfolioId,
  asOf: summary.asOf,
  modelMode: "ECONOMIC",
  status: "PENDING_SOURCE_DATA",
  chart: [],
  details: [],
  pendingProviderKeys,
  meta: {
    model: CURRENCY_EXPOSURE_MODEL,
    promptVersion: CURRENCY_EXPOSURE_PROMPT_VERSION,
    fromCache: false,
  },
});

const buildRawHoldingByInstrumentId = (
  rawHoldings: readonly PortfolioHoldingRow[]
) =>
  new Map(rawHoldings.map((holding) => [holding.instrumentId, holding]));

const resolvePendingProviderKeys = (input: Readonly<{
  summary: PortfolioSummaryResult;
  rawHoldingByInstrumentId: ReadonlyMap<string, PortfolioHoldingRow>;
  revenueGeoByProviderKey: ReadonlyMap<string, Record<string, number>>;
}>): readonly string[] => {
  const coveredProviderKeys = new Set(
    Array.from(input.revenueGeoByProviderKey.keys()).map((providerKey) =>
      providerKey.trim().toUpperCase()
    )
  );

  return findRevenueGeoCoverageGaps(
    input.summary.holdings.map((holding) => {
      const rawHolding = input.rawHoldingByInstrumentId.get(holding.instrumentId);
      return {
        instrumentId: holding.instrumentId,
        provider: holding.provider,
        providerKey: rawHolding?.providerKey ?? null,
        instrumentType: holding.instrumentType,
      };
    }),
    coveredProviderKeys
  );
};

const buildEconomicPromptHoldings = (input: Readonly<{
  summary: PortfolioSummaryResult;
  rawHoldingByInstrumentId: ReadonlyMap<string, PortfolioHoldingRow>;
  revenueGeoByProviderKey: ReadonlyMap<string, Record<string, number>>;
}>): readonly EconomicCurrencyExposurePromptHolding[] =>
  input.summary.holdings.map((holding) => {
    const rawHolding = input.rawHoldingByInstrumentId.get(holding.instrumentId);
    const providerKey = rawHolding?.providerKey ?? holding.instrumentId;
    const revenueByCountry =
      holding.provider === REVENUE_GEO_PROVIDER
        ? input.revenueGeoByProviderKey.get(providerKey) ?? {}
        : {};

    return {
      instrumentId: holding.instrumentId,
      symbol: holding.symbol,
      name: holding.name,
      provider: holding.provider,
      providerKey,
      instrumentType: holding.instrumentType,
      customAssetType: holding.customAssetType ?? null,
      customAssetTypeLabel: holding.customAssetType
        ? customAssetTypeLabels[holding.customAssetType]
        : null,
      quoteCurrency: holding.currency,
      revenueByCountry,
    };
  });

const buildHoldingsLogPayload = (
  holdingsPayload: readonly EconomicCurrencyExposurePromptHolding[]
) =>
  holdingsPayload.map((holding) => ({
    instrumentId: holding.instrumentId,
    symbol: holding.symbol,
    provider: holding.provider,
    providerKey: holding.providerKey,
    instrumentType: holding.instrumentType,
    customAssetType: holding.customAssetType,
    quoteCurrency: holding.quoteCurrency,
    revenueCountriesCount: Object.keys(holding.revenueByCountry).length,
  }));

const requestEconomicExposureModel = async (input: Readonly<{
  prompt: ReturnType<typeof buildEconomicCurrencyExposurePrompt>;
  traceId: string;
  verboseLogs: boolean;
  holdingsLogPayload: readonly ReturnType<typeof buildHoldingsLogPayload>[number][];
}>): Promise<string> => {
  const modelCallStartedAt = Date.now();

  logInfo(input.traceId, "llm_request", {
    model: CURRENCY_EXPOSURE_MODEL,
    promptVersion: CURRENCY_EXPOSURE_PROMPT_VERSION,
    holdingsCount: input.holdingsLogPayload.length,
    holdingsWithRevenueGeoCount: input.holdingsLogPayload.filter(
      (holding) => holding.revenueCountriesCount > 0
    ).length,
    ...(input.verboseLogs
      ? {
          holdings: input.holdingsLogPayload,
          systemInstruction: input.prompt.systemInstruction,
          userPrompt: input.prompt.userPrompt,
        }
      : {}),
  });

  let modelRaw: string;
  try {
    modelRaw = await generateGeminiJson(input.prompt);
  } catch (error) {
    logError(input.traceId, "llm_request_failed", {
      model: CURRENCY_EXPOSURE_MODEL,
      durationMs: Date.now() - modelCallStartedAt,
      message: error instanceof Error ? error.message : "Unknown Gemini error",
    });
    throw error;
  }

  logInfo(input.traceId, "llm_response", {
    model: CURRENCY_EXPOSURE_MODEL,
    durationMs: Date.now() - modelCallStartedAt,
    responseLength: modelRaw.length,
    ...(input.verboseLogs
      ? {
          response: modelRaw,
        }
      : {}),
  });

  return modelRaw;
};

export async function getEconomicCurrencyExposure(
  input: Input
): Promise<EconomicCurrencyExposureApiResponse> {
  const traceId = input.traceId ?? crypto.randomUUID();
  const scope: CurrencyExposureScope = input.portfolioId ? "PORTFOLIO" : "ALL";
  const startedAt = Date.now();
  const baseCurrency = await resolveBaseCurrency(input.supabase, input.portfolioId);
  const summary = await getPortfolioSummary(input.supabase, {
    portfolioId: input.portfolioId,
    baseCurrency,
  });

  logInfo(traceId, "request_started", {
    scope,
    portfolioId: input.portfolioId,
    baseCurrency,
    holdingsCount: summary.holdings.length,
    asOf: summary.asOf,
  });

  if (summary.holdings.length === 0) {
    logInfo(traceId, "empty_holdings_short_circuit", {
      durationMs: Date.now() - startedAt,
    });
    return buildWeightedEconomicCurrencyExposure(summary, [], scope, input.portfolioId, false);
  }

  const rawHoldings = await getPortfolioHoldings(input.supabase, input.portfolioId);
  const rawHoldingByInstrumentId = buildRawHoldingByInstrumentId(rawHoldings);

  const holdingsFingerprint = buildInstrumentSetFingerprint({
    summary,
    scope,
    portfolioId: input.portfolioId,
    promptVersion: CURRENCY_EXPOSURE_PROMPT_VERSION,
    model: CURRENCY_EXPOSURE_MODEL,
  });

  const cache = await readCurrencyExposureCache(input.supabase, {
    userId: input.userId,
    scope,
    portfolioId: input.portfolioId,
    holdingsFingerprint,
  });

  const cachedAssetBreakdown = cache ? parseCachedBreakdown(cache.result_json) : null;
  if (cachedAssetBreakdown) {
    logInfo(traceId, "cache_hit", {
      holdingsFingerprint: holdingsFingerprint.slice(0, 12),
      cachedAssets: cachedAssetBreakdown.length,
      durationMs: Date.now() - startedAt,
    });
    return buildWeightedEconomicCurrencyExposure(
      summary,
      cachedAssetBreakdown,
      scope,
      input.portfolioId,
      true
    );
  }

  logInfo(traceId, "cache_miss", {
    holdingsFingerprint: holdingsFingerprint.slice(0, 12),
  });

  const revenueGeoByProviderKey = await loadRevenueGeoByProviderKey(
    input.supabase,
    summary.holdings
      .map((holding) => rawHoldingByInstrumentId.get(holding.instrumentId))
      .filter((holding) => holding?.provider === REVENUE_GEO_PROVIDER)
      .map((holding) => holding?.providerKey ?? "")
      .filter((providerKey) => providerKey.length > 0)
  );
  const pendingProviderKeys = resolvePendingProviderKeys({
    summary,
    rawHoldingByInstrumentId,
    revenueGeoByProviderKey,
  });

  if (pendingProviderKeys.length > 0) {
    logInfo(traceId, "pending_source_data", {
      pendingProviderKeys,
      durationMs: Date.now() - startedAt,
    });

    return buildPendingEconomicCurrencyExposure(
      summary,
      scope,
      input.portfolioId,
      pendingProviderKeys
    );
  }

  const holdingsPayload = buildEconomicPromptHoldings({
    summary,
    rawHoldingByInstrumentId,
    revenueGeoByProviderKey,
  });
  const prompt = buildEconomicCurrencyExposurePrompt(holdingsPayload);
  const verboseLogs = isVerboseLogEnabled();
  const holdingsLogPayload = buildHoldingsLogPayload(holdingsPayload);
  const modelRaw = await requestEconomicExposureModel({
    prompt,
    traceId,
    verboseLogs,
    holdingsLogPayload,
  });

  const assetBreakdown = toAssetBreakdownFromModel(summary.holdings, modelRaw);

  logInfo(traceId, "llm_response_normalized", {
    assetsCount: assetBreakdown.length,
    ...(verboseLogs
      ? {
          assets: assetBreakdown.map((asset) => ({
            instrumentId: asset.instrumentId,
            exposure: asset.currencyExposure,
            rationale: asset.rationale,
          })),
        }
      : {}),
  });

  await saveCurrencyExposureCache(input.supabase, {
    existingId: cache?.id ?? null,
    userId: input.userId,
    scope,
    portfolioId: input.portfolioId,
    holdingsFingerprint,
    asOf: summary.asOf,
    assetBreakdown,
  });

  logInfo(traceId, "cache_saved", {
    assets: assetBreakdown.length,
    durationMs: Date.now() - startedAt,
  });

  return buildWeightedEconomicCurrencyExposure(summary, assetBreakdown, scope, input.portfolioId, false);
}

export const __test__ = {
  resolveBaseCurrency,
  toAssetBreakdownFromModel,
};
