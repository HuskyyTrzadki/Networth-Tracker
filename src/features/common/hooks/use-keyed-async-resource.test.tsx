import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useKeyedAsyncResource } from "./use-keyed-async-resource";

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}>;

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

describe("useKeyedAsyncResource", () => {
  it("returns idle state when request key is missing", () => {
    const load = vi.fn(() => Promise.resolve("ok"));
    const { result } = renderHook(() =>
      useKeyedAsyncResource({
        requestKey: null,
        load,
      })
    );

    expect(result.current.status).toBe("idle");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it("loads and returns data for the active request key", async () => {
    const deferred = createDeferred<string>();
    const load = vi.fn(() => deferred.promise);

    const { result } = renderHook(() =>
      useKeyedAsyncResource({
        requestKey: "alpha",
        load,
      })
    );

    expect(result.current.status).toBe("loading");
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.resolve("done");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("done");
      expect(result.current.errorMessage).toBeNull();
    });
  });

  it("ignores stale responses after request key changes", async () => {
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const { result, rerender } = renderHook(
      ({ requestKey }: { requestKey: string | null }) =>
        useKeyedAsyncResource({
          requestKey,
          load,
        }),
      { initialProps: { requestKey: "first" } }
    );

    rerender({ requestKey: "second" });

    await act(async () => {
      first.resolve("old");
    });

    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();

    await act(async () => {
      second.resolve("new");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("new");
    });
  });

  it("maps errors with custom message resolver", async () => {
    const deferred = createDeferred<string>();
    const load = vi.fn(() => deferred.promise);

    const { result } = renderHook(() =>
      useKeyedAsyncResource({
        requestKey: "err",
        load,
        getErrorMessage: () => "Błąd testowy",
      })
    );

    await act(async () => {
      deferred.reject(new Error("raw"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.errorMessage).toBe("Błąd testowy");
      expect(result.current.data).toBeNull();
    });
  });
});
