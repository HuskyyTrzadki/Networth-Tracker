import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type {
  InstrumentSearchMode,
  InstrumentType,
} from "@/features/transactions/lib/instrument-search";
import { instrumentTypes } from "@/features/transactions/lib/instrument-search";
import { searchInstruments, MIN_QUERY_LENGTH } from "@/features/transactions/server/search-instruments";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LOCAL_LIMIT = 3;
const DEFAULT_AUTO_LIMIT = 3;
const DEFAULT_ALL_LIMIT = 50;
const DEFAULT_TIMEOUT_MS = 2000;
const ALL_TIMEOUT_MS = 5000;
const MAX_LIMIT = 50;

const parseLimit = (raw: string | null, fallback: number) => {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(1, Math.min(parsed, MAX_LIMIT));
};

const parseTypes = (raw: string | null): InstrumentType[] | null => {
  if (!raw) return null;
  const allowed = new Set(instrumentTypes);
  const requested = raw
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is InstrumentType =>
      allowed.has(value as InstrumentType)
    );
  return requested.length > 0 ? requested : null;
};

export async function GET(request: Request) {
  // Route handler: validate input, call the feature service, return JSON.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const modeParam = url.searchParams.get("mode");
  const mode: InstrumentSearchMode =
    modeParam === "all" ? "all" : modeParam === "local" ? "local" : "auto";
  const limit = parseLimit(
    url.searchParams.get("limit"),
    mode === "all"
      ? DEFAULT_ALL_LIMIT
      : mode === "local"
        ? DEFAULT_LOCAL_LIMIT
        : DEFAULT_AUTO_LIMIT
  );
  const timeoutMs = mode === "all" ? ALL_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const types = parseTypes(url.searchParams.get("types"));

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ query, results: [] }, { status: 200 });
  }

  try {
    const results = await searchInstruments(supabase, {
      query,
      mode,
      limit,
      timeoutMs,
      types: types ?? undefined,
    });
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
