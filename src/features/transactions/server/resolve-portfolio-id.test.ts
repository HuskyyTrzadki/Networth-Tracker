import { describe, expect, it, vi } from "vitest";

import { resolvePortfolioId } from "./resolve-portfolio-id";
import { getDefaultPortfolioId } from "@/features/portfolio/server/default-portfolio";

vi.mock("@/features/portfolio/server/default-portfolio", () => ({
  getDefaultPortfolioId: vi.fn(),
}));

describe("resolvePortfolioId", () => {
  it("returns selected portfolio id when provided", async () => {
    const result = await resolvePortfolioId({
      searchParams: { portfolio: "portfolio-123" },
      supabase: {} as never,
      userId: "user-1",
    });

    expect(result).toBe("portfolio-123");
    expect(getDefaultPortfolioId).not.toHaveBeenCalled();
  });

  it("falls back to default when missing", async () => {
    vi.mocked(getDefaultPortfolioId).mockResolvedValue("default-1");

    const result = await resolvePortfolioId({
      searchParams: {},
      supabase: {} as never,
      userId: "user-1",
    });

    expect(result).toBe("default-1");
    expect(getDefaultPortfolioId).toHaveBeenCalledWith({} as never, "user-1");
  });

  it("treats all as missing", async () => {
    vi.mocked(getDefaultPortfolioId).mockResolvedValue("default-2");

    const result = await resolvePortfolioId({
      searchParams: { portfolio: "all" },
      supabase: {} as never,
      userId: "user-2",
    });

    expect(result).toBe("default-2");
  });
});
