import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { runTradingViewRevenueBreakdownCron } from "../tradingview-revenue-breakdown/run-backfill-cron";

import {
  countTradingViewRevenueGeoBackfillCandidates,
  listTradingViewRevenueGeoBackfillCandidates,
} from "./list-backfill-candidates";

type SupabaseAdminClient = SupabaseClient<Database>;

type Input = Readonly<{
  supabase: SupabaseAdminClient;
  limit: number;
  staleDays: number;
  delayMs: number;
  timeBudgetMs: number;
  provider?: string;
  localeSubdomain?: string;
}>;

const DEFAULT_PROVIDER = "yahoo";

export async function runTradingViewRevenueGeoCron({
  supabase,
  limit,
  staleDays,
  delayMs,
  timeBudgetMs,
  provider = DEFAULT_PROVIDER,
  localeSubdomain = "www",
}: Input) {
  return runTradingViewRevenueBreakdownCron({
    supabase,
    kind: "geo",
    limit,
    staleDays,
    delayMs,
    timeBudgetMs,
    provider,
    localeSubdomain,
    listCandidates: listTradingViewRevenueGeoBackfillCandidates,
    countCandidates: countTradingViewRevenueGeoBackfillCandidates,
  });
}
