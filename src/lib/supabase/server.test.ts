import { describe, expect, it, vi } from "vitest";

import { createClient } from "./server";
import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ mocked: true })),
}));

type CookieStore = Awaited<ReturnType<typeof cookies>>;

describe("createClient (server)", () => {
  it("creates a server client with cookie helpers", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "test-key";

    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    } as unknown as CookieStore;

    const client = createClient(cookieStore);
    const createServerClientMock = vi.mocked(createServerClient);

    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
    expect(client).toEqual({ mocked: true });
  });
});
