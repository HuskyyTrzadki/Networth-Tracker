import { NextResponse } from "next/server";
import { z } from "zod";

import { getDividendInbox } from "@/features/portfolio/server/dividends/get-dividend-inbox";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
} from "@/lib/http/route-handler";

const toPositiveIntOrDefault = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export async function GET(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const portfolioId = url.searchParams.get("portfolioId");
  if (portfolioId) {
    const parsedPortfolioId = z.string().uuid().safeParse(portfolioId);
    if (!parsedPortfolioId.success) {
      return apiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid portfolioId.",
        request,
      });
    }
  }
  const windowPastDays = toPositiveIntOrDefault(
    url.searchParams.get("windowPastDays"),
    60
  );
  const windowFutureDays = toPositiveIntOrDefault(
    url.searchParams.get("windowFutureDays"),
    60
  );

  try {
    const result = await getDividendInbox({
      supabase: authResult.supabase,
      userId: authResult.user.id,
      portfolioId,
      pastDays: windowPastDays,
      futureDays: windowFutureDays,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "DIVIDEND_INBOX_FAILED",
    });
  }
}
