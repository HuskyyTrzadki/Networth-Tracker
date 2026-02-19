import { describe, expect, it } from "vitest";

import type { ValuedHolding } from "../../server/valuation";
import { sortHoldingsByValueDesc } from "./holdings-sort";

const holding = (
  input: Partial<ValuedHolding> & Pick<ValuedHolding, "instrumentId" | "symbol">
): ValuedHolding => ({
  instrumentId: input.instrumentId,
  provider: input.provider ?? "yahoo",
  symbol: input.symbol,
  name: input.name ?? input.symbol,
  exchange: input.exchange ?? null,
  currency: input.currency ?? "USD",
  logoUrl: input.logoUrl ?? null,
  instrumentType: input.instrumentType ?? null,
  quantity: input.quantity ?? "1",
  averageBuyPriceBase: input.averageBuyPriceBase ?? null,
  price: input.price ?? null,
  valueBase: input.valueBase ?? null,
  weight: input.weight ?? null,
  missingReason: input.missingReason ?? null,
});

describe("sortHoldingsByValueDesc", () => {
  it("sorts valued rows descending by base value", () => {
    const rows = sortHoldingsByValueDesc([
      holding({ instrumentId: "2", symbol: "BBB", valueBase: "10" }),
      holding({ instrumentId: "1", symbol: "AAA", valueBase: "25" }),
    ]);

    expect(rows.map((row) => row.symbol)).toEqual(["AAA", "BBB"]);
  });

  it("keeps valued rows before rows without valuation", () => {
    const rows = sortHoldingsByValueDesc([
      holding({ instrumentId: "2", symbol: "BBB", valueBase: null }),
      holding({ instrumentId: "1", symbol: "AAA", valueBase: "1" }),
    ]);

    expect(rows.map((row) => row.symbol)).toEqual(["AAA", "BBB"]);
  });

  it("sorts unvalued rows alphabetically by symbol", () => {
    const rows = sortHoldingsByValueDesc([
      holding({ instrumentId: "2", symbol: "ZZZ", valueBase: null }),
      holding({ instrumentId: "1", symbol: "AAA", valueBase: null }),
    ]);

    expect(rows.map((row) => row.symbol)).toEqual(["AAA", "ZZZ"]);
  });
});
