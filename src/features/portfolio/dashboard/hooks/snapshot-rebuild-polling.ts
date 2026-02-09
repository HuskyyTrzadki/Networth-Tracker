type RebuildStatus = "idle" | "queued" | "running" | "failed";

export const QUEUED_POLL_MS = 2_000;
export const RUNNING_STALE_AFTER_MS = 90_000;
export const RUNNING_BACKOFF_STEPS_MS = [2_000, 5_000, 10_000] as const;

export const getFallbackPollDelayMs = () =>
  RUNNING_BACKOFF_STEPS_MS[RUNNING_BACKOFF_STEPS_MS.length - 1] ?? 10_000;

export const isStaleRunningRebuildState = (input: Readonly<{
  status: RebuildStatus;
  updatedAt: string | null;
}>) => {
  if (input.status !== "running" || !input.updatedAt) {
    return false;
  }

  const updatedAtMs = Date.parse(input.updatedAt);
  if (!Number.isFinite(updatedAtMs)) {
    return true;
  }

  return Date.now() - updatedAtMs > RUNNING_STALE_AFTER_MS;
};

export const resolveNextPollSchedule = (input: Readonly<{
  status: "queued" | "running";
  nextPollAfterMs: number | null;
  runningBackoffIndex: number;
}>) => {
  const maxBackoffIndex = RUNNING_BACKOFF_STEPS_MS.length - 1;
  const nextPollAfterMs = input.nextPollAfterMs;

  if (input.status === "queued") {
    return {
      delayMs: nextPollAfterMs ?? QUEUED_POLL_MS,
      nextRunningBackoffIndex: 0,
    };
  }

  if (nextPollAfterMs === null) {
    const stepIndex = Math.min(input.runningBackoffIndex, maxBackoffIndex);
    const nextDelay = RUNNING_BACKOFF_STEPS_MS[stepIndex] ?? getFallbackPollDelayMs();
    return {
      delayMs: nextDelay,
      nextRunningBackoffIndex: Math.min(stepIndex + 1, maxBackoffIndex),
    };
  }

  const matchedIndex = RUNNING_BACKOFF_STEPS_MS.findIndex(
    (value) => value >= nextPollAfterMs
  );
  return {
    delayMs: nextPollAfterMs,
    nextRunningBackoffIndex:
      matchedIndex === -1 ? maxBackoffIndex : matchedIndex,
  };
};
