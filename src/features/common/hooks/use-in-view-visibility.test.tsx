import { render, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useInViewVisibility } from "./use-in-view-visibility";

type ObserverCallback = IntersectionObserverCallback;

const originalIntersectionObserver = globalThis.IntersectionObserver;

function installIntersectionObserver() {
  let callback: ObserverCallback | null = null;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];

    constructor(nextCallback: ObserverCallback) {
      callback = nextCallback;
    }

    disconnect() {}

    observe() {}

    takeRecords() {
      return [];
    }

    unobserve() {}
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;

  return {
    hasCallback() {
      return callback !== null;
    },
    trigger(isIntersecting: boolean) {
      if (!callback) {
        throw new Error("IntersectionObserver callback not registered.");
      }

      callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    },
  };
}

afterEach(() => {
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

function VisibilityProbe() {
  const { ref, isInView } = useInViewVisibility();

  return <div ref={ref} data-in-view={String(isInView)} />;
}

describe("useInViewVisibility", () => {
  it("starts hidden when IntersectionObserver is available", () => {
    installIntersectionObserver();

    const { result } = renderHook(() => useInViewVisibility());

    expect(result.current.isInView).toBe(false);
  });

  it("reveals content after the observed element enters the viewport", async () => {
    const observer = installIntersectionObserver();

    const { container } = render(<VisibilityProbe />);

    await waitFor(() => {
      expect(observer.hasCallback()).toBe(true);
    });

    observer.trigger(true);

    await waitFor(() => {
      expect(container.firstChild).toHaveAttribute("data-in-view", "true");
    });
  });

  it("falls back to visible on browsers without IntersectionObserver", async () => {
    // Simulate older/non-browser environments that do not support the observer API.
    // @ts-expect-error Vitest allows mutating globals for environment simulation.
    globalThis.IntersectionObserver = undefined;

    const { result } = renderHook(() => useInViewVisibility());

    await waitFor(() => {
      expect(result.current.isInView).toBe(true);
    });
  });
});
