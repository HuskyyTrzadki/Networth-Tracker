import type { createClient } from "@/lib/supabase/server";
import type {
  SnapshotRebuildStatusKind,
  SnapshotRebuildStatusPayload,
} from "@/features/portfolio/lib/snapshot-rebuild-contract";

import type { SnapshotRebuildState } from "./rebuild-state";
import type { SnapshotScope } from "./types";
import { computeRebuildProgressPercent } from "../../lib/rebuild-progress";

type ScopeAccess = Readonly<
  | { ok: true; portfolioId: string | null }
  | { ok: false; message: string }
>;

type ResponsePayload = SnapshotRebuildStatusPayload;

export const parseScope = (value: unknown): SnapshotScope | null => {
  if (value === "ALL" || value === "PORTFOLIO") return value;
  return null;
};

export const parsePortfolioId = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const parseMaxDays = (value: unknown) => {
  if (typeof value !== "number") return 90;
  if (!Number.isFinite(value)) return 90;
  return Math.max(1, Math.min(Math.floor(value), 120));
};

export const parseTimeBudgetMs = (value: unknown) => {
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
  status: SnapshotRebuildStatusKind,
  updatedAt: string | null
) => {
  if (status === "queued") return 2_000;
  if (status === "running") return nextPollByAge(updatedAt);
  return null;
};

export const buildRebuildResponsePayload = (
  state: SnapshotRebuildState | null
): ResponsePayload => {
  const status = state?.status ?? "idle";
  const updatedAt = state?.updatedAt ?? null;

  return {
    status,
    dirtyFrom: state?.dirtyFrom ?? null,
    fromDate: state?.fromDate ?? null,
    toDate: state?.toDate ?? null,
    processedUntil: state?.processedUntil ?? null,
    progressPercent: computeRebuildProgressPercent({
      fromDate: state?.fromDate ?? null,
      toDate: state?.toDate ?? null,
      processedUntil: state?.processedUntil ?? null,
    }),
    message: state?.message ?? null,
    updatedAt,
    nextPollAfterMs: resolveNextPollAfterMs(status, updatedAt),
  };
};

export const withRebuildPollingHeaders = (payload: ResponsePayload) => {
  const headers = new Headers();
  if (payload.nextPollAfterMs !== null) {
    headers.set(
      "Retry-After",
      Math.max(1, Math.ceil(payload.nextPollAfterMs / 1_000)).toString()
    );
  }
  return headers;
};

export const ensureScopeAccess = async (
  supabaseUser: ReturnType<typeof createClient>,
  userId: string,
  scope: SnapshotScope,
  portfolioId: string | null
): Promise<ScopeAccess> => {
  if (scope === "ALL") {
    return { ok: true, portfolioId: null };
  }

  if (!portfolioId) {
    return { ok: false, message: "Missing portfolioId for PORTFOLIO scope." };
  }

  // Access check: ensure requested portfolio belongs to the current user.
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
    return { ok: false, message: "Portfolio not found." };
  }

  return { ok: true, portfolioId };
};
