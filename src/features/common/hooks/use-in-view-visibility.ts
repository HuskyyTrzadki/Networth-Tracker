"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Options = Readonly<{
  rootMargin?: string;
  once?: boolean;
  threshold?: number;
}>;

type Result<T extends Element> = Readonly<{
  ref: React.RefObject<T | null>;
  isInView: boolean;
}>;

const subscribeToClientFallback = () => () => {};
const getServerFallbackValue = () => false;
const getClientFallbackValue = () =>
  typeof IntersectionObserver === "undefined";

export function useInViewVisibility<T extends Element = HTMLDivElement>({
  rootMargin = "220px 0px",
  once = true,
  threshold = 0.01,
}: Options = {}): Result<T> {
  const ref = useRef<T | null>(null);
  const supportsObserver = typeof IntersectionObserver !== "undefined";
  const fallbackInView = useSyncExternalStore(
    subscribeToClientFallback,
    getClientFallbackValue,
    getServerFallbackValue
  );
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!supportsObserver) {
      return;
    }

    if (isInView && once) {
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setIsInView(true);
        if (once) {
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isInView, once, rootMargin, supportsObserver, threshold]);

  return { ref, isInView: supportsObserver ? isInView : fallbackInView };
}
