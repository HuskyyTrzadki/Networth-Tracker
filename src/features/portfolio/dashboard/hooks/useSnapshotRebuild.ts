"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { SnapshotScope } from "../../server/snapshots/types";
import { computeRebuildProgressPercent } from "../../lib/rebuild-progress";
import {
  isSnapshotRebuildEventRelevant,
  parseSnapshotRebuildTriggeredDetail,
  SNAPSHOT_REBUILD_TRIGGERED_EVENT,
} from "../../lib/snapshot-rebuild-events";
import {
  getFallbackPollDelayMs,
  isStaleRunningRebuildState,
  resolveNextPollSchedule,
} from "./snapshot-rebuild-polling";

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

export type SnapshotRebuildStatus = Result;

const toQuery = (scope: SnapshotScope, portfolioId: string | null) => {
  const params = new URLSearchParams({ scope });
  if (scope === "PORTFOLIO" && portfolioId) {
    params.set("portfolioId", portfolioId);
  }
  return params.toString();
};

export function useSnapshotRebuild(
  scope: SnapshotScope,
  portfolioId: string | null,
  enabled: boolean
): Result {
  const router = useRouter();
  const [state, setState] = useState<RebuildStateResponse | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const isRunInFlightRef = useRef(false);
  const pollTimerRef = useRef<number | null>(null);
  const runningBackoffIndexRef = useRef(0);
  const previousStatusRef = useRef<RebuildStateResponse["status"] | null>(null);
  const failedRetryAttemptedRef = useRef(false);

  const clearPollTimer = () => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    const handleTriggeredRebuild = (event: Event) => {
      const detail = parseSnapshotRebuildTriggeredDetail(event);
      if (!detail) {
        return;
      }

      if (!isSnapshotRebuildEventRelevant(detail, scope, portfolioId)) {
        return;
      }

      setReloadVersion((current) => current + 1);
    };

    window.addEventListener(
      SNAPSHOT_REBUILD_TRIGGERED_EVENT,
      handleTriggeredRebuild
    );

    return () => {
      window.removeEventListener(
        SNAPSHOT_REBUILD_TRIGGERED_EVENT,
        handleTriggeredRebuild
      );
    };
  }, [portfolioId, scope]);

  useEffect(() => {
    if (!enabled) {
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
          scheduleNextPoll(getFallbackPollDelayMs());
        });
      }, delayMs);
    };

    const loadState = async () => {
      let response: Response;
      try {
        response = await fetch(`/api/portfolio-snapshots/rebuild?${query}`);
      } catch {
        scheduleNextPoll(getFallbackPollDelayMs());
        return;
      }

      const payload = (await response.json().catch(() => null)) as RebuildStateResponse | null;

      if (cancelled) {
        return;
      }

      if (!response.ok || !payload) {
        scheduleNextPoll(getFallbackPollDelayMs());
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

      const schedule = resolveNextPollSchedule({
        status: payload.status,
        nextPollAfterMs: payload.nextPollAfterMs,
        runningBackoffIndex: runningBackoffIndexRef.current,
      });
      runningBackoffIndexRef.current = schedule.nextRunningBackoffIndex;
      scheduleNextPoll(schedule.delayMs);
    };

    void loadState().catch(() => {
      scheduleNextPoll(getFallbackPollDelayMs());
    });

    return () => {
      cancelled = true;
      clearPollTimer();
      runningBackoffIndexRef.current = 0;
    };
  }, [enabled, portfolioId, reloadVersion, router, scope]);

  useEffect(() => {
    const shouldRecoverStaleRunning = state
      ? isStaleRunningRebuildState({
          status: state.status,
          updatedAt: state.updatedAt,
        })
      : false;
    const shouldRetryFailedState =
      state?.status === "failed" &&
      Boolean(state.dirtyFrom) &&
      !failedRetryAttemptedRef.current;

    if (
      !enabled ||
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

        const previousStatus = previousStatusRef.current;
        if (
          payload.status === "idle" &&
          (previousStatus === "queued" || previousStatus === "running")
        ) {
          router.refresh();
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
      })
      .catch(() => undefined)
      .finally(() => {
        // Always release the in-flight lock, even when this effect instance was cleaned up.
        isRunInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, portfolioId, router, scope, state]);

  return useMemo(() => {
    if (!enabled) {
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
        computeRebuildProgressPercent({
          fromDate,
          toDate,
          processedUntil,
        }),
      message: state?.message ?? null,
      isBusy: state?.status === "queued" || state?.status === "running",
    } satisfies Result;
  }, [enabled, state]);
}
