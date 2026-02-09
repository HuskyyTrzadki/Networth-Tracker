import { describe, expect, it } from "vitest";

import { __test__ } from "./create-transaction";

describe("createTransaction snapshot sync helpers", () => {
  it("marks past-dated transactions as dirty", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-07", "2026-02-08")).toBe(
      true
    );
  });

  it("marks same-day transactions as dirty", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-08", "2026-02-08")).toBe(
      true
    );
  });

  it("does not mark future-dated transactions", () => {
    expect(__test__.shouldMarkSnapshotHistoryDirty("2026-02-09", "2026-02-08")).toBe(
      false
    );
  });
});
