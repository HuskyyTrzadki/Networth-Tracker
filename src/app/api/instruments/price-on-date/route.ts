import { NextResponse } from "next/server";

import { getInstrumentPriceOnDate } from "@/features/transactions/server/get-instrument-price-on-date";
import { isValidTradeDate } from "@/features/transactions/lib/trade-date";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";

const parseProvider = (value: string | null) => {
  if (!value || value === "yahoo") {
    return "yahoo" as const;
  }

  return null;
};

export async function GET(request: Request) {
  // Route handler: validate params, resolve historical price hint, return JSON.
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const provider = parseProvider(url.searchParams.get("provider"));
  const providerKey = url.searchParams.get("providerKey")?.trim() ?? "";
  const date = url.searchParams.get("date")?.trim() ?? "";

  if (!provider || !providerKey || !date) {
    return apiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Brak wymaganych parametrów: providerKey, date.",
      request,
    });
  }

  if (!isValidTradeDate(date)) {
    return apiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Nieprawidłowa data.",
      request,
    });
  }

  try {
    const result = await getInstrumentPriceOnDate(authResult.supabase, {
      provider,
      providerKey,
      date,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "INSTRUMENT_PRICE_ON_DATE_FAILED",
    });
  }
}
