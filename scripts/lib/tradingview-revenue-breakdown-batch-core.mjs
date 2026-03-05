import fs from "node:fs/promises";
import { createRequire } from "node:module";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

import { scrapeInstrumentRevenueBreakdown } from "./tradingview-revenue-breakdown-scrape.mjs";

const DEFAULT_PROVIDER = "yahoo";
const DEFAULT_EXCHANGES = ["NASDAQ", "NYSE", "WSE"];
const DEFAULT_DELAY_MS = 0;
const DEFAULT_TIME_BUDGET_MS = null;
const BREAKDOWN_CONFIG = {
  geo: {
    tableName: "instrument_revenue_geo_breakdown_cache",
    logPrefix: "tv-geo",
    defaultReportPath: "/tmp/tradingview-revenue-geo-report.json",
  },
  source: {
    tableName: "instrument_revenue_source_breakdown_cache",
    logPrefix: "tv-source",
    defaultReportPath: "/tmp/tradingview-revenue-source-report.json",
  },
};

let envLoaded = false;
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const ensureEnvLoaded = () => {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  envLoaded = true;
};

const getBreakdownConfig = (kind) => {
  const config = BREAKDOWN_CONFIG[kind];
  if (!config) {
    throw new Error(`UNSUPPORTED_BREAKDOWN_KIND: ${String(kind)}`);
  }
  return config;
};

const parseArgs = (argv) => {
  const args = {
    kind: "geo",
    provider: DEFAULT_PROVIDER,
    exchanges: [...DEFAULT_EXCHANGES],
    allExchanges: false,
    instrumentType: null,
    limit: null,
    dryRun: false,
    delayMs: DEFAULT_DELAY_MS,
    timeBudgetMs: DEFAULT_TIME_BUDGET_MS,
    providerKeys: [],
    reportPath: null,
    localeSubdomain: "www",
  };

  argv.forEach((rawArg) => {
    if (rawArg === "--dry-run") {
      args.dryRun = true;
      return;
    }

    if (rawArg.startsWith("--kind=")) {
      args.kind = rawArg.slice("--kind=".length).trim() || "geo";
      return;
    }

    if (rawArg.startsWith("--delay-ms=")) {
      const parsed = Number(rawArg.slice("--delay-ms=".length));
      if (Number.isFinite(parsed) && parsed >= 0) args.delayMs = Math.floor(parsed);
      return;
    }

    if (rawArg.startsWith("--time-budget-ms=")) {
      const parsed = Number(rawArg.slice("--time-budget-ms=".length));
      if (Number.isFinite(parsed) && parsed > 0) args.timeBudgetMs = Math.floor(parsed);
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
      return;
    }

    if (rawArg.startsWith("--locale=")) {
      const localeSubdomain = rawArg.slice("--locale=".length).trim();
      if (localeSubdomain) args.localeSubdomain = localeSubdomain;
    }
  });

  return args;
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

const sleep = async (delayMs) => {
  if (!Number.isFinite(delayMs) || delayMs <= 0) return;
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
};

export const processTradingViewRevenueBreakdownInstruments = async ({
  supabase,
  instruments,
  provider,
  localeSubdomain = "www",
  dryRun = false,
  delayMs = DEFAULT_DELAY_MS,
  timeBudgetMs = DEFAULT_TIME_BUDGET_MS,
  kind = "geo",
}) => {
  const config = getBreakdownConfig(kind);
  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    dryRun,
    kind,
    provider,
    allExchanges: false,
    exchanges: [],
    instrumentType: null,
    instrumentsRequested: instruments.length,
    successes: 0,
    failures: 0,
    skipped: 0,
    items: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const startedAtMs = Date.now();
  let processed = 0;

  try {
    for (const instrument of instruments) {
      if (
        Number.isFinite(timeBudgetMs) &&
        timeBudgetMs > 0 &&
        Date.now() - startedAtMs >= timeBudgetMs
      ) {
        break;
      }

      const page = await context.newPage();

      try {
        const result = await scrapeInstrumentRevenueBreakdown({
          page,
          instrument,
          provider,
          localeSubdomain,
          kind,
        });

        if (result.status === "SUCCESS" && !dryRun && result.payload) {
          const { error } = await supabase
            .from(config.tableName)
            .upsert(result.payload, { onConflict: "provider,provider_key,source" });

          if (error) {
            throw new Error(`DB_UPSERT_FAILED: ${error.message}`);
          }
        }

        processed += 1;

        if (result.status === "SUCCESS") report.successes += 1;
        else if (result.status === "SKIPPED") report.skipped += 1;
        else report.failures += 1;

        report.items.push({
          providerKey: instrument.provider_key,
          exchange: instrument.exchange,
          symbol: instrument.symbol,
          name: instrument.name,
          status: result.status,
          message: result.message,
          rowsCount: result.rowsCount,
          sourceUrl: result.sourceUrl ?? null,
        });

        console.log(
          `[${config.logPrefix}] ${instrument.provider_key} ${result.status} (${result.rowsCount} rows) ${result.message}`
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
          rowsCount: 0,
          sourceUrl: null,
        });

        console.error(
          `[${config.logPrefix}] ${instrument.provider_key} FAILED:`,
          error instanceof Error ? error.message : error
        );
      } finally {
        await page.close();
      }

      await sleep(delayMs);
    }
  } finally {
    await context.close();
    await browser.close();
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

export const runTradingViewRevenueBreakdownBatch = async (argv) => {
  const args = parseArgs(argv);
  const config = getBreakdownConfig(args.kind);
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

  const { report } = await processTradingViewRevenueBreakdownInstruments({
    supabase,
    instruments,
    provider: args.provider,
    localeSubdomain: args.localeSubdomain,
    dryRun: args.dryRun,
    delayMs: args.delayMs,
    timeBudgetMs: args.timeBudgetMs,
    kind: args.kind,
  });

  report.allExchanges = args.allExchanges;
  report.exchanges = args.exchanges;
  report.instrumentType = args.instrumentType;

  const reportPath = args.reportPath ?? config.defaultReportPath;
  await writeReport(reportPath, report);

  console.log(`[${config.logPrefix}] report saved to ${reportPath}`);
  console.log(
    `[${config.logPrefix}] done success=${report.successes} failed=${report.failures} skipped=${report.skipped}`
  );
};
