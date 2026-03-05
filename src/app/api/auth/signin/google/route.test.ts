import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { startGoogleSignIn } from "@/features/auth/server/service";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => undefined })),
}));

vi.mock("@/features/auth/server/service", () => ({
  startGoogleSignIn: vi.fn(async () => ({
    redirectUrl: "https://accounts.google.com/o/oauth2/v2/auth?mock=1",
  })),
}));

describe("GET /api/auth/signin/google", () => {
  it("returns provider redirect URL and safe callback for valid next", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/signin/google?next=%2Fportfolio%3Ffoo%3D1"
    );

    const response = await GET(request);
    const payload = (await response.json()) as { redirectUrl: string };

    expect(response.status).toBe(200);
    expect(payload.redirectUrl).toContain("accounts.google.com");
    expect(vi.mocked(startGoogleSignIn)).toHaveBeenCalledWith(
      expect.anything(),
      "http://localhost:3000/api/auth/callback?next=%2Fportfolio%3Ffoo%3D1"
    );
  });

  it("falls back to /portfolio for unsafe next", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/signin/google?next=https%3A%2F%2Fevil.com"
    );

    await GET(request);

    expect(vi.mocked(startGoogleSignIn)).toHaveBeenCalledWith(
      expect.anything(),
      "http://localhost:3000/api/auth/callback?next=%2Fportfolio"
    );
  });
});
