import { describe, expect, it } from "vitest";

import { parseSnapshotRowsQuery } from "./snapshot-rows-route-service";

describe("parseSnapshotRowsQuery", () => {
  it("accepts ALL scope without portfolio id", () => {
    const query = new URLSearchParams({ scope: "ALL" });

    const result = parseSnapshotRowsQuery(query);

    expect(result).toEqual({
      ok: true,
      scope: "ALL",
      portfolioId: null,
    });
  });

  it("accepts PORTFOLIO scope with portfolio id", () => {
    const query = new URLSearchParams({
      scope: "PORTFOLIO",
      portfolioId: "abc-123",
    });

    const result = parseSnapshotRowsQuery(query);

    expect(result).toEqual({
      ok: true,
      scope: "PORTFOLIO",
      portfolioId: "abc-123",
    });
  });

  it("rejects PORTFOLIO scope without portfolio id", () => {
    const query = new URLSearchParams({ scope: "PORTFOLIO" });

    const result = parseSnapshotRowsQuery(query);

    expect(result).toEqual({
      ok: false,
      message: "Missing portfolioId for PORTFOLIO scope.",
      status: 400,
    });
  });

  it("rejects unknown scope", () => {
    const query = new URLSearchParams({ scope: "INVALID" });

    const result = parseSnapshotRowsQuery(query);

    expect(result).toEqual({
      ok: false,
      message: "Invalid scope. Expected ALL or PORTFOLIO.",
      status: 400,
    });
  });
});
