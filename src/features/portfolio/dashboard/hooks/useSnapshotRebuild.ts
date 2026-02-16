"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { SnapshotScope } from "../../server/snapshots/types";
import {
  type SnapshotRebuildStatusKind,
  type SnapshotRebuildStatusPayload,
} from "../../lib/snapshot-rebuild-contract";
import { computeRebuildProgressPercent } from "../../lib/rebuild-progress";
import { useSnapshotRebuildEvents } from "./use-snapshot-rebuild-events";
import { useSnapshotRebuildStatePolling } from "./use-snapshot-rebuild-state-polling";
import { useSnapshotRebuildRunner } from "./use-snapshot-rebuild-runner";

type Result = Readonly<{
  status: SnapshotRebuildStatusKind;
  dirtyFrom: string | null;
  fromDate: string | null;
  toDate: string | null;
  processedUntil: string | null;
  progressPercent: number | null;
  message: string | null;
  isBusy: boolean;
}>;

export type SnapshotRebuildStatus = Result;

const isBusyStatus = (status: SnapshotRebuildStatusKind) =>
  status === "queued" || status === "running";

export function useSnapshotRebuild(
  scope: SnapshotScope,
  portfolioId: string | null,
  enabled: boolean
): Result {
  const router = useRouter();
  const [state, setState] = useState<SnapshotRebuildStatusPayload | null>(null);
  const [failedRetryAttempted, setFailedRetryAttempted] = useState(false);
  const reloadVersion = useSnapshotRebuildEvents(scope, portfolioId);

  useSnapshotRebuildStatePolling({
    enabled,
    scope,
    portfolioId,
    reloadVersion,
    router,
    setState,
    setFailedRetryAttempted,
  });

  useSnapshotRebuildRunner({
    enabled,
    scope,
    portfolioId,
    state,
    router,
    failedRetryAttempted,
    setFailedRetryAttempted,
    setState,
  });

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
    };
  }

  const fromDate = state?.fromDate ?? null;
  const toDate = state?.toDate ?? null;
  const processedUntil = state?.processedUntil ?? null;
  const status = state?.status ?? "idle";

  return {
    status,
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
    isBusy: isBusyStatus(status),
  };
}
