import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getInstrumentPriceOnDate } from "@/features/transactions/server/get-instrument-price-on-date";
import { isValidTradeDate } from "@/features/transactions/lib/trade-date";
import { createClient } from "@/lib/supabase/server";

const parseProvider = (value: string | null) => {
  if (!value || value === "yahoo") {
    return "yahoo" as const;
  }

  return null;
};

export async function GET(request: Request) {
  // Route handler: validate params, resolve historical price hint, return JSON.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const provider = parseProvider(url.searchParams.get("provider"));
  const providerKey = url.searchParams.get("providerKey")?.trim() ?? "";
  const date = url.searchParams.get("date")?.trim() ?? "";

  if (!provider || !providerKey || !date) {
    return NextResponse.json(
      { message: "Brak wymaganych parametrów: providerKey, date." },
      { status: 400 }
    );
  }

  if (!isValidTradeDate(date)) {
    return NextResponse.json({ message: "Nieprawidłowa data." }, { status: 400 });
  }

  try {
    const result = await getInstrumentPriceOnDate(supabase, {
      provider,
      providerKey,
      date,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
