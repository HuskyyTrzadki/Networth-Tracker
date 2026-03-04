import { describe, expect, it } from "vitest";

import { AppError } from "./app-error";
import { apiError, apiFromUnknownError } from "./api-error";

describe("api-error helpers", () => {
  it("builds RFC7807-lite payload with backward-compatible message alias", async () => {
    const response = apiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid input.",
      details: [{ field: "email" }],
      requestId: "req-1",
    });
    const payload = (await response.json()) as {
      message: string;
      error: { code: string; message: string; requestId: string; details?: unknown };
    };

    expect(response.status).toBe(400);
    expect(payload.message).toBe("Invalid input.");
    expect(payload.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Invalid input.",
      requestId: "req-1",
    });
    expect(payload.error.details).toEqual([{ field: "email" }]);
    expect(response.headers.get("X-Request-Id")).toBe("req-1");
  });

  it("maps AppError to explicit status and code", async () => {
    const response = apiFromUnknownError({
      error: new AppError({
        status: 404,
        code: "TRANSACTION_NOT_FOUND",
        message: "Missing transaction.",
      }),
    });
    const payload = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("TRANSACTION_NOT_FOUND");
    expect(payload.error.message).toBe("Missing transaction.");
  });

  it("maps unknown errors to 500", async () => {
    const response = apiFromUnknownError({
      error: new Error("driver timeout"),
      fallbackCode: "QUERY_FAILED",
    });
    const payload = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("QUERY_FAILED");
    expect(payload.error.message).toBe("Internal server error.");
  });
});
