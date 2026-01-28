import { describe, expect, it } from "vitest";

import { createPortfolioStrict } from "./create-portfolio";

type QueryResult<T> = Promise<{
  data: T | null;
  error: { message: string; code?: string } | null;
}>;

const createSupabaseStub = <T>(result: QueryResult<T>) => {
  const query = {
    insert: () => ({
      select: () => ({
        single: () => result,
      }),
    }),
  };

  return {
    from: () => query,
  };
};

describe("createPortfolioStrict", () => {
  it("returns created portfolio data", async () => {
    const supabase = createSupabaseStub(
      Promise.resolve({
        data: { id: "p1", name: "Nowy", base_currency: "USD" },
        error: null,
      })
    );

    expect(
        createPortfolioStrict(supabase as never, "user-1", {
            name: "Nowy",
            baseCurrency: "USD",
        })
    ).resolves.toEqual({
        id: "p1",
        name: "Nowy",
        baseCurrency: "USD",
    });
  });

  it("throws a friendly message on unique constraint errors", async () => {
    const supabase = createSupabaseStub(
      Promise.resolve({
        data: null,
        error: { message: "duplicate", code: "23505" },
      })
    );

    expect(
        createPortfolioStrict(supabase as never, "user-1", {
            name: "Główny",
            baseCurrency: "PLN",
        })
    ).rejects.toThrow("Masz już portfel o takiej nazwie.");
  });
});
