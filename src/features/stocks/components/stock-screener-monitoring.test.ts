import { describe, expect, it } from "vitest";

import type { StockScreenerCard } from "../server/types";

import { buildStockScreenerMonitoringSections } from "./stock-screener-monitoring";

const makeCard = (
  overrides: Partial<StockScreenerCard> & Pick<StockScreenerCard, "providerKey" | "symbol">
): StockScreenerCard => ({
  providerKey: overrides.providerKey,
  symbol: overrides.symbol,
  name: overrides.name ?? overrides.symbol,
  logoUrl: overrides.logoUrl ?? null,
  inPortfolio: overrides.inPortfolio ?? false,
  isFavorite: overrides.isFavorite ?? false,
  currency: overrides.currency ?? "USD",
  price: overrides.price ?? "100",
  previewChart:
    overrides.previewChart ??
    [
      { date: "2026-02-01", price: 100 },
      { date: "2026-03-01", price: 100 },
    ],
  asOf: overrides.asOf ?? "2026-03-01",
  isHydrating: overrides.isHydrating,
});

describe("buildStockScreenerMonitoringSections", () => {
  it("surfaces the worst portfolio dip as the lead card", () => {
    const sections = buildStockScreenerMonitoringSections(
      [
        makeCard({
          providerKey: "held-loss",
          symbol: "AAA",
          inPortfolio: true,
          previewChart: [
            { date: "2026-02-01", price: 100 },
            { date: "2026-03-01", price: 85 },
          ],
        }),
        makeCard({
          providerKey: "held-gain",
          symbol: "BBB",
          inPortfolio: true,
          previewChart: [
            { date: "2026-02-01", price: 100 },
            { date: "2026-03-01", price: 112 },
          ],
        }),
      ],
      "1M"
    );

    expect(sections.lead?.card.providerKey).toBe("held-loss");
    expect(sections.portfolio.map((item) => item.card.providerKey)).toEqual([
      "held-loss",
      "held-gain",
    ]);
    expect(sections.dipCount).toBe(1);
  });

  it("keeps watchlist names in a separate section", () => {
    const sections = buildStockScreenerMonitoringSections(
      [
        makeCard({
          providerKey: "held",
          symbol: "AAA",
          inPortfolio: true,
        }),
        makeCard({
          providerKey: "watch",
          symbol: "ZZZ",
          isFavorite: true,
        }),
      ],
      "1M"
    );

    expect(sections.holdingCount).toBe(1);
    expect(sections.watchlistCount).toBe(1);
    expect(sections.portfolio[0]?.badges).toContain("W portfelu");
    expect(sections.watchlist[0]?.badges).toContain("Obserwowane");
  });

  it("falls back to watchlist names when no holdings exist", () => {
    const sections = buildStockScreenerMonitoringSections(
      [
        makeCard({
          providerKey: "watch-gain",
          symbol: "BBB",
          isFavorite: true,
          previewChart: [
            { date: "2026-02-01", price: 100 },
            { date: "2026-03-01", price: 130 },
          ],
        }),
        makeCard({
          providerKey: "watch-flat",
          symbol: "AAA",
          isFavorite: true,
        }),
      ],
      "1M"
    );

    expect(sections.lead?.card.providerKey).toBe("watch-gain");
    expect(sections.portfolio).toEqual([]);
    expect(sections.watchlist.map((item) => item.card.providerKey)).toEqual([
      "watch-gain",
      "watch-flat",
    ]);
  });
});
