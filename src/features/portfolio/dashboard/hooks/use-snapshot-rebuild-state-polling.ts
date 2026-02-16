"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { SnapshotScope } from "../../server/snapshots/types";
import type { SnapshotRebuildStatusKind, SnapshotRebuildStatusPayload } from "../../lib/snapshot-rebuild-contract";
import {
  getFallbackPollDelayMs,
  resolveNextPollSchedule,
} from "./snapshot-rebuild-polling";

const toQuery = (scope: SnapshotScope, portfolioId: string | null) => {
  const params = new URLSearchParams({ scope });
  if (scope === "PORTFOLIO" && portfolioId) {
    params.set("portfolioId", portfolioId);
  }
  return params.toString();
};

type Params = Readonly<{
  enabled: boolean;
  scope: SnapshotScope;
  portfolioId: string | null;
  reloadVersion: number;
  router: Readonly<{ refresh: () => void }>;
  setState: Dispatch<SetStateAction<SnapshotRebuildStatusPayload | null>>;
  setFailedRetryAttempted: Dispatch<SetStateAction<boolean>>;
}>;

export function useSnapshotRebuildStatePolling({
  enabled,
  scope,
  portfolioId,
  reloadVersion,
  router,
  setState,
  setFailedRetryAttempted,
}: Params) {
  const pollTimerRef = useRef<number | null>(null);
  const runningBackoffIndexRef = useRef(0);
  const previousStatusRef = useRef<SnapshotRebuildStatusKind | null>(null);

  useEffect(() => {
    const clearPollTimer = () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    if (!enabled) {
      clearPollTimer();
      runningBackoffIndexRef.current = 0;
      previousStatusRef.current = null;
      setFailedRetryAttempted(false);
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

      const payload = (await response.json().catch(() => null)) as
        | SnapshotRebuildStatusPayload
        | null;

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
        setFailedRetryAttempted(false);
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
  }, [
    enabled,
    portfolioId,
    router,
    reloadVersion,
    setFailedRetryAttempted,
    scope,
    setState,
  ]);
}
