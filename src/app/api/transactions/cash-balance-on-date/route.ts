import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  if (error || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
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
    return NextResponse.json({ message: "Portfolio not found." }, { status: 404 });
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
    const message =
      routeError instanceof Error
        ? routeError.message
        : "Nie udało się pobrać salda gotówki na wybraną datę.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
