import { describe, expect, it, vi } from "vitest";

import { createClient } from "./middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ mocked: true })),
}));

describe("createClient (middleware)", () => {
  it("creates a server client and applies cookie updates onto the provided response", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "test-key";

    const request = {
      cookies: {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      },
    };
    const response = {
      cookies: {
        set: vi.fn(),
      },
    };

    const createServerClientMock = vi.mocked(createServerClient);
    const result = createClient(request, response);

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
    expect(result.response).toBe(response);
    expect(result.supabase).toEqual({ mocked: true });

    const createOptions = createServerClientMock.mock.calls[0]?.[2];
    if (!createOptions?.cookies.setAll) {
      throw new Error("Expected Supabase client to be created with cookies.setAll");
    }

    createOptions.cookies.setAll([
      {
        name: "sb-access-token",
        value: "token",
        options: { path: "/" } satisfies CookieOptions,
      },
    ]);

    expect(request.cookies.set).toHaveBeenCalledWith("sb-access-token", "token");
    expect(response.cookies.set).toHaveBeenCalledWith(
      "sb-access-token",
      "token",
      { path: "/" },
    );
  });
});
