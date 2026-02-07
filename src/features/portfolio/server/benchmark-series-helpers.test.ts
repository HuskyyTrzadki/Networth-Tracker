import { describe, expect, it } from "vitest";

import {
  convertPrice,
  hasCoverage,
  toAsOfFxMap,
  toAsOfValueMap,
  type FxSeriesRow,
  type InstrumentSeriesRow,
} from "./benchmark-series-helpers";

describe("benchmark-series-helpers", () => {
  describe("hasCoverage", () => {
    it("returns true for fully covered range with small gaps", () => {
      const covered = hasCoverage(
        ["2025-01-02", "2025-01-05", "2025-01-09"],
        "2025-01-01",
        "2025-01-10",
        4
      );

      expect(covered).toBe(true);
    });

    it("returns false when there is a gap larger than threshold", () => {
      const covered = hasCoverage(
        ["2025-01-02", "2025-01-20"],
        "2025-01-01",
        "2025-01-20",
        5
      );

      expect(covered).toBe(false);
    });
  });

  describe("as-of maps", () => {
    it("keeps latest known instrument value per bucket", () => {
      const rows: readonly InstrumentSeriesRow[] = [
        { date: "2025-01-02", currency: "USD", close: "100" },
        { date: "2025-01-05", currency: "USD", close: "110" },
      ];
      const buckets = ["2025-01-01", "2025-01-03", "2025-01-06"];

      const result = toAsOfValueMap(rows, buckets);

      expect(result.get("2025-01-01")).toBeNull();
      expect(result.get("2025-01-03")?.close).toBe("100");
      expect(result.get("2025-01-06")?.close).toBe("110");
    });

    it("keeps latest known fx value per bucket", () => {
      const rows: readonly FxSeriesRow[] = [
        { date: "2025-01-02", rate: "4.0" },
        { date: "2025-01-04", rate: "4.2" },
      ];
      const buckets = ["2025-01-01", "2025-01-03", "2025-01-05"];

      const result = toAsOfFxMap(rows, buckets);

      expect(result.get("2025-01-01")).toBeNull();
      expect(result.get("2025-01-03")?.rate).toBe("4.0");
      expect(result.get("2025-01-05")?.rate).toBe("4.2");
    });
  });

  describe("convertPrice", () => {
    it("converts using direct fx rate", () => {
      const converted = convertPrice(
        "100",
        "USD",
        "PLN",
        "2025-01-05",
        new Map([["2025-01-05", { date: "2025-01-05", rate: "4.0" }]]),
        new Map()
      );

      expect(converted).toBe(400);
    });

    it("converts using inverse fx rate when direct is unavailable", () => {
      const converted = convertPrice(
        "100",
        "USD",
        "PLN",
        "2025-01-05",
        new Map(),
        new Map([["2025-01-05", { date: "2025-01-05", rate: "0.25" }]])
      );

      expect(converted).toBe(400);
    });

    it("returns null when fx rate is missing", () => {
      const converted = convertPrice(
        "100",
        "USD",
        "PLN",
        "2025-01-05",
        new Map(),
        new Map()
      );

      expect(converted).toBeNull();
    });
  });
});
