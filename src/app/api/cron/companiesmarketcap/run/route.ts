import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  countCompaniesMarketCapBackfillCandidates,
  listCompaniesMarketCapBackfillCandidates,
} from "@/features/market-data/server/companiesmarketcap/list-backfill-candidates";
import { runCompaniesMarketCapCron } from "@/features/market-data/server/companiesmarketcap/run-backfill-cron";
import { apiMethodNotAllowed, apiUnauthorized } from "@/lib/http/api-error";

const DEFAULT_LIMIT = 25;
const DEFAULT_STALE_DAYS = 7;
const DEFAULT_DELAY_MS = 1_200;

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

const parseProviderKeys = (value: string | null) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

const runCron = async (request: Request) => {
  if (!isAuthorized(request)) {
    return apiUnauthorized({ request, message: "Unauthorized." });
  }

  const url = new URL(request.url);
  const requestedProviderKeys = parseProviderKeys(url.searchParams.get("providerKeys"));
  const supabase = createAdminClient();
  const result = await runCompaniesMarketCapCron({
    supabase,
    limit: parseFiniteNumber(url.searchParams.get("limit"), DEFAULT_LIMIT),
    staleDays: parseFiniteNumber(
      url.searchParams.get("staleDays"),
      DEFAULT_STALE_DAYS
    ),
    delayMs: parseFiniteNumber(url.searchParams.get("delayMs"), DEFAULT_DELAY_MS),
    provider: url.searchParams.get("provider") ?? "yahoo",
    listCandidates: listCompaniesMarketCapBackfillCandidates,
    countCandidates: countCompaniesMarketCapBackfillCandidates,
  });

  const providerKeysToRevalidate = Array.from(
    new Set([...(result.processedProviderKeys ?? []), ...requestedProviderKeys])
  );

  providerKeysToRevalidate.forEach((providerKey) => {
    revalidateTag(`stock:${providerKey}`, "max");
    revalidateTag(`stock:${providerKey}:fundamentals`, "max");
    revalidateTag(`stock:${providerKey}:summary`, "max");
    revalidateTag(`stock:${providerKey}:insights:revenue`, "max");
    revalidateTag(`stock:${providerKey}:insights:annual-fallback`, "max");
    revalidateTag(`stock:${providerKey}:chart:5y:valuation`, "max");
  });

  return NextResponse.json(result, { status: 200 });
};

export async function GET(request: Request) {
  return apiMethodNotAllowed("POST", { request });
}

export async function POST(request: Request) {
  return runCron(request);
}
