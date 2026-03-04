import { describe, expect, it } from "vitest";

import { withRateLimit } from "./rate-limit";

describe("withRateLimit", () => {
  it("allows requests within window budget", () => {
    const request = new Request("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    });

    const result = withRateLimit(request, {
      id: `unit-${crypto.randomUUID()}`,
      limit: 2,
      windowMs: 60_000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.headers["X-RateLimit-Limit"]).toBe("2");
    expect(result.headers["X-RateLimit-Remaining"]).toBe("1");
  });

  it("blocks requests after limit is exceeded", async () => {
    const id = `unit-${crypto.randomUUID()}`;
    const request = new Request("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": "203.0.113.20",
      },
    });

    const first = withRateLimit(request, {
      id,
      limit: 1,
      windowMs: 60_000,
    });
    expect(first.ok).toBe(true);

    const second = withRateLimit(request, {
      id,
      limit: 1,
      windowMs: 60_000,
    });
    expect(second.ok).toBe(false);
    if (second.ok) return;

    const payload = (await second.response.json()) as {
      error: { code: string };
    };

    expect(second.response.status).toBe(429);
    expect(second.response.headers.get("Retry-After")).toBeTruthy();
    expect(payload.error.code).toBe("RATE_LIMITED");
  });
});
