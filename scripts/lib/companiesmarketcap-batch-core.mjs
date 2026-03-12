import fs from "node:fs/promises";
import { createRequire } from "node:module";

import { createClient } from "@supabase/supabase-js";

import {
  resolveCompaniesMarketCapSlug,
  scrapeCompaniesMarketCapMetrics,
} from "./companiesmarketcap-scrape.mjs";

const DEFAULT_PROVIDER = "yahoo";
const DEFAULT_EXCHANGES = ["NASDAQ", "NYSE", "WSE"];
const DEFAULT_DELAY_MS = 0;
const DEFAULT_SOURCE = "companiesmarketcap_html";

let envLoaded = false;
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const ensureEnvLoaded = () => {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  envLoaded = true;
};

const parseArgs = (argv) => {
  const args = {
    provider: DEFAULT_PROVIDER,
    exchanges: [...DEFAULT_EXCHANGES],
    allExchanges: false,
    instrumentType: null,
    limit: null,
    dryRun: false,
    delayMs: DEFAULT_DELAY_MS,
    providerKeys: [],
    reportPath: "/tmp/companiesmarketcap-report.json",
  };

  argv.forEach((rawArg) => {
    if (rawArg === "--dry-run") {
      args.dryRun = true;
      return;
    }

    if (rawArg.startsWith("--delay-ms=")) {
      const parsed = Number(rawArg.slice("--delay-ms=".length));
      if (Number.isFinite(parsed) && parsed >= 0) args.delayMs = Math.floor(parsed);
      return;
    }

    if (rawArg.startsWith("--provider=")) {
      args.provider = rawArg.slice("--provider=".length).trim() || DEFAULT_PROVIDER;
      return;
    }

    if (rawArg.startsWith("--exchanges=")) {
      const parsed = rawArg
        .slice("--exchanges=".length)
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      if (parsed.length > 0) args.exchanges = parsed;
      return;
    }

    if (rawArg === "--all-exchanges") {
      args.allExchanges = true;
      return;
    }

    if (rawArg.startsWith("--instrument-type=")) {
      const instrumentType = rawArg.slice("--instrument-type=".length).trim().toUpperCase();
      if (instrumentType) args.instrumentType = instrumentType;
      return;
    }

    if (rawArg.startsWith("--limit=")) {
      const parsed = Number(rawArg.slice("--limit=".length));
      if (Number.isFinite(parsed) && parsed > 0) args.limit = Math.floor(parsed);
      return;
    }

    if (rawArg.startsWith("--provider-keys=")) {
      args.providerKeys = rawArg
        .slice("--provider-keys=".length)
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      return;
    }

    if (rawArg.startsWith("--report=")) {
      const reportPath = rawArg.slice("--report=".length).trim();
      if (reportPath) args.reportPath = reportPath;
    }
  });

  return args;
};

const createSupabaseAdminClient = () => {
  ensureEnvLoaded();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing env vars: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
};

const readInstruments = async ({
  supabase,
  provider,
  exchanges,
  allExchanges,
  instrumentType,
  providerKeys,
  limit,
}) => {
  let query = supabase
    .from("instruments")
    .select("exchange,provider_key,symbol,name,instrument_type,updated_at")
    .eq("provider", provider)
    .order("updated_at", { ascending: false });

  if (!allExchanges) query = query.in("exchange", exchanges);
  if (instrumentType) query = query.eq("instrument_type", instrumentType);
  if (providerKeys.length > 0) query = query.in("provider_key", providerKeys);
  if (typeof limit === "number") query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to read instruments: ${error.message}`);
  return data ?? [];
};

const writeReport = async (path, report) => {
  await fs.writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
};

const sleep = async (delayMs) => {
  if (!Number.isFinite(delayMs) || delayMs <= 0) return;
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
};

const readCachedSlug = async ({ supabase, provider, providerKey }) => {
  const { data, error } = await supabase
    .from("instrument_companiesmarketcap_slug_cache")
    .select("slug,source_url,resolved_from,metadata,fetched_at")
    .eq("provider", provider)
    .eq("provider_key", providerKey)
    .eq("source", DEFAULT_SOURCE)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read CompaniesMarketCap slug cache: ${error.message}`);
  }

  return data ?? null;
};

