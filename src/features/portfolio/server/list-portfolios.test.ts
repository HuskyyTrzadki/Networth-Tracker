import { describe, expect, it } from "vitest";

import { listPortfolios } from "./list-portfolios";

type QueryResult<T> = Promise<{
  data: T[] | null;
  error: { message: string } | null;
}>;

const createSupabaseStub = <T>(result: QueryResult<T>) => {
  const query = {
    select: () => query,
    eq: () => query,
    is: () => query,
    order: () => result,
  };

  return {
    from: () => query,
  };
};

describe("listPortfolios", () => {
  it("maps rows into portfolio summaries", async () => {
    const supabase = createSupabaseStub(
      Promise.resolve({
        data: [
          {
            id: "p1",
            name: "Główny",
            base_currency: "PLN",
            created_at: "2026-01-01",
          },
        ],
        error: null,
      })
    );

    await expect(listPortfolios(supabase as never, "user-1")).resolves.toEqual([
      {
        id: "p1",
        name: "Główny",
        baseCurrency: "PLN",
        createdAt: "2026-01-01",
      },
    ]);
  });

  it("throws when Supabase returns an error", async () => {
    const supabase = createSupabaseStub(
      Promise.resolve({
        data: null,
        error: { message: "boom" },
      })
    );

    await expect(listPortfolios(supabase as never, "user-1")).rejects.toThrow(
      "boom"
    );
  });
});
