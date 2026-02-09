import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getFxRatesCached } from "@/features/market-data";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  fromCurrency: z.string().trim().length(3),
  toCurrency: z.string().trim().length(3),
});

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
    const fxByPair = await getFxRatesCached(supabase, [
      { from: fromCurrency, to: toCurrency },
    ]);
    const fx = fxByPair.get(`${fromCurrency}:${toCurrency}`) ?? null;

    if (!fx) {
      return NextResponse.json(
        { message: "Brak kursu FX dla wybranej pary walut." },
        { status: 404 }
      );
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
    const message =
      routeError instanceof Error
        ? routeError.message
        : "Nie udało się pobrać kursu FX.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