const upsertSlugCache = async ({ supabase, provider, instrument, resolvedSlug }) => {
  const { error } = await supabase
    .from("instrument_companiesmarketcap_slug_cache")
    .upsert(
      {
        provider,
        provider_key: instrument.provider_key,
        source: DEFAULT_SOURCE,
        slug: resolvedSlug.slug,
        resolved_from: resolvedSlug.resolvedFrom,
        source_url: resolvedSlug.sourceUrl,
        metadata: {
          symbol: instrument.symbol,
          name: instrument.name,
        },
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_key,source" }
    );

  if (error) {
    throw new Error(`DB_UPSERT_SLUG_FAILED: ${error.message}`);
  }
};

const upsertMetrics = async ({ supabase, metrics }) => {
  const { error } = await supabase
    .from("instrument_companiesmarketcap_metric_cache")
    .upsert(metrics, {
      onConflict: "provider,provider_key,source,metric",
    });

  if (error) {
    throw new Error(`DB_UPSERT_METRICS_FAILED: ${error.message}`);
  }
};

export const processCompaniesMarketCapInstruments = async ({
  supabase,
  instruments,
  provider,
  dryRun = false,
  delayMs = DEFAULT_DELAY_MS,
}) => {
  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    dryRun,
    provider,
    instrumentsRequested: instruments.length,
    successes: 0,
    failures: 0,
    skipped: 0,
    items: [],
  };

  let processed = 0;

  for (const instrument of instruments) {
    try {
      const cachedSlug = await readCachedSlug({
        supabase,
        provider,
        providerKey: instrument.provider_key,
      });

      let slug = cachedSlug?.slug ?? null;
      let preloadedRevenuePage = null;

      if (!slug) {
        const resolvedSlug = await resolveCompaniesMarketCapSlug({ instrument });

        if (!resolvedSlug) {
          processed += 1;
          report.skipped += 1;
          report.items.push({
            providerKey: instrument.provider_key,
            exchange: instrument.exchange,
            symbol: instrument.symbol,
            name: instrument.name,
            status: "SKIPPED",
            message: "SLUG_NOT_RESOLVED",
            sourceUrl: null,
            metricsCount: 0,
          });
          continue;
        }

        slug = resolvedSlug.slug;
        preloadedRevenuePage = resolvedSlug.revenuePage;

        if (!dryRun) {
          await upsertSlugCache({
            supabase,
            provider,
            instrument,
            resolvedSlug,
          });
        }
      }

      const metrics = await scrapeCompaniesMarketCapMetrics({
        instrument,
        slug,
        preloadedRevenuePage,
      });

      if (!dryRun) {
        await upsertMetrics({
          supabase,
          metrics: metrics.map((metric) => ({
            ...metric,
            provider,
          })),
        });
      }

      processed += 1;
      report.successes += 1;
      report.items.push({
        providerKey: instrument.provider_key,
        exchange: instrument.exchange,
        symbol: instrument.symbol,
        name: instrument.name,
        status: "SUCCESS",
        message: "OK",
        sourceUrl: `https://companiesmarketcap.com/${slug}/revenue/`,
        metricsCount: metrics.length,
      });

      console.log(
        `[cmc] ${instrument.provider_key} SUCCESS (${metrics.length} metrics) ${slug}`
      );
    } catch (error) {
      processed += 1;
      report.failures += 1;
      report.items.push({
        providerKey: instrument.provider_key,
        exchange: instrument.exchange,
        symbol: instrument.symbol,
        name: instrument.name,
        status: "FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        sourceUrl: null,
        metricsCount: 0,
      });

      console.error(
        `[cmc] ${instrument.provider_key} FAILED:`,
        error instanceof Error ? error.message : error
      );
    }

    await sleep(delayMs);
  }

  report.finishedAt = new Date().toISOString();

  return {
    processed,
    successes: report.successes,
    failures: report.failures,
    skipped: report.skipped,
    done: processed >= instruments.length,
    items: report.items,
    report,
  };
};

export const runCompaniesMarketCapBatch = async (argv) => {
  const args = parseArgs(argv);
  const supabase = createSupabaseAdminClient();
  const instruments = await readInstruments({
    supabase,
    provider: args.provider,
    exchanges: args.exchanges,
    allExchanges: args.allExchanges,
    instrumentType: args.instrumentType,
    providerKeys: args.providerKeys,
    limit: args.limit,
  });

  const { report } = await processCompaniesMarketCapInstruments({
    supabase,
    instruments,
    provider: args.provider,
    dryRun: args.dryRun,
    delayMs: args.delayMs,
  });

  await writeReport(args.reportPath, report);

  console.log(`[cmc] report saved to ${args.reportPath}`);
  console.log(
    `[cmc] done success=${report.successes} failed=${report.failures} skipped=${report.skipped}`
  );
};
