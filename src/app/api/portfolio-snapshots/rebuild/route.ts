import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getSnapshotRebuildState,
  type SnapshotRebuildState,
} from "@/features/portfolio/server/snapshots/rebuild-state";
import { runSnapshotRebuild } from "@/features/portfolio/server/snapshots/run-snapshot-rebuild";
import type { SnapshotScope } from "@/features/portfolio/server/snapshots/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const parseScope = (value: unknown): SnapshotScope | null => {
  if (value === "ALL" || value === "PORTFOLIO") return value;
  return null;
};

const parsePortfolioId = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseMaxDays = (value: unknown) => {
  if (typeof value !== "number") return 90;
  if (!Number.isFinite(value)) return 90;
  return Math.max(1, Math.min(Math.floor(value), 120));
};

const parseTimeBudgetMs = (value: unknown) => {
  if (typeof value !== "number") return 9_000;
  if (!Number.isFinite(value)) return 9_000;
  return Math.max(1_000, Math.min(Math.floor(value), 20_000));
};

const nextPollByAge = (updatedAt: string | null) => {
  if (!updatedAt) return 2_000;

  const updatedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(updatedAtMs)) return 10_000;

  const ageMs = Date.now() - updatedAtMs;
  if (ageMs < 15_000) return 2_000;
  if (ageMs < 60_000) return 5_000;
  return 10_000;
};

const resolveNextPollAfterMs = (
  status: "idle" | "queued" | "running" | "failed",
  updatedAt: string | null
) => {
  if (status === "queued") return 2_000;
  if (status === "running") return nextPollByAge(updatedAt);
  return null;
};

const toIsoDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const computeProgressPercent = (state: SnapshotRebuildState | null) => {
  const fromDate = state?.fromDate ?? null;
  const toDate = state?.toDate ?? null;
  const processedUntil = state?.processedUntil ?? null;

  if (!fromDate || !toDate) {
    return null;
  }

  const fromMs = toIsoDayTimestamp(fromDate);
  const toMs = toIsoDayTimestamp(toDate);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
    return null;
  }

  const totalDays = Math.floor((toMs - fromMs) / 86_400_000) + 1;
  if (totalDays <= 0) {
    return null;
  }

  if (!processedUntil) {
    return 0;
  }

  const processedMs = toIsoDayTimestamp(processedUntil);
  if (!Number.isFinite(processedMs) || processedMs < fromMs) {
    return 0;
  }

  const clampedProcessedMs = Math.min(processedMs, toMs);
  const processedDays = Math.floor((clampedProcessedMs - fromMs) / 86_400_000) + 1;
  return Math.max(0, Math.min(100, (processedDays / totalDays) * 100));
};

const buildResponsePayload = (
  state: SnapshotRebuildState | null
): Readonly<{
  status: "idle" | "queued" | "running" | "failed";
  dirtyFrom: string | null;
  fromDate: string | null;
  toDate: string | null;
  processedUntil: string | null;
  progressPercent: number | null;
  message: string | null;
  updatedAt: string | null;
  nextPollAfterMs: number | null;
}> => {
  const status = state?.status ?? "idle";
  const updatedAt = state?.updatedAt ?? null;

  return {
    status,
    dirtyFrom: state?.dirtyFrom ?? null,
    fromDate: state?.fromDate ?? null,
    toDate: state?.toDate ?? null,
    processedUntil: state?.processedUntil ?? null,
    progressPercent: computeProgressPercent(state),
    message: state?.message ?? null,
    updatedAt,
    nextPollAfterMs: resolveNextPollAfterMs(status, updatedAt),
  };
};

const withPollingHeaders = (
  payload: ReturnType<typeof buildResponsePayload>
) => {
  const headers = new Headers();
  if (payload.nextPollAfterMs !== null) {
    headers.set(
      "Retry-After",
      Math.max(1, Math.ceil(payload.nextPollAfterMs / 1_000)).toString()
    );
  }
  return headers;
};

const logRebuildEvent = (
  event: string,
  details: Readonly<Record<string, string | number | null>>
) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.info(`[snapshot-rebuild] ${event}`, details);
};

const ensureScopeAccess = async (
  supabaseUser: ReturnType<typeof createClient>,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null
) => {
  if (scope === "ALL") {
    return { ok: true as const, portfolioId: null };
  }

  if (!portfolioId) {
    return { ok: false as const, message: "Missing portfolioId for PORTFOLIO scope." };
  }

  const { data, error } = await supabaseUser
    .from("portfolios")
    .select("id")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { ok: false as const, message: "Portfolio not found." };
  }

  return { ok: true as const, portfolioId };
};

export async function GET(request: Request) {
  // Route handler: return current rebuild status for selected snapshot scope.
  const cookieStore = await cookies();
  const supabaseUser = createClient(cookieStore);

  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  const portfolioId = parsePortfolioId(url.searchParams.get("portfolioId"));

  if (!scope) {
    return NextResponse.json({ message: "Invalid scope." }, { status: 400 });
  }

  const access = await ensureScopeAccess(
    supabaseUser,
    data.user.id,
    scope,
    portfolioId
  );

  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: 400 });
  }

  const state = await getSnapshotRebuildState(
    supabaseUser,
    data.user.id,
    scope,
    access.portfolioId
  );

  const responsePayload = buildResponsePayload(state);

  return NextResponse.json(
    responsePayload,
    { status: 200, headers: withPollingHeaders(responsePayload) }
  );
}

export async function POST(request: Request) {
  // Route handler: process rebuild work for selected scope (may include multiple chunks per run).
  const cookieStore = await cookies();
  const supabaseUser = createClient(cookieStore);

  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        scope?: unknown;
        portfolioId?: unknown;
        maxDaysPerRun?: unknown;
        timeBudgetMs?: unknown;
      }
    | null;

  const scope = parseScope(payload?.scope);
  const portfolioId = parsePortfolioId(payload?.portfolioId);

  if (!scope) {
    return NextResponse.json({ message: "Invalid scope." }, { status: 400 });
  }

  const access = await ensureScopeAccess(
    supabaseUser,
    data.user.id,
    scope,
    portfolioId
  );

  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: 400 });
  }

  try {
    logRebuildEvent("post-start", {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
    });

    const adminClient = createAdminClient();
    const result = await runSnapshotRebuild(adminClient, {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
      maxDaysPerRun: parseMaxDays(payload?.maxDaysPerRun),
      timeBudgetMs: parseTimeBudgetMs(payload?.timeBudgetMs),
    });

    logRebuildEvent("post-finish", {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
      status: result.state?.status ?? "idle",
      processedDays: result.processedDays,
      dirtyFrom: result.state?.dirtyFrom ?? null,
      processedUntil: result.state?.processedUntil ?? null,
    });

    const responsePayload = {
      ...buildResponsePayload(result.state),
      processedDays: result.processedDays,
    };

    return NextResponse.json(
      responsePayload,
      { status: 200, headers: withPollingHeaders(responsePayload) }
    );
  } catch (runError) {
    const message =
      runError instanceof Error ? runError.message : "Snapshot rebuild failed.";
    logRebuildEvent("post-error", {
      userId: data.user.id,
      scope,
      portfolioId: access.portfolioId,
      error: message,
    });
    return NextResponse.json({ message }, { status: 400 });
  }
}
