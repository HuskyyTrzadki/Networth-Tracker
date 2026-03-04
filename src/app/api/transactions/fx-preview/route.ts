import { NextResponse } from "next/server";
import { z } from "zod";

import { getFxRatesCached } from "@/features/market-data";
import { apiError, apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";

const requestSchema = z.object({
  fromCurrency: z.string().trim().length(3),
  toCurrency: z.string().trim().length(3),
});

export async function POST(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = requestSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const fromCurrency = parsed.data.fromCurrency.toUpperCase();
  const toCurrency = parsed.data.toCurrency.toUpperCase();

  if (fromCurrency === toCurrency) {
    return NextResponse.json(
      {
        fromCurrency,
        toCurrency,
        rate: "1",
        asOf: new Date().toISOString(),
        provider: "internal",
      },
      { status: 200 }
    );
  }

  try {
    // Cache-first FX lookup; source is the same as transaction settlement logic.
    const fxByPair = await getFxRatesCached(authResult.supabase, [
      { from: fromCurrency, to: toCurrency },
    ]);
    const fx = fxByPair.get(`${fromCurrency}:${toCurrency}`) ?? null;

    if (!fx) {
      return apiError({
        status: 404,
        code: "FX_RATE_NOT_FOUND",
        message: "Brak kursu FX dla wybranej pary walut.",
        request,
      });
    }

    return NextResponse.json(
      {
        fromCurrency,
        toCurrency,
        rate: fx.rate,
        asOf: fx.asOf,
        provider: "yahoo",
      },
      { status: 200 }
    );
  } catch (routeError) {
    return apiFromUnknownError({
      error: routeError,
      request,
      fallbackCode: "FX_PREVIEW_FAILED",
      fallbackMessage: "Nie udało się pobrać kursu FX.",
    });
  }
}
