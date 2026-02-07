import { describe, expect, it } from "vitest";

import { getPortfolioSnapshotRows } from "./get-portfolio-snapshot-rows";

type QueryResult = {
  data: {
    bucket_date: string;
    total_value_pln: number;
    total_value_usd: number;
    total_value_eur: number;
    net_external_cashflow_pln: number;
    net_external_cashflow_usd: number;
    net_external_cashflow_eur: number;
    net_implicit_transfer_pln: number;
    net_implicit_transfer_usd: number;
    net_implicit_transfer_eur: number;
    is_partial_pln: boolean;
    is_partial_usd: boolean;
    is_partial_eur: boolean;
  }[] | null;
  error: { message: string } | null;
};

const createSupabaseStub = (results: QueryResult[]) => {
  const calls = {
    gte: [] as string[],
    eq: [] as string[],
    is: [] as string[],
    ranges: [] as Array<{ from: number; to: number }>,
  };

  let currentResultIndex = 0;

  const query = {
    select: () => query,
    eq: (column: string) => {
      calls.eq.push(column);
      return query;
    },
    gte: (column: string) => {
      calls.gte.push(column);
      return query;
    },
    order: () => query,
    range: (from: number, to: number) => {
      calls.ranges.push({ from, to });
      return query;
    },
    is: (column: string) => {
      calls.is.push(column);
      return query;
    },
    then: (resolve: (value: QueryResult) => unknown) => {
      const next =
        results[currentResultIndex] ??
        ({
          data: [],
          error: null,
        } satisfies QueryResult);
      currentResultIndex += 1;
      return resolve(next);
    },
  };

  const supabase = {
    from: () => query,
  };

  return { supabase, calls };
};

const baseRow = {
  bucket_date: "2026-02-05",
  total_value_pln: 1000,
  total_value_usd: 250,
  total_value_eur: 220,
  net_external_cashflow_pln: 100,
  net_external_cashflow_usd: 25,
  net_external_cashflow_eur: 20,
  net_implicit_transfer_pln: 0,
  net_implicit_transfer_usd: 0,
  net_implicit_transfer_eur: 0,
  is_partial_pln: false,
  is_partial_usd: false,
  is_partial_eur: false,
} as const;

describe("getPortfolioSnapshotRows", () => {
  it("applies date filter when days is provided", async () => {
    const { supabase, calls } = createSupabaseStub([
      {
        data: [baseRow],
        error: null,
      },
    ]);

    const result = await getPortfolioSnapshotRows(
      supabase as never,
      "ALL",
      null,
      30
    );

    expect(calls.gte).toEqual(["bucket_date"]);
    expect(result.rows).toHaveLength(1);
  });

  it("does not apply date filter when days is omitted", async () => {
    const { supabase, calls } = createSupabaseStub([
      {
        data: [baseRow],
        error: null,
      },
    ]);

    await getPortfolioSnapshotRows(supabase as never, "ALL", null);

    expect(calls.gte).toEqual([]);
  });

  it("filters by selected portfolio for portfolio scope", async () => {
    const { supabase, calls } = createSupabaseStub([
      {
        data: [baseRow],
        error: null,
      },
    ]);

    await getPortfolioSnapshotRows(
      supabase as never,
      "PORTFOLIO",
      "portfolio-1",
      7
    );

    expect(calls.eq).toEqual(["scope", "portfolio_id"]);
    expect(calls.is).toEqual([]);
  });

  it("filters by null portfolio for ALL scope", async () => {
    const { supabase, calls } = createSupabaseStub([
      {
        data: [baseRow],
        error: null,
      },
    ]);

    await getPortfolioSnapshotRows(supabase as never, "ALL", null, 7);

    expect(calls.eq).toEqual(["scope"]);
    expect(calls.is).toEqual(["portfolio_id"]);
  });

  it("paginates when more than 1000 rows are available", async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      ...baseRow,
      bucket_date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
    }));
    const secondPage = [
      {
        ...baseRow,
        bucket_date: "2026-02-06",
      },
    ];
    const { supabase, calls } = createSupabaseStub([
      { data: firstPage, error: null },
      { data: secondPage, error: null },
    ]);

    const result = await getPortfolioSnapshotRows(supabase as never, "ALL", null);

    expect(calls.ranges).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1999 },
    ]);
    expect(result.rows).toHaveLength(1001);
  });
});
