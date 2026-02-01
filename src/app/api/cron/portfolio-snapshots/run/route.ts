import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runPortfolioSnapshotsCron } from "@/features/portfolio/server/snapshots/run-portfolio-snapshots-cron";

const DEFAULT_LIMIT = 100;
const DEFAULT_TIME_BUDGET_MS = 20_000;
const RETENTION_DAYS = 730;

const getBearerToken = (value: string | null) =>
  value?.startsWith("Bearer ") ? value.slice(7) : null;

export async function POST(request: Request) {
  // Cron endpoint: secured by a shared secret and executed with service role.
  const token = getBearerToken(request.headers.get("authorization"));
  const expected = process.env.CRON_SECRET;

  if (!expected || !token || token !== expected) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

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
}
