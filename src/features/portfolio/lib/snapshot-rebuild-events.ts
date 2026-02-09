import type { SnapshotScope } from "../server/snapshots/types";

export const SNAPSHOT_REBUILD_TRIGGERED_EVENT =
  "portfolio:snapshot-rebuild-triggered";

export type SnapshotRebuildTriggeredDetail = Readonly<{
  scope: SnapshotScope;
  portfolioId: string | null;
}>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const parseSnapshotRebuildTriggeredDetail = (
  event: Event
): SnapshotRebuildTriggeredDetail | null => {
  if (!(event instanceof CustomEvent) || !isObject(event.detail)) {
    return null;
  }

  const scope = event.detail.scope;
  const portfolioId = event.detail.portfolioId;

  if (scope !== "PORTFOLIO" && scope !== "ALL") {
    return null;
  }

  if (portfolioId !== null && typeof portfolioId !== "string") {
    return null;
  }

  return { scope, portfolioId };
};

export const isSnapshotRebuildEventRelevant = (
  detail: SnapshotRebuildTriggeredDetail,
  scope: SnapshotScope,
  portfolioId: string | null
) => {
  if (detail.scope !== scope) {
    return false;
  }

  if (scope === "ALL") {
    return true;
  }

  return detail.portfolioId === portfolioId;
};

export const dispatchSnapshotRebuildTriggeredEvent = (
  detail: SnapshotRebuildTriggeredDetail
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SNAPSHOT_REBUILD_TRIGGERED_EVENT, { detail })
  );
};
