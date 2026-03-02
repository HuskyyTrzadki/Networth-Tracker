import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runTradingViewRevenueGeoBackfillCron } from "@/features/market-data/server/tradingview-revenue-geo/run-backfill-cron";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 25;
const DEFAULT_STALE_DAYS = 90;
const DEFAULT_DELAY_MS = 2_000;
const DEFAULT_TIME_BUDGET_MS = 45_000;

const getBearerToken = (value: string | null) =>
  value?.startsWith("Bearer ") ? value.slice(7) : null;

const hasVercelCronHeader = (request: Request) =>
  request.headers.get("x-vercel-cron") === "1";

const isAuthorized = (request: Request) => {
  const expected = process.env.CRON_SECRET;
  const token = getBearerToken(request.headers.get("authorization"));

  if (hasVercelCronHeader(request)) {
    return true;
  }

  return Boolean(expected && token && token === expected);
};

const parseFiniteNumber = (value: string | null, fallback: number) => {
  const parsed = value ? Number(value) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const runCron = async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const supabase = createAdminClient();
  const result = await runTradingViewRevenueGeoBackfillCron({
    supabase,
    limit: parseFiniteNumber(url.searchParams.get("limit"), DEFAULT_LIMIT),
    staleDays: parseFiniteNumber(
      url.searchParams.get("staleDays"),
      DEFAULT_STALE_DAYS
    ),
    delayMs: parseFiniteNumber(url.searchParams.get("delayMs"), DEFAULT_DELAY_MS),
    timeBudgetMs: parseFiniteNumber(
      url.searchParams.get("timeBudgetMs"),
      DEFAULT_TIME_BUDGET_MS
    ),
    provider: url.searchParams.get("provider") ?? "yahoo",
  });

  return NextResponse.json(result, { status: 200 });
};

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST(request: Request) {
  return runCron(request);
}
