import { NextResponse } from "next/server";
import { z } from "zod";

import { getEconomicCurrencyExposure } from "@/features/portfolio/server/currency-exposure/get-economic-currency-exposure";
import { getAuthenticatedSupabase, parseJsonBody, toErrorMessage } from "@/lib/http/route-handler";

const requestSchema = z.object({
  portfolioId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const traceId = crypto.randomUUID();
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
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      {
        status: 400,
        headers: {
          "X-Currency-Exposure-Trace-Id": traceId,
        },
      }
    );
  }

  try {
    const response = await getEconomicCurrencyExposure({
      supabase: authResult.supabase,
      userId: authResult.user.id,
      portfolioId: parsed.data.portfolioId ?? null,
      traceId,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Currency-Exposure-Trace-Id": traceId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: toErrorMessage(error) },
      {
        status: 400,
        headers: {
          "X-Currency-Exposure-Trace-Id": traceId,
        },
      }
    );
  }
}
