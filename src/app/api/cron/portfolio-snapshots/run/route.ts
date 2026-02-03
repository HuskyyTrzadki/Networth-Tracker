import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runPortfolioSnapshotsCron } from "@/features/portfolio/server/snapshots/run-portfolio-snapshots-cron";

const DEFAULT_LIMIT = 100;
const DEFAULT_TIME_BUDGET_MS = 20_000;
const RETENTION_DAYS = 730;

const getBearerToken = (value: string | null) =>
  value?.startsWith("Bearer ") ? value.slice(7) : null;

const hasVercelCronHeader = (request: Request) =>
  request.headers.get("x-vercel-cron") === "1";

const getAuthToken = (request: Request) =>
  getBearerToken(request.headers.get("authorization"));

const isAuthorized = (request: Request) => {
  const expected = process.env.CRON_SECRET;
  const token = getAuthToken(request);

  // Vercel Cron requests send `x-vercel-cron: 1`. We accept those
  // to allow scheduled runs, while still supporting Bearer auth for manual runs.
  if (hasVercelCronHeader(request)) {
    return true;
  }

  return Boolean(expected && token && token === expected);
};

const runCron = async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  // Cron endpoint: executed with service role. It is safe to run only for
  // Vercel Cron requests or manual runs with a Bearer token.
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const timeParam = url.searchParams.get("timeBudgetMs");

  const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
  const timeBudgetMs = timeParam ? Number(timeParam) : DEFAULT_TIME_BUDGET_MS;

  const supabase = createAdminClient();
  const result = await runPortfolioSnapshotsCron(supabase, {
    limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
    timeBudgetMs: Number.isFinite(timeBudgetMs)
      ? timeBudgetMs
      : DEFAULT_TIME_BUDGET_MS,
    retentionDays: RETENTION_DAYS,
  });

  return NextResponse.json(
    {
      processedUsers: result.processedUsers,
      processedPortfolios: result.processedPortfolios,
      done: result.done,
    },
    { status: 200 }
  );
};

export async function POST(request: Request) {
  return runCron(request);
}

export async function GET(request: Request) {
  return runCron(request);
}
