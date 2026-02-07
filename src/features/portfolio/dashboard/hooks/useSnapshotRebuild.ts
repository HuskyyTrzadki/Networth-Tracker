"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { SnapshotScope } from "../../server/snapshots/types";

type RebuildStateResponse = Readonly<{
  status: "idle" | "queued" | "running" | "failed";
  dirtyFrom: string | null;
  fromDate: string | null;
  toDate: string | null;
  processedUntil: string | null;
  progressPercent: number | null;
  message: string | null;
  updatedAt: string | null;
  nextPollAfterMs: number | null;
  processedDays?: number;
}>;

type Result = Readonly<{
  status: RebuildStateResponse["status"];
  dirtyFrom: string | null;
  fromDate: string | null;
  toDate: string | null;
  processedUntil: string | null;
  progressPercent: number | null;
  message: string | null;
  isBusy: boolean;
}>;

const QUEUED_POLL_MS = 2_000;
const RUNNING_STALE_AFTER_MS = 90_000;
const RUNNING_BACKOFF_STEPS_MS = [2_000, 5_000, 10_000] as const;

const toQuery = (scope: SnapshotScope, portfolioId: string | null) => {
  const params = new URLSearchParams({ scope });
  if (scope === "PORTFOLIO" && portfolioId) {
    params.set("portfolioId", portfolioId);
  }
  return params.toString();
};

const toIsoDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const computeProgressPercent = (
  fromDate: string | null,
  toDate: string | null,
  processedUntil: string | null
) => {
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

export function useSnapshotRebuild(
  scope: SnapshotScope,
  portfolioId: string | null,
  hasHoldings: boolean
): Result {
  const router = useRouter();
  const [state, setState] = useState<RebuildStateResponse | null>(null);
  const isRunInFlightRef = useRef(false);
  const pollTimerRef = useRef<number | null>(null);
  const runningBackoffIndexRef = useRef(0);
  const previousStatusRef = useRef<RebuildStateResponse["status"] | null>(null);
  const failedRetryAttemptedRef = useRef(false);

  const isStaleRunningState = (currentState: RebuildStateResponse) => {
    if (currentState.status !== "running" || !currentState.updatedAt) {
      return false;
    }

    const updatedAtMs = Date.parse(currentState.updatedAt);
    if (!Number.isFinite(updatedAtMs)) {
      return true;
    }

    return Date.now() - updatedAtMs > RUNNING_STALE_AFTER_MS;
  };

  const clearPollTimer = () => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!hasHoldings) {
      clearPollTimer();
      runningBackoffIndexRef.current = 0;
      previousStatusRef.current = null;
      return;
    }

    let cancelled = false;
    const query = toQuery(scope, portfolioId);
    const scheduleNextPoll = (delayMs: number) => {
      if (cancelled) {
        return;
      }

      clearPollTimer();
      pollTimerRef.current = window.setTimeout(() => {
        void loadState().catch(() => {
          scheduleNextPoll(RUNNING_BACKOFF_STEPS_MS.at(-1) ?? 10_000);
        });
      }, delayMs);
    };

    const loadState = async () => {
      let response: Response;
      try {
        response = await fetch(`/api/portfolio-snapshots/rebuild?${query}`);
      } catch {
        scheduleNextPoll(RUNNING_BACKOFF_STEPS_MS.at(-1) ?? 10_000);
        return;
      }

      const payload = (await response.json().catch(() => null)) as RebuildStateResponse | null;

      if (cancelled) {
        return;
      }

      if (!response.ok || !payload) {
        scheduleNextPoll(RUNNING_BACKOFF_STEPS_MS.at(-1) ?? 10_000);
        return;
      }

      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = payload.status;
      if (payload.status !== "failed") {
        failedRetryAttemptedRef.current = false;
      }
      setState(payload);

      clearPollTimer();

      if (payload.status === "idle" || payload.status === "failed") {
        if (
          payload.status === "idle" &&
          (previousStatus === "queued" || previousStatus === "running")
        ) {
          router.refresh();
        }
        runningBackoffIndexRef.current = 0;
        return;
      }

      let nextDelay = payload.nextPollAfterMs;
      if (!nextDelay) {
        if (payload.status === "queued") {
          runningBackoffIndexRef.current = 0;
          nextDelay = QUEUED_POLL_MS;
        } else {
          const stepIndex = Math.min(
            runningBackoffIndexRef.current,
            RUNNING_BACKOFF_STEPS_MS.length - 1
          );
          nextDelay = RUNNING_BACKOFF_STEPS_MS[stepIndex];
          runningBackoffIndexRef.current = Math.min(
            runningBackoffIndexRef.current + 1,
            RUNNING_BACKOFF_STEPS_MS.length - 1
          );
        }
      } else if (payload.status === "queued") {
        runningBackoffIndexRef.current = 0;
      } else if (payload.status === "running") {
        const serverDelay = nextDelay ?? RUNNING_BACKOFF_STEPS_MS.at(-1) ?? 10_000;
        const matchedIndex = RUNNING_BACKOFF_STEPS_MS.findIndex(
          (value) => value >= serverDelay
        );
        runningBackoffIndexRef.current =
          matchedIndex === -1 ? RUNNING_BACKOFF_STEPS_MS.length - 1 : matchedIndex;
      }

      const resolvedDelay =
        nextDelay ?? (payload.status === "queued" ? QUEUED_POLL_MS : 10_000);

      scheduleNextPoll(resolvedDelay);
    };

    void loadState().catch(() => {
      scheduleNextPoll(RUNNING_BACKOFF_STEPS_MS.at(-1) ?? 10_000);
    });

    return () => {
      cancelled = true;
      clearPollTimer();
      runningBackoffIndexRef.current = 0;
      previousStatusRef.current = null;
    };
  }, [hasHoldings, portfolioId, router, scope]);

  useEffect(() => {
    const shouldRecoverStaleRunning = state ? isStaleRunningState(state) : false;
    const shouldRetryFailedState =
      state?.status === "failed" &&
      Boolean(state.dirtyFrom) &&
      !failedRetryAttemptedRef.current;

    if (
      !hasHoldings ||
      !state ||
      (state.status !== "queued" &&
        !shouldRecoverStaleRunning &&
        !shouldRetryFailedState) ||
      isRunInFlightRef.current
    ) {
      return;
    }

    let cancelled = false;
    isRunInFlightRef.current = true;
    if (shouldRetryFailedState) {
      failedRetryAttemptedRef.current = true;
    }

    void fetch("/api/portfolio-snapshots/rebuild", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        portfolioId: scope === "PORTFOLIO" ? portfolioId : null,
        maxDaysPerRun: 90,
        timeBudgetMs: 9_000,
      }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | RebuildStateResponse
          | null;

        if (!response.ok || !payload || cancelled) {
          return;
        }

        if (payload.status === "idle" || payload.status === "failed") {
          clearPollTimer();
          runningBackoffIndexRef.current = 0;
        }
        if (payload.status !== "failed") {
          failedRetryAttemptedRef.current = false;
        }

        previousStatusRef.current = payload.status;
        setState(payload);
        router.refresh();
      })
      .catch(() => undefined)
      .finally(() => {
        // Always release the in-flight lock, even when this effect instance was cleaned up.
        isRunInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [hasHoldings, portfolioId, router, scope, state]);

  return useMemo(() => {
    if (!hasHoldings) {
      return {
        status: "idle",
        dirtyFrom: null,
        fromDate: null,
        toDate: null,
        processedUntil: null,
        progressPercent: null,
        message: null,
        isBusy: false,
      } satisfies Result;
    }

    const fromDate = state?.fromDate ?? null;
    const toDate = state?.toDate ?? null;
    const processedUntil = state?.processedUntil ?? null;

    return {
      status: state?.status ?? "idle",
      dirtyFrom: state?.dirtyFrom ?? null,
      fromDate,
      toDate,
      processedUntil,
      progressPercent:
        state?.progressPercent ??
        computeProgressPercent(fromDate, toDate, processedUntil),
      message: state?.message ?? null,
      isBusy: state?.status === "queued" || state?.status === "running",
    } satisfies Result;
  }, [hasHoldings, state]);
}
