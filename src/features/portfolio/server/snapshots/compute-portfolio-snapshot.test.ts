import { describe, expect, it } from "vitest";

import { __test__ } from "./compute-portfolio-snapshot";
import type { SnapshotTotals } from "./types";

const buildTotals = (totalValue: string | null): SnapshotTotals => ({
  totalValue,
  isPartial: false,
  missingQuotes: 0,
  missingFx: 0,
  asOf: "2025-01-01T10:00:00Z",
});

describe("computePortfolioSnapshot helpers", () => {
  it("builds snapshot row with PLN/USD/EUR mappings", () => {
    const totals = {
      PLN: buildTotals("100"),
      USD: buildTotals("25"),
      EUR: buildTotals("20"),
    } as const;

    const row = __test__.buildSnapshotRow(
      "user-1",
      "PORTFOLIO",
      "portfolio-1",
      "2026-02-01",
      totals
    );

    expect(row.total_value_pln).toBe("100");
    expect(row.total_value_usd).toBe("25");
    expect(row.total_value_eur).toBe("20");
    expect(row.scope).toBe("PORTFOLIO");
    expect(row.portfolio_id).toBe("portfolio-1");
  });

  it("detects any snapshot value", () => {
    const totals = {
      PLN: buildTotals(null),
      USD: buildTotals(null),
      EUR: buildTotals("10"),
    } as const;

    expect(__test__.hasAnySnapshotValue(totals)).toBe(true);
  });

  it("builds FX pairs for holdings vs. 3 currencies", () => {
    const pairs = __test__.buildFxPairs([
      {
        instrumentId: "inst-1",
        symbol: "AAA",
        name: "AAA",
        currency: "USD",
        exchange: "NYSE",
        provider: "yahoo",
        providerKey: "AAA",
        logoUrl: null,
        instrumentType: null,
        quantity: "1",
      },
      {
        instrumentId: "inst-2",
        symbol: "BBB",
        name: "BBB",
        currency: "PLN",
        exchange: "GPW",
        provider: "yahoo",
        providerKey: "BBB",
        logoUrl: null,
        instrumentType: null,
        quantity: "2",
      },
    ]);

    expect(pairs).toEqual(
      expect.arrayContaining([
        { from: "USD", to: "PLN" },
        { from: "USD", to: "EUR" },
        { from: "PLN", to: "USD" },
        { from: "PLN", to: "EUR" },
      ])
    );
  });
});
