import { describe, expect, it } from "vitest";

import { __test__ } from "./get-polish-cpi-series-cached";

describe("parsePolishCpiPayload", () => {
  it("parses Eurostat JSON-stat monthly index levels", () => {
    const payload = {
      dimension: {
        time: {
          category: {
            index: {
              "2025-12": 0,
              "2026-01": 1,
            },
            label: {
              "2025-12": "2025-12",
              "2026-01": "2026-01",
            },
          },
        },
      },
      value: {
        "0": 0.3,
        "1": 0.5,
      },
    };

    expect(__test__.parsePolishCpiPayload(payload)).toEqual([
      { periodDate: "2025-12-01", value: 0.3 },
      { periodDate: "2026-01-01", value: 0.5 },
    ]);
  });

  it("parses okres + wartosc rows", () => {
    const payload = {
      data: [
        { okres: "2025M12", wartosc: "105.2" },
        { okres: "2026M01", wartosc: "106,1" },
      ],
    };

    expect(__test__.parsePolishCpiPayload(payload)).toEqual([
      { periodDate: "2025-12-01", value: 105.2 },
      { periodDate: "2026-01-01", value: 106.1 },
    ]);
  });

  it("parses rok + miesiac + value rows", () => {
    const payload = {
      values: [{ rok: 2026, miesiac: 2, value: 107.4 }],
    };

    expect(__test__.parsePolishCpiPayload(payload)).toEqual([
      { periodDate: "2026-02-01", value: 107.4 },
    ]);
  });

  it("parses BDL yearly results shape (year + val)", () => {
    const payload = {
      results: [
        { year: 2024, val: 103.6 },
        { year: 2025, val: 104.4 },
      ],
    };

    expect(__test__.parsePolishCpiPayload(payload)).toEqual([
      { periodDate: "2024-01-01", value: 103.6 },
      { periodDate: "2025-01-01", value: 104.4 },
    ]);
  });
});

describe("toIsoMonthDate", () => {
  it("normalizes macro period and date strings to month-start dates", () => {
    expect(__test__.toIsoMonthDate("2026M03")).toBe("2026-03-01");
    expect(__test__.toIsoMonthDate("2026-03-17")).toBe("2026-03-01");
    expect(__test__.toIsoMonthDate("bad")).toBeNull();
  });
});

describe("isMissingCpiCacheTableError", () => {
  it("detects missing schema-cache table errors", () => {
    expect(
      __test__.isMissingCpiCacheTableError(
        new Error("PGRST205: Could not find the table 'public.macro_cpi_pl_cache'")
      )
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(
      __test__.isMissingCpiCacheTableError(new Error("network timeout"))
    ).toBe(false);
  });
});

describe("isEurostatEmptySelection", () => {
  it("detects empty eurostat dataset caused by invalid filter combination", () => {
    const payload = {
      class: "dataset",
      value: {},
      dimension: {
        unit: {
          category: {
            index: {},
          },
        },
      },
    };

    expect(__test__.isEurostatEmptySelection(payload)).toBe(true);
  });

  it("returns false for dataset with observations", () => {
    const payload = {
      class: "dataset",
      value: { "0": 0.5 },
      dimension: {
        unit: {
          category: {
            index: { RCH_A: 0 },
          },
        },
      },
    };

    expect(__test__.isEurostatEmptySelection(payload)).toBe(false);
  });
});
