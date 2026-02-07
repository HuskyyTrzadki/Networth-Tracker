import { describe, expect, it } from "vitest";

import { __test__ } from "./run-snapshot-rebuild";

describe("resolveChunkToDate", () => {
  it("caps chunk end date by maxDaysPerRun", () => {
    const result = __test__.resolveChunkToDate(
      "2024-12-23",
      "2025-12-31",
      45
    );

    expect(result).toBe("2025-02-05");
  });

  it("does not cross rebuild toDate", () => {
    const result = __test__.resolveChunkToDate(
      "2024-12-23",
      "2024-12-31",
      90
    );

    expect(result).toBe("2024-12-31");
  });
});

describe("resolveMergedProgress", () => {
  it("advances dirtyFrom when no concurrent update exists", () => {
    const result = __test__.resolveMergedProgress(
      "2024-12-23",
      "2025-02-06",
      "2024-12-23",
      "2026-02-06",
      "2025-02-05",
      {
        id: "id",
        userId: "u",
        scope: "PORTFOLIO",
        portfolioId: "p",
        dirtyFrom: "2024-12-23",
        fromDate: "2024-12-23",
        toDate: "2026-02-06",
        processedUntil: null,
        status: "running",
        message: null,
        updatedAt: "2026-02-06T00:00:00.000Z",
      }
    );

    expect(result.status).toBe("queued");
    expect(result.dirtyFrom).toBe("2025-02-06");
    expect(result.processedUntil).toBe("2025-02-05");
  });

  it("keeps earlier concurrent dirtyFrom when it changed during run", () => {
    const result = __test__.resolveMergedProgress(
      "2024-12-23",
      "2025-02-06",
      "2024-12-23",
      "2026-02-06",
      "2025-02-05",
      {
        id: "id",
        userId: "u",
        scope: "PORTFOLIO",
        portfolioId: "p",
        dirtyFrom: "2025-01-15",
        fromDate: "2024-12-23",
        toDate: "2026-02-06",
        processedUntil: null,
        status: "running",
        message: null,
        updatedAt: "2026-02-06T00:00:00.000Z",
      }
    );

    expect(result.status).toBe("queued");
    expect(result.dirtyFrom).toBe("2025-01-15");
    expect(result.processedUntil).toBeNull();
  });
});
