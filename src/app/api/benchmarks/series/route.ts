import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { BENCHMARK_IDS, type BenchmarkId } from "@/features/portfolio/dashboard/lib/benchmark-config";
import { getDashboardBenchmarkSeries } from "@/features/portfolio/server/get-dashboard-benchmark-series";
import { createClient } from "@/lib/supabase/server";

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isBenchmarkId = (value: string): value is BenchmarkId =>
  BENCHMARK_IDS.includes(value as BenchmarkId);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      bucketDates?: unknown;
      benchmarkId?: unknown;
    };
    const benchmarkIdRaw = payload.benchmarkId;
    if (typeof benchmarkIdRaw !== "string" || !isBenchmarkId(benchmarkIdRaw)) {
      return NextResponse.json({ error: "Nieprawidłowy benchmark." }, { status: 400 });
    }

    const bucketDatesRaw = payload.bucketDates;
    if (!Array.isArray(bucketDatesRaw)) {
      return NextResponse.json({ error: "Nieprawidłowe bucketDates." }, { status: 400 });
    }

    const bucketDates = bucketDatesRaw
      .filter((value): value is string => typeof value === "string" && isIsoDate(value))
      .sort((left, right) => left.localeCompare(right));

    if (bucketDates.length === 0) {
      return NextResponse.json({ error: "Brak poprawnych dat." }, { status: 400 });
    }

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
