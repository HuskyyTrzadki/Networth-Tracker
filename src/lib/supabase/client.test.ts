import { describe, expect, it, vi } from "vitest";

import { createClient } from "./client";
import { createBrowserClient } from "@supabase/ssr";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ mocked: true })),
}));

describe("createClient (browser)", () => {
  it("creates a browser client with env vars", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "test-key";

    const client = createClient();
    const createBrowserClientMock = vi.mocked(createBrowserClient);

    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-key",
    );
    expect(client).toEqual({ mocked: true });
  });
});
