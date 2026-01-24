import { afterEach, describe, expect, it } from "vitest";

import { getSupabaseEnv } from "./env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getSupabaseEnv", () => {
  it("throws when env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    expect(() => getSupabaseEnv()).toThrow(/Missing Supabase env vars/);
  });

  it("returns values when env vars exist", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "test-key";

    expect(getSupabaseEnv()).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseKey: "test-key",
    });
  });
});
