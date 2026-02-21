import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

import { PUT } from "./route";
import { updateTransactionById } from "@/features/transactions/server/update-transaction";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedSupabase, parseJsonBody } from "@/lib/http/route-handler";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/features/transactions/server/delete-transaction-group", () => ({
  deleteTransactionGroupByTransactionId: vi.fn(),
}));

vi.mock("@/features/transactions/server/update-transaction", () => ({
  updateTransactionById: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/http/route-handler", () => ({
  getAuthenticatedSupabase: vi.fn(),
  parseJsonBody: vi.fn(),
  toErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error",
}));

describe("PUT /api/transactions/[transactionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getAuthenticatedSupabase).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    });

    const response = await PUT(new Request("http://localhost/api/transactions/tx-1"), {
      params: Promise.resolve({ transactionId: "tx-1" }),
    });

    expect(response.status).toBe(401);
    expect(vi.mocked(updateTransactionById)).not.toHaveBeenCalled();
  });

  it("validates and updates transaction", async () => {
    vi.mocked(getAuthenticatedSupabase).mockResolvedValueOnce({
      ok: true,
      supabase: { from: vi.fn() } as never,
      user: { id: "user-1" } as never,
    });
    vi.mocked(createAdminClient).mockReturnValue({ rpc: vi.fn() } as never);
    vi.mocked(parseJsonBody).mockResolvedValueOnce({
      ok: true,
      body: {
        type: "BUY",
        date: "2026-02-20",
        quantity: "1,5",
        price: "100,20",
        fee: "",
        notes: "Po korekcie",
        consumeCash: true,
        cashCurrency: "USD",
        fxFee: "0,5",
      },
    });
    vi.mocked(updateTransactionById).mockResolvedValueOnce({
      portfolioId: "portfolio-1",
      oldTradeDate: "2026-01-15",
      newTradeDate: "2026-02-20",
      groupId: "group-1",
      replacedCount: 2,
    });

    const response = await PUT(new Request("http://localhost/api/transactions/tx-1"), {
      params: Promise.resolve({ transactionId: "tx-1" }),
    });
    const payload = (await response.json()) as { replacedCount?: number };

    expect(response.status).toBe(200);
    expect(payload.replacedCount).toBe(2);
    expect(vi.mocked(updateTransactionById)).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user-1",
      "tx-1",
      expect.objectContaining({
        quantity: "1.5",
        price: "100.20",
        fee: "0",
        fxFee: "0.5",
      })
    );
  });

  it("returns 400 for invalid payload", async () => {
    vi.mocked(getAuthenticatedSupabase).mockResolvedValueOnce({
      ok: true,
      supabase: { from: vi.fn() } as never,
      user: { id: "user-1" } as never,
    });
    vi.mocked(parseJsonBody).mockResolvedValueOnce({
      ok: true,
      body: {
        type: "BUY",
      },
    });

    const response = await PUT(new Request("http://localhost/api/transactions/tx-1"), {
      params: Promise.resolve({ transactionId: "tx-1" }),
    });

    expect(response.status).toBe(400);
    expect(vi.mocked(updateTransactionById)).not.toHaveBeenCalled();
  });
});
