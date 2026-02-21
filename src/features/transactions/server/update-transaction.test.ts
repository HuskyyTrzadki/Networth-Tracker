import { describe, expect, it } from "vitest";

import { __test__ } from "./update-transaction";

describe("updateTransaction dirty range helpers", () => {
  it("uses older date when old trade date is earlier", () => {
    expect(__test__.resolveDirtyFromTradeDate("2026-01-15", "2026-02-10")).toBe(
      "2026-01-15"
    );
  });

  it("uses older date when new trade date is earlier", () => {
    expect(__test__.resolveDirtyFromTradeDate("2026-02-10", "2026-01-15")).toBe(
      "2026-01-15"
    );
  });

  it("keeps same date when both are equal", () => {
    expect(__test__.resolveDirtyFromTradeDate("2026-02-10", "2026-02-10")).toBe(
      "2026-02-10"
    );
  });

  it("marks same-day or past dates as dirty", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-10", "2026-02-10")).toBe(
      true
    );
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-09", "2026-02-10")).toBe(
      true
    );
  });

  it("skips future dates", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-11", "2026-02-10")).toBe(
      false
    );
  });
});
