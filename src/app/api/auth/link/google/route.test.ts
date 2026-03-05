import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { startGoogleIdentityLink } from "@/features/auth/server/service";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => undefined })),
}));

vi.mock("@/features/auth/server/service", () => ({
  startGoogleIdentityLink: vi.fn(async () => ({
    redirectUrl: "https://accounts.google.com/o/oauth2/v2/auth?mock=1",
  })),
}));

describe("GET /api/auth/link/google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns provider redirect URL and safe callback for valid next", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/link/google?next=%2Fsettings%3Ftab%3Dsecurity"
    );

    const response = await GET(request);
    const payload = (await response.json()) as { redirectUrl: string };

    expect(response.status).toBe(200);
    expect(payload.redirectUrl).toContain("accounts.google.com");
    expect(vi.mocked(startGoogleIdentityLink)).toHaveBeenCalledWith(
      expect.anything(),
      "http://localhost:3000/api/auth/callback?next=%2Fsettings%3Ftab%3Dsecurity"
    );
  });

  it("falls back to /settings for unsafe next", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/link/google?next=https%3A%2F%2Fevil.com"
    );

    await GET(request);

    expect(vi.mocked(startGoogleIdentityLink)).toHaveBeenCalledWith(
      expect.anything(),
      "http://localhost:3000/api/auth/callback?next=%2Fsettings"
    );
  });

  it("returns 401 for unauthorized linking attempt", async () => {
    vi.mocked(startGoogleIdentityLink).mockRejectedValueOnce(new Error("Unauthorized."));
    const request = new Request("http://localhost:3000/api/auth/link/google");

    const response = await GET(request);
    const payload = (await response.json()) as {
      error: { code: string; message: string };
      message: string;
    };

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("AUTH_GOOGLE_LINK_START_FAILED");
    expect(payload.error.message).toBe("Unauthorized.");
    expect(payload.message).toBe("Unauthorized.");
  });
});
