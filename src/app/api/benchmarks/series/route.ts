import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { BENCHMARK_IDS } from "@/features/portfolio/dashboard/lib/benchmark-config";
import { getDashboardBenchmarkSeries } from "@/features/portfolio/server/get-dashboard-benchmark-series";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  benchmarkId: z.enum(BENCHMARK_IDS),
  bucketDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Nieprawidłowe dane wejściowe." }, { status: 400 });
    }

    const benchmarkIdRaw = parsed.data.benchmarkId;
    const bucketDates = Array.from(new Set(parsed.data.bucketDates)).sort((left, right) =>
      left.localeCompare(right)
    );

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Backend endpoint: fetch only one benchmark series aligned to provided chart dates.
    const series = await getDashboardBenchmarkSeries(supabase, bucketDates, {
      benchmarkIds: [benchmarkIdRaw],
    });

    return NextResponse.json({
      benchmarkId: benchmarkIdRaw,
      points: series[benchmarkIdRaw],
    });
  } catch {
    return NextResponse.json(
      { error: "Nie udało się pobrać benchmarków." },
      { status: 500 }
    );
  }
}
