import { describe, expect, it } from "vitest";

import { parseApiError, toClientError } from "./client-error";

describe("client-error", () => {
  it("parses RFC7807-lite payload", () => {
    const parsed = parseApiError(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input.",
          requestId: "req-1",
          details: [{ field: "email" }],
        },
      },
      "fallback"
    );

    expect(parsed).toEqual({
      code: "VALIDATION_ERROR",
      message: "Invalid input.",
      requestId: "req-1",
      details: [{ field: "email" }],
    });
  });

  it("falls back to legacy message payload", () => {
    const parsed = parseApiError({ message: "Legacy message." }, "fallback");
    expect(parsed.message).toBe("Legacy message.");
  });

  it("builds typed client error", () => {
    const error = toClientError(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests.",
          requestId: "req-2",
        },
      },
      "fallback",
      429
    );

    expect(error.message).toBe("Too many requests.");
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.requestId).toBe("req-2");
    expect(error.status).toBe(429);
  });
});
