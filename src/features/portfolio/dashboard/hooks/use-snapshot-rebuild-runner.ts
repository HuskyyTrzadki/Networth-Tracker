"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { SnapshotScope } from "../../server/snapshots/types";
import type { SnapshotRebuildStatusPayload } from "../../lib/snapshot-rebuild-contract";
import { isStaleRunningRebuildState } from "./snapshot-rebuild-polling";

type Params = Readonly<{
  enabled: boolean;
  scope: SnapshotScope;
  portfolioId: string | null;
  state: SnapshotRebuildStatusPayload | null;
  router: Readonly<{ refresh: () => void }>;
  failedRetryAttempted: boolean;
  setFailedRetryAttempted: Dispatch<SetStateAction<boolean>>;
  setState: Dispatch<SetStateAction<SnapshotRebuildStatusPayload | null>>;
}>;

const shouldRunRebuild = (
  state: SnapshotRebuildStatusPayload | null,
  enabled: boolean,
  failedRetryAttempted: boolean,
  isRunInFlight: boolean
) => {
  if (!enabled || !state || isRunInFlight) {
    return false;
  }

  const shouldRecoverStaleRunning = isStaleRunningRebuildState({
    status: state.status,
    updatedAt: state.updatedAt,
  });
  const shouldRetryFailedState =
    state.status === "failed" && Boolean(state.dirtyFrom) && !failedRetryAttempted;

  return state.status === "queued" || shouldRecoverStaleRunning || shouldRetryFailedState;
};

export function useSnapshotRebuildRunner({
  enabled,
  scope,
  portfolioId,
  state,
  router,
  failedRetryAttempted,
  setFailedRetryAttempted,
  setState,
}: Params) {
  const isRunInFlightRef = useRef(false);

  useEffect(() => {
    if (
      !shouldRunRebuild(
        state,
        enabled,
        failedRetryAttempted,
        isRunInFlightRef.current
      )
    ) {
      return;
    }
    if (!state) {
      return;
    }

    let cancelled = false;
    isRunInFlightRef.current = true;
    if (state.status === "failed" && Boolean(state.dirtyFrom)) {
      setFailedRetryAttempted(true);
    }
    const previousStatus = state.status;

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
          | SnapshotRebuildStatusPayload
          | null;

        if (!response.ok || !payload || cancelled) {
          return;
        }

        if (
          payload.status === "idle" &&
          (previousStatus === "queued" || previousStatus === "running")
        ) {
          router.refresh();
        }
        if (payload.status !== "failed") {
          setFailedRetryAttempted(false);
        }

        setState(payload);
      })
      .catch(() => undefined)
      .finally(() => {
        isRunInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    failedRetryAttempted,
    isRunInFlightRef,
    portfolioId,
    router,
    setFailedRetryAttempted,
    scope,
    setState,
    state,
  ]);
}
