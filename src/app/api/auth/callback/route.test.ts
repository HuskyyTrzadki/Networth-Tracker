import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

import { exchangeOAuthCodeForSession } from "@/features/auth/server/service";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => undefined })),
}));

vi.mock("@/features/auth/server/service", () => ({
  exchangeOAuthCodeForSession: vi.fn(async () => ({ userId: "u1", isAnonymous: false })),
}));

describe("GET /api/auth/callback", () => {
  it("exchanges code and redirects to safe next", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=abc&next=%2Fsettings"
    );

    const response = await GET(request);

    expect(vi.mocked(exchangeOAuthCodeForSession)).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/settings");
  });

  it("redirects to fallback when next is unsafe", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=abc&next=https%3A%2F%2Fevil.com"
    );

    const response = await GET(request);
    expect(response.headers.get("location")).toBe("http://localhost:3000/settings");
  });

  it("adds auth=error when exchange fails", async () => {
    vi.mocked(exchangeOAuthCodeForSession).mockRejectedValueOnce(new Error("fail"));
    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=abc&next=%2Fsettings"
    );

    const response = await GET(request);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/settings?auth=error"
    );
  });
});
