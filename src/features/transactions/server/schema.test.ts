import { describe, expect, it } from "vitest";

import { createTransactionRequestSchema } from "./schema";

const basePayload = {
  type: "BUY",
  date: "2024-01-01",
  quantity: "1,5",
  price: "100,00",
  fee: "",
  notes: "Test",
  portfolioId: "11111111-1111-4111-8111-111111111111",
  clientRequestId: "2d3d6f6b-8d2d-4a9b-9a7d-9d1c1a1b7b7b",
  instrument: {
    symbol: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
  },
} as const;

describe("createTransactionRequestSchema", () => {
  it("defaults provider to yahoo and normalizes decimals", () => {
    const parsed = createTransactionRequestSchema.parse(basePayload);

    expect(parsed.instrument.provider).toBe("yahoo");
    expect(parsed.quantity).toBe("1.5");
    expect(parsed.price).toBe("100.00");
    expect(parsed.fee).toBe("0");
  });

  it("requires portfolioId", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      portfolioId: undefined,
    });

    expect(result.success).toBe(false);
  });

  it("rejects future dates", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      date: "2999-01-01",
    });

    expect(result.success).toBe(false);
  });
});
