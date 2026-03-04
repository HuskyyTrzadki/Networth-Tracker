import { NextResponse } from "next/server";
import { z } from "zod";

import {
  bookDividendPayout,
  DividendAlreadyBookedError,
} from "@/features/portfolio/server/dividends/book-dividend";
import {
  apiError,
  apiFromUnknownError,
  apiValidationError,
} from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTransactionViews } from "@/features/transactions/server/revalidate-transaction-views";

const bookDividendSchema = z.object({
  portfolioId: z.string().uuid(),
  providerKey: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  eventDate: z.string().trim().min(1),
  payoutCurrency: z.string().trim().length(3),
  netAmount: z.string().trim().min(1),
  dividendEventKey: z.string().trim().min(1),
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

  const parsed = bookDividendSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  try {
    const result = await bookDividendPayout({
      supabaseUser: authResult.supabase,
      supabaseAdmin: createAdminClient(),
      userId: authResult.user.id,
      portfolioId: parsed.data.portfolioId,
      providerKey: parsed.data.providerKey,
      symbol: parsed.data.symbol,
      eventDate: parsed.data.eventDate,
      payoutCurrency: parsed.data.payoutCurrency,
      netAmount: parsed.data.netAmount,
      dividendEventKey: parsed.data.dividendEventKey,
    });

    revalidateTransactionViews(parsed.data.portfolioId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof DividendAlreadyBookedError) {
      return apiError({
        status: 409,
        code: "DIVIDEND_ALREADY_BOOKED",
        message: error.message,
        request,
      });
    }
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "DIVIDEND_BOOK_FAILED",
    });
  }
}
