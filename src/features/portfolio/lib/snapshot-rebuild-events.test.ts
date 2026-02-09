import { describe, expect, it } from "vitest";

import { isSnapshotRebuildEventRelevant } from "./snapshot-rebuild-events";

describe("snapshot rebuild events", () => {
  it("matches PORTFOLIO events only for the same portfolio id", () => {
    expect(
      isSnapshotRebuildEventRelevant(
        { scope: "PORTFOLIO", portfolioId: "p1" },
        "PORTFOLIO",
        "p1"
      )
    ).toBe(true);
    expect(
      isSnapshotRebuildEventRelevant(
        { scope: "PORTFOLIO", portfolioId: "p2" },
        "PORTFOLIO",
        "p1"
      )
    ).toBe(false);
  });

  it("matches ALL events for ALL scope", () => {
    expect(
      isSnapshotRebuildEventRelevant(
        { scope: "ALL", portfolioId: null },
        "ALL",
        null
      )
    ).toBe(true);
  });
});
