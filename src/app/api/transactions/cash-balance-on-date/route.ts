import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";

const requestSchema = z.object({
  portfolioId: z.string().uuid(),
  cashCurrency: z.string().trim().length(3),
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type HoldingsAsOfRow = Readonly<{
  instrument_type: string | null;
  currency: string;
  quantity: string | number;
}>;

const normalizeNumeric = (value: string | number) =>
  typeof value === "number" ? value.toString() : value;

export async function POST(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }
  const supabase = authResult.supabase;
  const user = authResult.user;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = requestSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const portfolioId = parsed.data.portfolioId;
  const cashCurrency = parsed.data.cashCurrency.toUpperCase();
  const tradeDate = parsed.data.tradeDate;

  // Auth-side ownership guard: user can only read balances for own portfolio.
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", portfolioId)
    .single();

  if (portfolioError || !portfolio) {
    return apiError({
      status: 404,
      code: "PORTFOLIO_NOT_FOUND",
      message: "Portfolio not found.",
      request,
    });
  }

  try {
    const supabaseAdmin = createAdminClient();

    // Service-side as-of snapshot: compute holdings exactly for selected trade date.
    const { data: holdingsData, error: holdingsError } = await supabaseAdmin.rpc(
      "get_portfolio_holdings_admin_as_of",
      {
        p_user_id: user.id,
        p_bucket_date: tradeDate,
        p_portfolio_id: portfolioId,
      }
    );

    if (holdingsError) {
      throw new Error(holdingsError.message);
    }

    const rows = (holdingsData ?? []) as HoldingsAsOfRow[];
    const cashRow = rows.find(
      (row) =>
        row.instrument_type === "CURRENCY" &&
        row.currency.toUpperCase() === cashCurrency
    );

    const availableCashOnDate = cashRow ? normalizeNumeric(cashRow.quantity) : "0";

    return NextResponse.json(
      {
        portfolioId,
        cashCurrency,
        tradeDate,
        availableCashOnDate,
      },
      { status: 200 }
    );
  } catch (routeError) {
    return apiFromUnknownError({
      error: routeError,
      request,
      fallbackCode: "CASH_BALANCE_ON_DATE_FAILED",
      fallbackMessage: "Nie udało się pobrać salda gotówki na wybraną datę.",
    });
  }
}
