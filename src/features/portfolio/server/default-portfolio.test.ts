import { describe, expect, it, vi } from "vitest";

import {
  ensureDefaultPortfolioExists,
  getDefaultPortfolioId,
} from "./default-portfolio";

type QueryResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

const createSupabaseStub = <T extends { id: string }>(options: {
  maybeSingle: () => QueryResult<T>;
  single?: () => QueryResult<T>;
}) => {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: () => options.maybeSingle(),
    upsert: () => ({
      select: () => ({
        single: () =>
          options.single?.() ??
          Promise.resolve({
            data: null,
            error: { message: "Missing upsert handler." },
          }),
      }),
    }),
  };

  return {
    from: () => query,
  };
};

describe("ensureDefaultPortfolioExists", () => {
  it("returns an existing portfolio id", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "portfolio-1" },
      error: null,
    });
    const supabase = createSupabaseStub({ maybeSingle });

    await expect(
      ensureDefaultPortfolioExists(supabase as never, "user-1")
    ).resolves.toBe("portfolio-1");
  });

  it("creates a default portfolio when missing", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const single = vi.fn().mockResolvedValue({
      data: { id: "portfolio-2" },
      error: null,
    });
    const supabase = createSupabaseStub({ maybeSingle, single });

    await expect(
      ensureDefaultPortfolioExists(supabase as never, "user-1")
    ).resolves.toBe("portfolio-2");
    expect(single).toHaveBeenCalled();
  });
});

describe("getDefaultPortfolioId", () => {
  it("returns the first portfolio id", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "portfolio-3" },
      error: null,
    });
    const supabase = createSupabaseStub({ maybeSingle });

    await expect(
      getDefaultPortfolioId(supabase as never, "user-1")
    ).resolves.toBe("portfolio-3");
  });

  it("throws when missing", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const supabase = createSupabaseStub({ maybeSingle });

    await expect(
      getDefaultPortfolioId(supabase as never, "user-1")
    ).rejects.toThrow("Brak portfela dla użytkownika.");
  });
});
