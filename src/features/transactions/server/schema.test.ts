import { describe, expect, it } from "vitest";

import { createTransactionRequestSchema, updateTransactionRequestSchema } from "./schema";

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
    providerKey: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
  },
} as const;

describe("createTransactionRequestSchema", () => {
  it("defaults provider to yahoo and normalizes decimals", () => {
    const parsed = createTransactionRequestSchema.parse(basePayload);

    expect(parsed.instrument).toBeDefined();
    expect(parsed.instrument!.provider).toBe("yahoo");
    expect(parsed.quantity).toBe("1.5");
    expect(parsed.price).toBe("100.00");
    expect(parsed.fee).toBe("0");
  });

  it("rejects payload without instrument selection", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      instrument: undefined,
      customInstrument: undefined,
    });

    expect(result.success).toBe(false);
  });

  it("rejects payload with both instrument and customInstrument", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      customInstrument: {
        name: "Mieszkanie",
        currency: "PLN",
        kind: "REAL_ESTATE",
        valuationKind: "COMPOUND_ANNUAL_RATE",
        annualRatePct: "5",
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts customInstrument and normalizes annual rate pct", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      instrument: undefined,
      type: "BUY",
      customInstrument: {
        name: "Mieszkanie",
        currency: "pln",
        kind: "REAL_ESTATE",
        valuationKind: "COMPOUND_ANNUAL_RATE",
        annualRatePct: "5,5",
        notes: "Test",
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.customInstrument).toBeDefined();
    expect(result.data.customInstrument!.annualRatePct).toBe("5.5");
  });

  it("accepts customInstrument with negative annual rate pct", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      instrument: undefined,
      type: "BUY",
      customInstrument: {
        name: "Samochód",
        currency: "pln",
        kind: "REAL_ESTATE",
        valuationKind: "COMPOUND_ANNUAL_RATE",
        annualRatePct: "-7,5",
        notes: "Test",
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.customInstrument).toBeDefined();
    expect(result.data.customInstrument!.annualRatePct).toBe("-7.5");
  });

  it("accepts customInstrument for non-real-estate kind", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      instrument: undefined,
      type: "BUY",
      customInstrument: {
        name: "Samochód",
        currency: "pln",
        kind: "CAR",
        valuationKind: "COMPOUND_ANNUAL_RATE",
        annualRatePct: "-12",
        notes: "Test",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects customInstrument annual rate pct out of range", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      instrument: undefined,
      type: "BUY",
      customInstrument: {
        name: "Samochód",
        currency: "pln",
        kind: "REAL_ESTATE",
        valuationKind: "COMPOUND_ANNUAL_RATE",
        annualRatePct: "-100",
        notes: "Test",
      },
    });

    expect(result.success).toBe(false);
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

  it("rejects dates earlier than hard lower bound", () => {
    const result = createTransactionRequestSchema.safeParse({
      ...basePayload,
      date: "2023-11-30",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateTransactionRequestSchema", () => {
  const baseUpdatePayload = {
    type: "BUY",
    date: "2024-01-01",
    quantity: "1,5",
    price: "100,00",
    fee: "",
    notes: "Test",
    consumeCash: true,
    cashCurrency: "usd",
    fxFee: "1,25",
  } as const;

  it("normalizes decimals and cash currency when consumeCash is enabled", () => {
    const parsed = updateTransactionRequestSchema.parse(baseUpdatePayload);

    expect(parsed.quantity).toBe("1.5");
    expect(parsed.price).toBe("100.00");
    expect(parsed.fee).toBe("0");
    expect(parsed.fxFee).toBe("1.25");
    expect(parsed.cashCurrency).toBe("usd");
  });

  it("rejects consumeCash without cash currency", () => {
    const result = updateTransactionRequestSchema.safeParse({
      ...baseUpdatePayload,
      cashCurrency: undefined,
    });

    expect(result.success).toBe(false);
  });

  it("accepts and normalizes custom annual rate pct", () => {
    const result = updateTransactionRequestSchema.safeParse({
      ...baseUpdatePayload,
      customAnnualRatePct: "-7,25",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.customAnnualRatePct).toBe("-7.25");
  });
});
