import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import {
  bookDividendPayout,
  DividendAlreadyBookedError,
} from "@/features/portfolio/server/dividends/book-dividend";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
} from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

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
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
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

    revalidatePath("/portfolio");
    revalidatePath(`/portfolio/${parsed.data.portfolioId}`);
    revalidatePath("/transactions");
    revalidateTag("portfolio:all", "max");
    revalidateTag(`portfolio:${parsed.data.portfolioId}`, "max");
    revalidateTag("transactions:all", "max");
    revalidateTag(`transactions:portfolio:${parsed.data.portfolioId}`, "max");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof DividendAlreadyBookedError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: toErrorMessage(error) }, { status: 400 });
  }
}

