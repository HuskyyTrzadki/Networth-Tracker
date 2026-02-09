import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

import { signUpWithEmailPassword } from "@/features/auth/server/service";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => undefined })),
}));

vi.mock("@/features/auth/server/service", () => ({
  signUpWithEmailPassword: vi.fn(async () => ({ userId: "u1", hasSession: false })),
}));

describe("POST /api/auth/signup/email", () => {
  it("passes onboarding callback as email redirect target", async () => {
    const request = new Request("http://localhost:3000/api/auth/signup/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(signUpWithEmailPassword)).toHaveBeenCalledTimes(1);

    const input = vi.mocked(signUpWithEmailPassword).mock.calls[0]?.[1];
    expect(input?.email).toBe("user@example.com");
    expect(input?.password).toBe("password123");
    expect(input?.emailRedirectTo).toBeDefined();
    expect(new URL(input?.emailRedirectTo ?? "").pathname).toBe("/api/auth/callback");
    expect(new URL(input?.emailRedirectTo ?? "").searchParams.get("next")).toBe(
      "/onboarding"
    );
  });
});
