import { describe, expect, it } from "vitest";

import { getRequestOrigin } from "./request-origin";

describe("getRequestOrigin", () => {
  it("uses forwarded host/proto when present", () => {
    const request = new Request("http://localhost:3000/api/auth/callback", {
      headers: {
        "x-forwarded-host": "portfolio.example.com",
        "x-forwarded-proto": "https",
      },
    });

    expect(getRequestOrigin(request)).toBe("https://portfolio.example.com");
  });

  it("uses first forwarded value when multiple are provided", () => {
    const request = new Request("http://localhost:3000/api/auth/callback", {
      headers: {
        "x-forwarded-host": "portfolio.example.com, internal.local",
        "x-forwarded-proto": "https, http",
      },
    });

    expect(getRequestOrigin(request)).toBe("https://portfolio.example.com");
  });

  it("falls back to request url origin", () => {
    const request = new Request("https://app.example.com/api/auth/callback");

    expect(getRequestOrigin(request)).toBe("https://app.example.com");
  });
});
