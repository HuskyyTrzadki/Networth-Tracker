import { describe, expect, it, vi } from "vitest";
import type { cookies } from "next/headers";

import {
  exchangeOAuthCodeForSession,
  getAuthUser,
  signInAnonymously,
  signOut,
  upgradeToEmailPassword,
} from "./service";

import { createClient } from "@/lib/supabase/server";
import {
  ensureProfileExists,
  markProfileUpgradedIfNeeded,
} from "./profiles";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./profiles", () => ({
  ensureProfileExists: vi.fn(),
  markProfileUpgradedIfNeeded: vi.fn(),
}));

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const cookieStore = {
  [Symbol.iterator]: () => new Map().entries(),
  size: 0,
  get: vi.fn(),
  getAll: vi.fn(() => []),
  has: vi.fn(() => false),
  set: vi.fn(),
  delete: vi.fn(),
  toString: vi.fn(() => ""),
} satisfies CookieStore;

describe("auth service", () => {
  it("signs in anonymously and ensures profile", async () => {
    const supabase = {
      auth: {
        signInAnonymously: vi.fn(async () => ({
          data: { user: { id: "u1", is_anonymous: true } },
          error: null,
        })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);

    const result = await signInAnonymously(cookieStore);

    expect(result).toEqual({ userId: "u1", isAnonymous: true });
    expect(createClient).toHaveBeenCalledWith(cookieStore);
    expect(ensureProfileExists).toHaveBeenCalledWith(supabase, "u1");
  });

  it("exchanges OAuth code and marks upgraded when not anonymous", async () => {
    const supabase = {
      auth: {
        exchangeCodeForSession: vi.fn(async () => ({
          data: { user: { id: "u2", is_anonymous: false } },
          error: null,
        })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);

    const result = await exchangeOAuthCodeForSession(cookieStore, "code");

    expect(result).toEqual({ userId: "u2", isAnonymous: false });
    expect(ensureProfileExists).toHaveBeenCalledWith(supabase, "u2");
    expect(markProfileUpgradedIfNeeded).toHaveBeenCalledWith(supabase, "u2");
  });

  it("signs out", async () => {
    const supabase = {
      auth: {
        signOut: vi.fn(async () => ({ data: null, error: null })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);
    await signOut(cookieStore);

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it("upgrades to email/password and marks upgraded", async () => {
    const supabase = {
      auth: {
        updateUser: vi.fn(async () => ({
          data: { user: { id: "u3", is_anonymous: false } },
          error: null,
        })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);

    const result = await upgradeToEmailPassword(cookieStore, {
      email: "a@b.com",
      password: "password123",
    });

    expect(result).toEqual({ userId: "u3" });
    expect(ensureProfileExists).toHaveBeenCalledWith(supabase, "u3");
    expect(markProfileUpgradedIfNeeded).toHaveBeenCalledWith(supabase, "u3");
  });

  it("returns null when getUser fails", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: null,
          error: { message: "nope" },
        })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);

    expect(await getAuthUser(cookieStore)).toBeNull();
  });
});
