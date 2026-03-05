import { beforeEach, describe, expect, it, vi } from "vitest";

import { listPortfolios } from "./list-portfolios";
import { listDemoPortfolioIds } from "./list-demo-portfolio-ids";

vi.mock("./list-demo-portfolio-ids", () => ({
  listDemoPortfolioIds: vi.fn(),
}));

type QueryResult<T> = Promise<{
  data: T[] | null;
  error: { message: string } | null;
}>;

const createSupabaseStub = <T, U>(
  portfolioResult: QueryResult<T>,
  demoResult: QueryResult<U> = Promise.resolve({ data: [], error: null })
) => {
  const createPortfolioQuery = () => ({
    select: () => ({
      is: () => ({
        order: () => portfolioResult,
      }),
    }),
  });

  return {
    from: (table: string) => {
      if (table === "demo_bundle_instance_portfolios") {
        return {
          select: () => demoResult,
        };
      }

      return createPortfolioQuery();
    },
  };
};

describe("listPortfolios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps rows into portfolio summaries", async () => {
    const supabase = createSupabaseStub(
      Promise.resolve({
        data: [
          {
            id: "p1",
            name: "Główny",
            base_currency: "PLN",
            is_tax_advantaged: true,
            created_at: "2026-01-01",
          },
        ],
        error: null,
      }),
      Promise.resolve({
        data: [{ portfolio_id: "p1" }],
        error: null,
      })
    );
    vi.mocked(listDemoPortfolioIds).mockResolvedValue(new Set(["p1"]));

    await expect(listPortfolios(supabase as never)).resolves.toEqual([
      {
        id: "p1",
        name: "Główny",
        baseCurrency: "PLN",
        isTaxAdvantaged: true,
        createdAt: "2026-01-01",
        isDemo: true,
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
    vi.mocked(listDemoPortfolioIds).mockResolvedValue(new Set());

    await expect(listPortfolios(supabase as never)).rejects.toThrow("boom");
  });
});
