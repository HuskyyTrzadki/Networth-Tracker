import { describe, expect, it } from "vitest";

import { deletePortfolioById } from "./delete-portfolio";

type QueryResult<TData> = Promise<{
  data: TData | null;
  error: { message: string } | null;
  count?: number | null;
}>;

const createSupabaseUserStub = (result: QueryResult<{ id: string; name: string }>) => {
  const query = {
    select: () => query,
    match: () => query,
    is: () => query,
    maybeSingle: () => result,
  };

  return {
    from: () => query,
  };
};

const createSupabaseAdminStub = (
  transactionsResult: QueryResult<null>,
  portfolioDeleteResult: QueryResult<null>
) => {
  const transactionsQuery = {
    delete: () => transactionsQuery,
    match: () => transactionsResult,
  };

  const portfoliosQuery = {
    delete: () => portfoliosQuery,
    match: () => portfoliosQuery,
    is: () => portfolioDeleteResult,
  };

  return {
    from: (table: string) => {
      if (table === "transactions") {
        return transactionsQuery;
      }
      if (table === "portfolios") {
        return portfoliosQuery;
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
};

describe("deletePortfolioById", () => {
  it("deletes portfolio and returns deleted transaction count", async () => {
    const supabaseUser = createSupabaseUserStub(
      Promise.resolve({
        data: { id: "p-1", name: "Główny" },
        error: null,
      })
    );
    const supabaseAdmin = createSupabaseAdminStub(
      Promise.resolve({
        data: null,
        error: null,
        count: 3,
      }),
      Promise.resolve({
        data: null,
        error: null,
        count: 1,
      })
    );

    await expect(
      deletePortfolioById(
        supabaseUser as never,
        supabaseAdmin as never,
        "user-1",
        "p-1"
      )
    ).resolves.toEqual({
      portfolioId: "p-1",
      deletedTransactionsCount: 3,
    });
  });

  it("throws when portfolio is missing for the user", async () => {
    const supabaseUser = createSupabaseUserStub(
      Promise.resolve({
        data: null,
        error: null,
      })
    );
    const supabaseAdmin = createSupabaseAdminStub(
      Promise.resolve({
        data: null,
        error: null,
        count: 0,
      }),
      Promise.resolve({
        data: null,
        error: null,
        count: 0,
      })
    );

    await expect(
      deletePortfolioById(
        supabaseUser as never,
        supabaseAdmin as never,
        "user-1",
        "p-missing"
      )
    ).rejects.toThrow("Portfel nie istnieje albo nie masz do niego dostępu.");
  });
});
