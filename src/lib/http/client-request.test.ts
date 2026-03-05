import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson } from "./client-request";

describe("requestJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed payload for successful responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const result = await requestJson("/api/test", {
      fallbackMessage: "fallback",
    });

    expect(result.response.status).toBe(200);
    expect(result.payload).toEqual({ ok: true });
  });

  it("sets content-type automatically when json body is provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await requestJson("/api/test", {
      method: "POST",
      json: { foo: "bar" },
      fallbackMessage: "fallback",
    });

    const call = fetchSpy.mock.calls[0];
    const init = call?.[1] as RequestInit;
    expect(init.body).toBe(JSON.stringify({ foo: "bar" }));
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("throws parsed client error for non-ok responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input.",
            requestId: "req-1",
          },
        }),
        { status: 400 }
      )
    );

    await expect(
      requestJson("/api/test", {
        fallbackMessage: "fallback",
      })
    ).rejects.toMatchObject({
      message: "Invalid input.",
      code: "VALIDATION_ERROR",
      requestId: "req-1",
      status: 400,
    });
  });

  it("returns non-ok responses when status is explicitly allowed", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ reason: "no-session" }), { status: 401 })
    );

    const result = await requestJson("/api/test", {
      fallbackMessage: "fallback",
      allowStatuses: [401],
    });

    expect(result.response.status).toBe(401);
    expect(result.payload).toEqual({ reason: "no-session" });
  });

  it("maps network failures to fallback client error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      requestJson("/api/test", {
        fallbackMessage: "Network fallback",
      })
    ).rejects.toMatchObject({
      message: "Network fallback",
    });
  });

  it("preserves abort errors so callers can ignore cancellations", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError")
    );

    await expect(
      requestJson("/api/test", {
        fallbackMessage: "fallback",
      })
    ).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
