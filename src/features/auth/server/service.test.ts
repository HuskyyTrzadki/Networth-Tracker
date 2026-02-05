import { beforeEach, describe, expect, it, vi } from "vitest";
import type { cookies } from "next/headers";

import {
  exchangeOAuthCodeForSession,
  getAuthUser,
  signInAnonymously,
  signInWithEmailPassword,
  signOut,
  signUpWithEmailPassword,
  upgradeToEmailPassword,
} from "./service";

import { createClient } from "@/lib/supabase/server";
import {
  ensureProfileExists,
  markProfileUpgradedIfNeeded,
} from "./profiles";
import { ensureDefaultPortfolioExists } from "@/features/portfolio/server/default-portfolio";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./profiles", () => ({
  ensureProfileExists: vi.fn(),
  markProfileUpgradedIfNeeded: vi.fn(),
}));

vi.mock("@/features/portfolio/server/default-portfolio", () => ({
  ensureDefaultPortfolioExists: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(ensureDefaultPortfolioExists).toHaveBeenCalledWith(supabase, "u1");
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
    expect(ensureDefaultPortfolioExists).toHaveBeenCalledWith(supabase, "u2");
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
    expect(ensureDefaultPortfolioExists).toHaveBeenCalledWith(supabase, "u3");
    expect(markProfileUpgradedIfNeeded).toHaveBeenCalledWith(supabase, "u3");
  });

  it("signs in with email/password and marks upgraded", async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn(async () => ({
          data: { user: { id: "u4", is_anonymous: false } },
          error: null,
        })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);

    const result = await signInWithEmailPassword(cookieStore, {
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({ userId: "u4", isAnonymous: false });
    expect(ensureProfileExists).toHaveBeenCalledWith(supabase, "u4");
    expect(ensureDefaultPortfolioExists).toHaveBeenCalledWith(supabase, "u4");
    expect(markProfileUpgradedIfNeeded).toHaveBeenCalledWith(supabase, "u4");
  });

  it("signs up with email/password and ensures profile when session exists", async () => {
    const supabase = {
      auth: {
        signUp: vi.fn(async () => ({
          data: {
            user: { id: "u5", is_anonymous: false },
            session: { access_token: "token" },
          },
          error: null,
        })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);

    const result = await signUpWithEmailPassword(cookieStore, {
      email: "user@example.com",
      password: "password123",
      emailRedirectTo: "http://localhost:3000/api/auth/callback?next=/settings",
    });

    expect(result).toEqual({ userId: "u5", hasSession: true });
    expect(ensureProfileExists).toHaveBeenCalledWith(supabase, "u5");
    expect(ensureDefaultPortfolioExists).toHaveBeenCalledWith(supabase, "u5");
    expect(markProfileUpgradedIfNeeded).toHaveBeenCalledWith(supabase, "u5");
  });

  it("signs up with email/password and skips profile when session missing", async () => {
    const supabase = {
      auth: {
        signUp: vi.fn(async () => ({
          data: {
            user: { id: "u6", is_anonymous: false },
            session: null,
          },
          error: null,
        })),
      },
    };

    vi.mocked(createClient).mockReturnValue(supabase as never);

    const result = await signUpWithEmailPassword(cookieStore, {
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({ userId: "u6", hasSession: false });
    expect(ensureProfileExists).not.toHaveBeenCalled();
    expect(ensureDefaultPortfolioExists).not.toHaveBeenCalled();
    expect(markProfileUpgradedIfNeeded).not.toHaveBeenCalled();
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
