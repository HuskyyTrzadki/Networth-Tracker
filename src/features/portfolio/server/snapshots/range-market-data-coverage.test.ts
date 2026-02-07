import { describe, expect, it } from "vitest";

import { hasSufficientDailyCoverage } from "./range-market-data-coverage";

describe("hasSufficientDailyCoverage", () => {
  it("accepts dense trading coverage with weekend-sized gaps", () => {
    const rows = [
      { date: "2023-02-06" },
      { date: "2023-02-07" },
      { date: "2023-02-08" },
      { date: "2023-02-09" },
      { date: "2023-02-10" },
      { date: "2023-02-13" },
      { date: "2023-02-14" },
    ];

    expect(hasSufficientDailyCoverage(rows, "2023-02-07", "2023-02-14")).toBe(true);
  });

  it("rejects large internal gaps", () => {
    const rows = [
      { date: "2023-02-07" },
      { date: "2023-09-20" },
    ];

    expect(hasSufficientDailyCoverage(rows, "2023-02-07", "2023-12-31")).toBe(false);
  });

  it("rejects when coverage starts too late", () => {
    const rows = [{ date: "2023-03-01" }];

    expect(hasSufficientDailyCoverage(rows, "2023-02-07", "2023-03-10")).toBe(false);
  });

  it("rejects when coverage ends too early", () => {
    const rows = [{ date: "2023-02-07" }];

    expect(hasSufficientDailyCoverage(rows, "2023-02-07", "2023-03-10")).toBe(false);
  });
});

