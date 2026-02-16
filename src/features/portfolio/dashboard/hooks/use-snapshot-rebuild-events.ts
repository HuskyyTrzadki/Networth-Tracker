"use client";

import { useEffect, useState } from "react";

import type { SnapshotScope } from "../../server/snapshots/types";
import {
  isSnapshotRebuildEventRelevant,
  parseSnapshotRebuildTriggeredDetail,
  SNAPSHOT_REBUILD_TRIGGERED_EVENT,
} from "../../lib/snapshot-rebuild-events";

export function useSnapshotRebuildEvents(
  scope: SnapshotScope,
  portfolioId: string | null
) {
  const [reloadVersion, setReloadVersion] = useState(0);

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

  return reloadVersion;
}
