export type SnapshotRebuildStatusKind = "idle" | "queued" | "running" | "failed";

export type SnapshotRebuildStatusPayload = Readonly<{
  status: SnapshotRebuildStatusKind;
  dirtyFrom: string | null;
  fromDate: string | null;
  toDate: string | null;
  processedUntil: string | null;
  progressPercent: number | null;
  message: string | null;
  updatedAt: string | null;
  nextPollAfterMs: number | null;
}>;

export type SnapshotRebuildPostPayload = SnapshotRebuildStatusPayload &
  Readonly<{
    processedDays?: number;
  }>;
